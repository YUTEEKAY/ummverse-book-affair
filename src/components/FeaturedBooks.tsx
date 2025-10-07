import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Book {
  id: string;
  title: string;
  author: string;
  summary: string | null;
  cover_url: string | null;
  genre: string | null;
  trope: string | null;
  heat_level: string | null;
  rating: number | null;
}

const FeaturedBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("rating", { ascending: false })
        .limit(6);
      
      if (data && !error) {
        setBooks(data);
      }
    };

    fetchBooks();
  }, []);

  const getHeatIcons = (level: string | null) => {
    if (!level) return null;
    const count = parseInt(level) || 1;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Flame key={i} className="w-4 h-4 text-primary fill-primary" />
        ))}
      </div>
    );
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Featured Reads
          </h2>
          <p className="text-xl text-muted-foreground">
            Handpicked stories that stole our hearts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                No books yet. Start adding your favorite romance reads!
              </p>
            </div>
          ) : (
            books.map((book) => (
              <Card 
                key={book.id} 
                className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1 border-none bg-card"
              >
                <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center gradient-romance">
                      <Heart className="w-20 h-20 text-white/40" />
                    </div>
                  )}
                  {book.heat_level && (
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                      {getHeatIcons(book.heat_level)}
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-muted-foreground mb-3">{book.author}</p>
                  
                  {book.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {book.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.genre && (
                      <Badge variant="secondary" className="text-xs">
                        {book.genre}
                      </Badge>
                    )}
                    {book.trope && (
                      <Badge variant="outline" className="text-xs">
                        {book.trope}
                      </Badge>
                    )}
                  </div>

                  {book.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-medium">
                        {book.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button 
                    className="w-full gradient-romance shadow-soft"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;
