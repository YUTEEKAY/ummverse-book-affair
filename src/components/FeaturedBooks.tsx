import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BookCard from './BookCard';

export default function FeaturedBooks() {
  const { data: books } = useQuery({
    queryKey: ['featured-books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('books').select('*').not('featured_slot', 'is', null).order('featured_slot').limit(3);
      if (error) throw error;
      return data;
    },
    staleTime: 0,
  });
  if (!books?.length) return null;
  return <section aria-label="Featured books" className="border-b border-border bg-secondary/30">
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="mb-3 text-sm font-medium uppercase text-primary">The editor’s shelf</p>
      <h2 className="mb-8 font-serif text-3xl font-semibold sm:text-4xl">Featured books</h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {books.map(book => <div className="mx-auto w-full max-w-64 sm:max-w-none" key={book.id}><BookCard book={book} /></div>)}
      </div>
    </div>
  </section>;
}