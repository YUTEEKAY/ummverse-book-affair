import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  // Enrichment states
  const [bookStats, setBookStats] = useState({
    total: 0,
    missingCovers: 0,
    missingSummaries: 0,
    noApiSource: 0
  });
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichStats, setEnrichStats] = useState({
    processed: 0,
    updated: 0,
    noData: 0,
    errors: 0
  });
  const [batchSize, setBatchSize] = useState("25");
  const [enrichLogs, setEnrichLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Load book stats on mount
  useEffect(() => {
    loadBookStats();
  }, []);

  const loadBookStats = async () => {
    try {
      const { count: total } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      const { count: missingCovers } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .is('cover_url', null);

      const { count: missingSummaries } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .is('summary', null);

      const { count: noApiSource } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .is('api_source', null);

      setBookStats({
        total: total || 0,
        missingCovers: missingCovers || 0,
        missingSummaries: missingSummaries || 0,
        noApiSource: noApiSource || 0
      });
    } catch (error) {
      console.error('Error loading book stats:', error);
    }
  };

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

  const handleEnrichBooks = async (forceRefresh: boolean = false) => {
    setEnriching(true);
    setEnrichProgress(0);
    setEnrichStats({ processed: 0, updated: 0, noData: 0, errors: 0 });
    setEnrichLogs([]);
    setShowLogs(true);

    try {
      const size = parseInt(batchSize);
      let offset = 0;
      let hasMore = true;
      let totalProcessed = 0;

      const addLog = (message: string) => {
        setEnrichLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
      };

      addLog(`Starting enrichment with batch size ${size}...`);

      while (hasMore) {
        addLog(`Processing batch starting at ${offset}...`);

        const { data, error } = await supabase.functions.invoke('enrich-books', {
          body: {
            batchSize: size,
            startFrom: offset,
            forceRefresh: forceRefresh
          }
        });

        if (error) throw error;

        const batchStats = data as any;
        totalProcessed += batchStats.totalProcessed;

        setEnrichStats(prev => ({
          processed: prev.processed + batchStats.totalProcessed,
          updated: prev.updated + batchStats.updated,
          noData: prev.noData + batchStats.noDataFound,
          errors: prev.errors + batchStats.errors
        }));

        addLog(`Batch complete: ${batchStats.updated} updated, ${batchStats.noDataFound} no data, ${batchStats.errors} errors`);

        if (batchStats.totalProcessed < size) {
          hasMore = false;
          addLog('All books processed!');
        } else {
          offset = batchStats.nextOffset;
          const estimatedTotal = forceRefresh ? bookStats.total : (bookStats.missingCovers + bookStats.missingSummaries + bookStats.noApiSource);
          const progress = Math.min(100, (totalProcessed / Math.max(estimatedTotal, 1)) * 100);
          setEnrichProgress(progress);
        }
      }

      addLog(`Enrichment complete! Total: ${totalProcessed} books processed`);
      await loadBookStats(); // Refresh stats
      toast.success('Enrichment complete!');

    } catch (error: any) {
      console.error('Enrichment error:', error);
      setEnrichLogs(prev => [...prev, `ERROR: ${error.message}`]);
      toast.error('Enrichment failed');
    } finally {
      setEnriching(false);
      setEnrichProgress(100);
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

        {/* Book Data Enrichment Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Data Enrichment
            </CardTitle>
            <CardDescription>
              Enrich book data with summaries and covers from Open Library and Google Books API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="text-2xl font-bold">{bookStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Books</div>
              </div>
              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="text-2xl font-bold">{bookStats.missingCovers}</div>
                <div className="text-sm text-muted-foreground">Missing Covers</div>
              </div>
              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="text-2xl font-bold">{bookStats.missingSummaries}</div>
                <div className="text-sm text-muted-foreground">Missing Summaries</div>
              </div>
              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="text-2xl font-bold">{bookStats.noApiSource}</div>
                <div className="text-sm text-muted-foreground">Not Enriched</div>
              </div>
            </div>

            {/* Configuration */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Batch Size</label>
                <Select value={batchSize} onValueChange={setBatchSize} disabled={enriching}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 books per batch</SelectItem>
                    <SelectItem value="25">25 books per batch</SelectItem>
                    <SelectItem value="50">50 books per batch</SelectItem>
                    <SelectItem value="100">100 books per batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleEnrichBooks(false)}
                disabled={enriching}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${enriching ? 'animate-spin' : ''}`} />
                Enrich Missing Data
              </Button>
              <Button
                onClick={() => handleEnrichBooks(true)}
                disabled={enriching}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${enriching ? 'animate-spin' : ''}`} />
                Force Refresh All
              </Button>
            </div>

            {/* Progress */}
            {enriching && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enriching books...</span>
                  <span>{Math.round(enrichProgress)}%</span>
                </div>
                <Progress value={enrichProgress} />
              </div>
            )}

            {/* Statistics During/After Enrichment */}
            {(enriching || enrichStats.processed > 0) && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{enrichStats.processed}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{enrichStats.updated}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{enrichStats.noData}</div>
                  <div className="text-xs text-muted-foreground">No Data</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{enrichStats.errors}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
            )}

            {/* Logs */}
            {enrichLogs.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                  className="mb-2"
                >
                  {showLogs ? 'Hide' : 'Show'} Logs ({enrichLogs.length})
                </Button>
                {showLogs && (
                  <div className="bg-secondary/20 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <div className="space-y-1 font-mono text-xs">
                      {enrichLogs.map((log, i) => (
                        <div key={i} className="text-muted-foreground">{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
