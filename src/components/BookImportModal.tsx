import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus } from "lucide-react";
import BookCoverPlaceholder from "./BookCoverPlaceholder";

interface BookImportModalProps {
  onImportSuccess?: () => void;
}

const BookImportModal = ({ onImportSuccess }: BookImportModalProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Search fields
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  
  // Book data from API
  const [bookData, setBookData] = useState<any>(null);
  
  // Additional fields for saving
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [trope, setTrope] = useState("");
  const [heatLevel, setHeatLevel] = useState("");
  const [affiliateHarlequin, setAffiliateHarlequin] = useState("");
  const [affiliateAmazon, setAffiliateAmazon] = useState("");
  const [affiliateBarnes, setAffiliateBarnes] = useState("");
  const [affiliateKobo, setAffiliateKobo] = useState("");

  const handleSearch = async () => {
    if (!searchTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a book title to search.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-book-data', {
        body: {
          title: searchTitle,
          author: searchAuthor,
          forceRefresh: true
        }
      });

      if (error) throw error;

      if (data.api_source === 'not_found') {
        toast({
          title: "No results found",
          description: "Try a different title or author name.",
          variant: "destructive"
        });
        setBookData(null);
      } else {
        setBookData(data);
        toast({
          title: "Book found!",
          description: `Found via ${data.api_source.replace('_', ' ')}`
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!bookData) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.from('books').insert({
        title: bookData.title,
        author: bookData.author,
        summary: bookData.summary,
        cover_url: bookData.cover_url,
        publication_year: bookData.publication_year,
        api_source: bookData.api_source,
        genre: genre.trim() || null,
        mood: mood.trim() || null,
        trope: trope.trim() || null,
        heat_level: heatLevel.trim() || null,
        affiliate_harlequin: affiliateHarlequin.trim() || null,
        affiliate_amazon: affiliateAmazon.trim() || null,
        affiliate_barnesnoble: affiliateBarnes.trim() || null,
        affiliate_kobo: affiliateKobo.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Book imported! 📚",
        description: `${bookData.title} has been added to the collection.`
      });

      // Reset form
      setSearchTitle("");
      setSearchAuthor("");
      setBookData(null);
      setGenre("");
      setMood("");
      setTrope("");
      setHeatLevel("");
      setAffiliateHarlequin("");
      setAffiliateAmazon("");
      setAffiliateBarnes("");
      setAffiliateKobo("");
      setOpen(false);

      onImportSuccess?.();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Failed to save book",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Import Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Book from API</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-title">Book Title *</Label>
              <Input
                id="search-title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="e.g., Pride and Prejudice"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="search-author">Author (optional)</Label>
              <Input
                id="search-author"
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
                placeholder="e.g., Jane Austen"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search APIs
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {bookData && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg">Search Result</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-[2/3] rounded-lg overflow-hidden border">
                  {bookData.cover_url ? (
                    <img src={bookData.cover_url} alt={bookData.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookCoverPlaceholder title={bookData.title} />
                  )}
                </div>
                
                <div className="col-span-2 space-y-2">
                  <h4 className="font-serif font-semibold text-xl">{bookData.title}</h4>
                  <p className="text-muted-foreground">by {bookData.author}</p>
                  {bookData.publication_year && (
                    <p className="text-sm text-muted-foreground">Published: {bookData.publication_year}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Source: {bookData.api_source.replace('_', ' ')}</p>
                  {bookData.summary && (
                    <p className="text-sm line-clamp-4">{bookData.summary}</p>
                  )}
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g., Historical"
                  />
                </div>
                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Input
                    id="mood"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="e.g., Swoon-worthy"
                  />
                </div>
                <div>
                  <Label htmlFor="trope">Trope</Label>
                  <Input
                    id="trope"
                    value={trope}
                    onChange={(e) => setTrope(e.target.value)}
                    placeholder="e.g., Enemies to Lovers"
                  />
                </div>
                <div>
                  <Label htmlFor="heat">Heat Level</Label>
                  <Input
                    id="heat"
                    value={heatLevel}
                    onChange={(e) => setHeatLevel(e.target.value)}
                    placeholder="e.g., Steamy"
                  />
                </div>
              </div>

              {/* Affiliate Links */}
              <div className="space-y-3">
                <h4 className="font-semibold">Affiliate Links (optional)</h4>
                <Input
                  value={affiliateHarlequin}
                  onChange={(e) => setAffiliateHarlequin(e.target.value)}
                  placeholder="Harlequin link"
                />
                <Input
                  value={affiliateAmazon}
                  onChange={(e) => setAffiliateAmazon(e.target.value)}
                  placeholder="Amazon link"
                />
                <Input
                  value={affiliateBarnes}
                  onChange={(e) => setAffiliateBarnes(e.target.value)}
                  placeholder="Barnes & Noble link"
                />
                <Input
                  value={affiliateKobo}
                  onChange={(e) => setAffiliateKobo(e.target.value)}
                  placeholder="Kobo link"
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save to Collection"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookImportModal;
