import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportStats {
  imported: number;
  skipped: number;
  rejected: number;
  errors: string[];
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setStats(null);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const books = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
      
      const book: any = {};
      headers.forEach((header, index) => {
        book[header] = values[index] || '';
      });
      
      if (book.title && book.author) {
        books.push(book);
      }
    }
    
    return books;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStats(null);

    try {
      const text = await file.text();
      const books = parseCSV(text);
      
      if (books.length === 0) {
        toast.error("No valid books found in CSV");
        setIsProcessing(false);
        return;
      }

      toast.success(`Found ${books.length} books. Starting import...`);

      const batchSize = 50;
      let allStats: ImportStats = {
        imported: 0,
        skipped: 0,
        rejected: 0,
        errors: []
      };

      for (let i = 0; i < books.length; i += batchSize) {
        const batch = books.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('import-csv-books', {
          body: { books: batch, batchSize }
        });

        if (error) {
          throw error;
        }

        if (data) {
          allStats.imported += data.imported || 0;
          allStats.skipped += data.skipped || 0;
          allStats.rejected += data.rejected || 0;
          allStats.errors.push(...(data.errors || []));
        }

        const progressPercent = Math.round(((i + batch.length) / books.length) * 100);
        setProgress(progressPercent);
        
        toast.loading(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(books.length / batchSize)}...`, {
          id: 'import-progress'
        });
      }

      setStats(allStats);
      toast.success(`Import complete! ${allStats.imported} books imported.`, { id: 'import-progress' });

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Import failed");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">
            Book Import Center
          </h1>
          <p className="text-muted-foreground">
            Import romance novels from CSV with AI-powered quality filtering
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file with columns: id, title, author, genre, trope, mood, heat_level, summary, publisher, publish_year, isbn, language, page_count, rating, description, quote_snippet, source_api
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="csv-upload"
                className={`
                  relative block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${file 
                    ? 'border-primary bg-primary/5 shadow-lg' 
                    : 'border-muted hover:border-primary/50 hover:bg-accent/50'
                  }
                  hover:scale-[1.02] hover:shadow-md
                  active:scale-[0.98]
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  {file ? (
                    <>
                      <div className="relative">
                        <FileText className="h-12 w-12 text-primary" />
                        <CheckCircle2 className="h-6 w-6 text-primary absolute -top-1 -right-1 bg-background rounded-full" />
                      </div>
                      <div className="text-sm">
                        <span className="text-primary font-semibold">{file.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        File ready to import
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary" />
                      <div className="space-y-1">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          className="pointer-events-none"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Browse Files
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CSV files only
                      </p>
                    </>
                  )}
                </div>
              </label>

              {file && (
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="w-full bg-gradient-romance text-white"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Start Import with AI Filtering"}
                </Button>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    {progress}% complete
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>Summary of the import process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">Imported</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.imported}</p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-600">Skipped</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.skipped}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-600">Rejected</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Not romance</p>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Errors ({stats.errors.length})</h3>
                    <div className="max-h-48 overflow-y-auto space-y-1 text-sm text-muted-foreground">
                      {stats.errors.slice(0, 50).map((error, i) => (
                        <div key={i} className="p-2 bg-muted rounded text-xs">
                          {error}
                        </div>
                      ))}
                      {stats.errors.length > 50 && (
                        <p className="text-xs italic">
                          ...and {stats.errors.length - 50} more errors
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
