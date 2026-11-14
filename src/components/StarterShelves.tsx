import { useEffect, useState } from "react";
import { starterShelves } from "@/lib/starterShelves";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BookCard from "./BookCard";
export default function StarterShelves() {
  const [books, setBooks] = useState<any[]>([]);
  const [tags, setTags] = useState<Record<string,string>>({});
  useEffect(() => {
    let active = true;
    supabase.from("books").select("id,title,author,cover_url,isbn,isbn13,rating,genre,mood,trope,heat_level").in("id", [...new Set(starterShelves.flatMap(s => s.books))]).then(({data}) => { if (active) setBooks(data ?? []); });
    return () => { active = false; };
  }, []);
  return <section className="mx-auto max-w-7xl space-y-12 px-6 py-12" aria-label="Starter Shelves">
    <h2 className="font-serif text-3xl font-semibold">Starter Shelves</h2>
    {starterShelves.map(shelf => {
      const selected = tags[shelf.title];
      const rows = shelf.books.map(id => books.find(b => b.id === id)).filter(Boolean).filter(b => !selected || selected === "Nigerian stories" || selected === "City life" || [b.genre,b.mood,b.trope].some(value => value?.includes(selected)));
      return <div key={shelf.title} className="space-y-4 border-t border-border pt-6">
        <h3 className="font-serif text-2xl font-semibold">{shelf.title}</h3>
        <p className="max-w-xl text-sm text-muted-foreground">{shelf.description}</p>
        <div className="flex flex-wrap gap-2">{shelf.tags.map(tag => <Button key={tag} size="sm" variant={selected === tag ? "default" : "outline"} aria-pressed={selected === tag} className="rounded-full" onClick={() => setTags(t => ({ ...t, [shelf.title]: selected === tag ? "" : tag }))}>{tag}</Button>)}</div>
        <div className="flex gap-5 overflow-x-auto pb-3">{rows.map(book => <div key={book.id} className="w-44 shrink-0 sm:w-48"><BookCard book={book} /></div>)}</div>
        {books.length > 0 && !rows.length && <p className="text-sm text-muted-foreground">No books with this tag on this shelf.</p>}
      </div>;
    })}
  </section>;
}
