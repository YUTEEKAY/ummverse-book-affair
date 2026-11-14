import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Share2, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import BookCover from "./BookCover";
type VibeBook = { id: string; title: string; author: string; cover_url?: string | null; isbn?: string | null; isbn13?: string | null; mood?: string | null; genre?: string | null };
export default function ShareBookVibe({ book }: { book: VibeBook }) {
  const card = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const exportCard = async (mode: "share" | "download" | "copy") => {
    if (!card.current) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(card.current.querySelectorAll("img")).map(img => img.decode().catch(() => undefined)));
      const canvas = await html2canvas(card.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Couldn't create your card.");
      const file = new File([blob], "ummverse-book-vibe.png", { type: "image/png" });
      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${book.title} — My Book Vibe`, text: `Found on Ummverse: ${book.title} by ${book.author}` });
      } else if (mode === "copy" && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast.success("Book vibe card copied.");
      } else {
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast.success("Book vibe card downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn't export the card. Please try again once the cover has loaded.");
    } finally { setBusy(false); }
  };
  return <section className="space-y-4 border-y border-border py-6">
    <h3 className="text-center font-serif text-2xl font-semibold">Share My Book Vibe</h3>
    <div ref={card} className="vibe-share-card editorial-field--mystical relative mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-md px-6 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest">My next chapter</p>
      <div className="relative aspect-[2/3] w-36 overflow-hidden rounded-md"><BookCover book={book} eager /></div>
      <h4 className="max-w-full break-words font-serif text-2xl font-semibold leading-tight">{book.title}</h4>
      <p className="text-sm">{book.author}</p>
      <div className="flex flex-wrap justify-center gap-2">{(book.mood ?? "Romance").split(/[;,]/).slice(0,3).map(tag => <span key={tag} className="rounded-full border border-current px-3 py-1 text-xs">{tag.trim()}</span>)}</div>
      <p className="mt-2 border-t border-current pt-4 font-serif text-sm">Found on Ummverse</p>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <Button disabled={busy} onClick={() => exportCard("share")}><Share2 className="mr-2 h-4 w-4" />{busy ? "Creating…" : "Share My Book Vibe"}</Button>
      <Button variant="outline" disabled={busy} onClick={() => exportCard("copy")}><Copy className="mr-2 h-4 w-4" />Copy Image</Button>
      <Button variant="outline" size="icon" title="Download image" aria-label="Download vibe image" disabled={busy} onClick={() => exportCard("download")}><Download className="h-4 w-4" /></Button>
    </div>
  </section>;
}
