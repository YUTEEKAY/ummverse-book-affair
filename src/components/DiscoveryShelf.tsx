import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BookCard from "./BookCard";
import BookCover from "./BookCover";
import HeatLevelBadge from "./HeatLevelBadge";

const filters = ["All", "Cozy & Comforting", "Spicy & Steamy", "Enemies to Lovers", "Morally Grey", "Slow Burn", "Nigerian Romance", "Dark & Obsessive"];
export default function DiscoveryShelf({ onQuiz }: { onQuiz: () => void }) {
  const [filter, setFilter] = useState("All");
  const [books, setBooks] = useState<any[]>([]);
  const [spotlight, setSpotlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      let query = supabase.from("books").select("id,title,author,cover_url,isbn,isbn13,rating,genre,mood,trope,heat_level,summary");
      if (filter === "Nigerian Romance") query = query.eq("import_source", "curated_nigerian");
      else if (filter === "Dark & Obsessive") query = query.eq("mood", "Dark & Intense");
      else if (["Cozy & Comforting", "Spicy & Steamy"].includes(filter)) query = query.eq("mood", filter);
      else if (filter !== "All") query = query.ilike("trope", `%${filter}%`);
      const { data } = await query.order("rating", { ascending: false, nullsFirst: false }).limit(12);
      const rows = data ?? [];
      const counts = rows.length ? await supabase.rpc("get_book_reader_counts", { _book_ids: rows.map(b => b.id) }) : { data: [] };
      const map = new Map((counts.data ?? []).map(r => [r.book_id, Number(r.readers)]));
      if (!active) return;
      setBooks(rows.map(b => ({ ...b, reader_count: map.get(b.id) ?? 0 })));
      if (filter === "All" && rows.length) setSpotlight(rows[Math.floor(Date.now()/86400000) % rows.length]);
      setLoading(false);
    };
    run(); return () => { active = false; };
  }, [filter]);
  return <section className="mx-auto max-w-7xl px-6 py-14" aria-label="Discover books">
    {spotlight && <div className="mb-14 grid items-center gap-8 border-y border-border py-10 sm:grid-cols-[160px_1fr]">
      <Link to={`/book/${spotlight.id}`} className="relative mx-auto block aspect-[2/3] w-40 overflow-hidden rounded-md shadow-soft"><BookCover book={spotlight} /></Link>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Today's Mood Pick</p>
        <h2 className="font-serif text-3xl font-semibold">{spotlight.title}</h2>
        <p className="text-sm text-muted-foreground">{spotlight.author} · {spotlight.mood}</p>
        <HeatLevelBadge heatLevel={spotlight.heat_level} />
        <p className="line-clamp-2 max-w-2xl text-muted-foreground">{spotlight.summary}</p>
        <Button onClick={onQuiz}>Take the Vibe Quiz <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>}
    <h2 className="mb-6 font-serif text-3xl font-semibold">Find your next obsession.</h2>
    <div className="mb-7 flex gap-2 overflow-x-auto pb-2" aria-label="Quick book filters">
      {filters.map(name => <Button key={name} size="sm" variant={filter === name ? "default" : "outline"} aria-pressed={filter === name} className="shrink-0 rounded-full" onClick={() => setFilter(name)}>{name}</Button>)}
    </div>
    {loading ? <div className="py-12 text-center text-muted-foreground">Loading books…</div> : books.length === 0 ? <p className="py-12 text-muted-foreground">No books with this tag yet.</p> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{books.map(book => <BookCard key={book.id} book={book} />)}</div>}
  </section>;
}