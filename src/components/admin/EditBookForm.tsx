import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  cover_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  summary: z.string().optional(),
  genre: z.string().optional(),
  trope: z.string().optional(),
  mood: z.string().optional(),
  heat_level: z.string().optional(),
  publication_year: z.string().optional(),
  page_count: z.string().optional(),
  isbn: z.string().optional(),
  isbn13: z.string().optional(),
  publisher: z.string().optional(),
  language: z.string().default('en'),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface EditBookFormProps {
  book: any;
  onSuccess: () => void;
}

export function EditBookForm({ book, onSuccess }: EditBookFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book.title || '',
      author: book.author || '',
      cover_url: book.cover_url || '',
      summary: book.summary || '',
      genre: book.genre || '',
      trope: book.trope || '',
      mood: book.mood || '',
      heat_level: book.heat_level || '',
      publication_year: book.publication_year?.toString() || '',
      page_count: book.page_count?.toString() || '',
      isbn: book.isbn || '',
      isbn13: book.isbn13 || '',
      publisher: book.publisher || '',
      language: book.language || 'en',
    },
  });

  const onSubmit = async (values: BookFormValues) => {
    setIsSubmitting(true);
    try {
      const bookData: any = {
        title: values.title,
        author: values.author,
        cover_url: values.cover_url || null,
        summary: values.summary || null,
        genre: values.genre || null,
        trope: values.trope || null,
        mood: values.mood || null,
        heat_level: values.heat_level || null,
        publication_year: values.publication_year ? parseInt(values.publication_year) : null,
        page_count: values.page_count ? parseInt(values.page_count) : null,
        isbn: values.isbn || null,
        isbn13: values.isbn13 || null,
        publisher: values.publisher || null,
        language: values.language,
      };

      const { error } = await supabase
        .from('books')
        .update(bookData)
        .eq('id', book.id);

      if (error) throw error;

      toast.success('Book updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating book:', error);
      toast.error('Failed to update book', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author *</FormLabel>
                <FormControl>
                  <Input placeholder="Author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cover_url"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Cover URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/cover.jpg" {...field} />
                </FormControl>
                <FormDescription>
                  URL to the book cover image
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Book summary..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Contemporary Romance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heat_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heat Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select heat level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="sweet">Sweet</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="steamy">Steamy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trope</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Second Chance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mood</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Cozy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publication_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Year</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="page_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="320" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publisher</FormLabel>
                <FormControl>
                  <Input placeholder="Publisher name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input placeholder="en" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN</FormLabel>
                <FormControl>
                  <Input placeholder="ISBN-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isbn13"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN-13</FormLabel>
                <FormControl>
                  <Input placeholder="ISBN-13" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Book
        </Button>
      </form>
    </Form>
  );
}
