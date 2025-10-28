import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { AddBookForm } from './AddBookForm';
import { EditBookForm } from './EditBookForm';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BookManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  const { data: books, isLoading, refetch } = useQuery({
    queryKey: ['admin-books', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast.success('Book deleted successfully');
      refetch();
      setDeletingBookId(null);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    }
  };

  if (showAddForm) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add New Book</CardTitle>
              <CardDescription>Enter book details to add to the library</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AddBookForm 
            onSuccess={() => {
              setShowAddForm(false);
              refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (editingBook) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Book</CardTitle>
              <CardDescription>Update book details</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setEditingBook(null)}>
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EditBookForm 
            book={editingBook}
            onSuccess={() => {
              setEditingBook(null);
              refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <CardTitle>Books Library</CardTitle>
              <CardDescription>Manage your book collection</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : books && books.length > 0 ? (
            <div className="space-y-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      No Cover
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      {book.genre && (
                        <span className="px-2 py-1 bg-primary/10 rounded">
                          {book.genre}
                        </span>
                      )}
                      {book.heat_level && (
                        <span className="px-2 py-1 bg-secondary/10 rounded">
                          Heat: {book.heat_level}
                        </span>
                      )}
                      {book.publication_year && (
                        <span className="text-muted-foreground">
                          {book.publication_year}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBook(book)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingBookId(book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No books found matching your search' : 'No books in the library yet'}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingBookId} onOpenChange={() => setDeletingBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBookId && handleDeleteBook(deletingBookId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
