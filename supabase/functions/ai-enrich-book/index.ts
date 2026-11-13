import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "npm:ai";
import { z } from "npm:zod";

const QUIZ_MOODS = [
  "Cozy & Comforting", "Spicy & Steamy", "Magical & Enchanting", "Sweeping & Epic",
  "Dark & Intense", "Playful", "Bittersweet",
];
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

const Body = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  author: z.string().trim().max(200).optional(),
  book_id: z.string().uuid().optional(),
}).refine((b) => b.title || b.book_id, "Provide a title or book_id");

const Enrichment = z.object({
  description: z.string(),
  genres: z.array(z.string()),
  mood_tags: z.array(z.string()),
  themes: z.array(z.string()),
  isbn13: z.string().nullable(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function imageOk(url: string) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.ok && Number(r.headers.get("content-length") ?? "1000") > 1000;
  } catch { return false; }
}

async function findCover(title: string, author: string | undefined, isbns: (string | null | undefined)[]) {
  for (const isbn of isbns) {
    const clean = isbn?.replace(/[^0-9X]/gi, "");
    if (!clean) continue;
    const url = `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg?default=false`;
    if (await imageOk(url)) return { cover_url: url, isbn13: clean.length === 13 ? clean : null };
  }
  try {
    const q = new URLSearchParams({ title, limit: "5", fields: "cover_i,isbn" });
    if (author) q.set("author", author);
    const r = await fetch(`https://openlibrary.org/search.json?${q}`);
    if (r.ok) {
      const d = await r.json();
      const doc = (d.docs ?? []).find((x: any) => x.cover_i);
      if (doc) {
        const isbn13 = (doc.isbn ?? []).find((i: string) => i.length === 13) ?? null;
        return { cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`, isbn13 };
      }
    }
  } catch (e) { console.error("Open Library search failed", e); }
  return { cover_url: null, isbn13: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: claims, error: authErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (authErr || !claims?.claims?.sub) return json({ error: "Please sign in as an admin." }, 401);
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
  if (!isAdmin) return json({ error: "Admins only." }, 403);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  let { title, author, book_id } = parsed.data;

  let existing: any = null;
  if (book_id) {
    const { data, error } = await userClient.from("books").select("id,title,author,isbn,isbn13,summary").eq("id", book_id).maybeSingle();
    if (error || !data) return json({ error: "Book not found." }, 404);
    existing = data; title = data.title; author = data.author;
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI is not configured." }, 500);

  let runId = req.headers.get(RUN_ID)?.trim() || undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const h = new Headers(init?.headers);
      if (runId && !h.has(RUN_ID)) h.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers: h });
      runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
      return res;
    },
  });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: `You are a romance-book expert writing for Ummverse, a mood-based romance discovery site.
Return: description = a compelling, spoiler-free 2-3 sentence synopsis; genres = 1-3 genres (e.g. "Contemporary Romance", "Fantasy Romance");
mood_tags = 1-3 values chosen ONLY from: ${QUIZ_MOODS.join(" | ")}, best fit first; themes = 3-5 short themes;
isbn13 = a known ISBN-13 for a common English edition, or null if unsure. Never invent a book; if unknown, base it on the title cautiously.`,
      messages: [{ role: "user", content: `Title: ${title}\nAuthor: ${author || "unknown"}${existing?.summary ? `\nExisting summary: ${existing.summary.slice(0, 800)}` : ""}` }],
      output: Output.object({ schema: Enrichment }),
      abortSignal: req.signal,
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
    });
    // drain the stream, then read the typed object
    for await (const _ of result.textStream) { /* consume */ }
    const ai = await result.output;

    const mood_tags = ai.mood_tags.filter((m) => QUIZ_MOODS.includes(m));
    const cover = await findCover(title!, author, [existing?.isbn13, existing?.isbn, ai.isbn13]);
    const enrichment = {
      description: ai.description.trim(),
      genres: ai.genres.slice(0, 3),
      mood_tags,
      themes: ai.themes.slice(0, 5),
      cover_url: cover.cover_url,
      isbn13: existing?.isbn13 || cover.isbn13 || ai.isbn13,
    };

    if (book_id) {
      const update: Record<string, unknown> = { summary: enrichment.description, api_source: "lovable_ai" };
      if (enrichment.genres[0]) update.genre = enrichment.genres[0];
      if (mood_tags[0]) update.mood = mood_tags[0];
      if (enrichment.cover_url) update.cover_url = enrichment.cover_url;
      if (!existing.isbn13 && enrichment.isbn13) update.isbn13 = enrichment.isbn13;
      const { error } = await userClient.from("books").update(update).eq("id", book_id);
      if (error) return json({ error: `Couldn't save: ${error.message}` }, 500);
    }
    const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
    if (runId) headers[RUN_ID] = runId;
    return new Response(JSON.stringify({ enrichment, saved: !!book_id }), { headers });
  } catch (e: any) {
    if (NoObjectGeneratedError.isInstance(e)) return json({ error: "AI returned an unexpected answer. Try again." }, 502);
    const status = e?.statusCode ?? e?.status;
    if (status === 402) return json({ error: "AI credits have run out. Add credits in Settings → Plans & credits." }, 402);
    if (status === 429) return json({ error: "AI is busy right now. Please wait a moment and try again." }, 429);
    if (status === 403) return json({ error: e?.responseBody ?? "AI access was denied." }, 403);
    if (req.signal.aborted) return json({ error: "Cancelled" }, 499);
    console.error("ai-enrich-book failed", status, e?.responseBody ?? e);
    return json({ error: "AI enrichment failed. Please try again." }, typeof status === "number" ? status : 500);
  }
});
