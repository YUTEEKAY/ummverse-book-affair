import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Crown, ExternalLink, History, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getPaddleEnvironment } from "@/lib/paddle";
import { FREE_TRIALS, getDeviceUses } from "@/lib/trialLimit";
import { UserMenu, userDisplay } from "@/components/UserMenu";
import { UpgradeModal } from "@/components/UpgradeModal";
import BookCover from "@/components/BookCover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BOOK_FIELDS = "id, title, author, cover_url, isbn, isbn13, mood, genre";
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");

export default function Dashboard() {
  const { user } = useAuth();
  const { subscription, isActive } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const qc = useQueryClient();
  const { name, avatar, initials } = userDisplay(user);

  const isAnnual = isActive && subscription?.price_id === "premium_yearly";
  const badge = !isActive ? "Free Trial" : isAnnual ? "Annual Subscriber - $70/yr" : "Monthly Subscriber - $5/mo";

  const { data: usage } = useQuery({
    queryKey: ["my-usage", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("feature_usage").select("uses").eq("user_id", user!.id).maybeSingle();
      return Math.min(FREE_TRIALS, Math.max(data?.uses ?? 0, getDeviceUses()));
    },
  });
  const used = usage ?? 0;
  const remaining = FREE_TRIALS - used;

  const { data: saved = [], isLoading: savedLoading } = useQuery({
    queryKey: ["saved-books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_books")
        .select(`id, book_id, created_at, books(${BOOK_FIELDS})`).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["quiz-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_history").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      const ids = [...new Set((data ?? []).flatMap((h) => h.book_ids))];
      const { data: books } = ids.length ? await supabase.from("books").select(BOOK_FIELDS).in("id", ids) : { data: [] };
      const map = new Map((books ?? []).map((b) => [b.id, b]));
      return (data ?? []).map((h) => ({ ...h, books: h.book_ids.map((id: string) => map.get(id)).filter(Boolean) as any[] }));
    },
  });

  const { data: myReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["my-reviews", user?.id, isActive],
    enabled: isActive,
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews")
        .select("id, review_text, hearts, created_at, book_id, books(id, title, author)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const removeSaved = async (id: string) => {
    const { error } = await supabase.from("saved_books").delete().eq("id", id);
    if (error) return toast.error("Couldn't remove that book.");
    toast.success("Removed from your reading list");
    qc.invalidateQueries({ queryKey: ["saved-books"] });
    qc.invalidateQueries({ queryKey: ["saved-book-ids"] });
  };

  const openPortal = async () => {
    setPortalBusy(true);
    const { data, error } = await supabase.functions.invoke("customer-portal", { body: { environment: getPaddleEnvironment() } });
    setPortalBusy(false);
    if (error) {
      let msg = "Couldn't open the billing portal.";
      if (error instanceof FunctionsHttpError) { try { msg = (await error.context.json()).error ?? msg; } catch { /* default */ } }
      return toast.error(msg);
    }
    window.open(data.url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Ummverse
          </Link>
          <UserMenu tone="dark" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            {avatar && <AvatarImage src={avatar} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-3xl font-semibold">{name}</h1>
            <p className="truncate text-muted-foreground">{user?.email}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="gap-1 px-3 py-1 text-sm">
            {isActive && <Crown className="h-3.5 w-3.5" />}{badge}
          </Badge>
        </Card>

        {isActive ? (
          <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold">Your membership is active</h2>
              <p className="text-muted-foreground">
                {subscription?.cancel_at_period_end || subscription?.status === "canceled"
                  ? `Access ends on ${fmt(subscription?.current_period_end)}.`
                  : `Next renewal: ${fmt(subscription?.current_period_end)}`}
              </p>
            </div>
            <Button onClick={openPortal} disabled={portalBusy} variant="outline">
              {portalBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Manage Subscription
            </Button>
          </Card>
        ) : (
          <Card className="flex flex-col gap-5 border-primary/30 bg-primary/5 p-6 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-3">
              <h2 className="font-serif text-xl font-semibold">{remaining} of {FREE_TRIALS} Free Trials Remaining</h2>
              <Progress value={(remaining / FREE_TRIALS) * 100} className="h-2 max-w-sm" aria-label="Free trials remaining" />
              <p className="text-sm text-muted-foreground">Each quiz result uses one free try. Unlimited matches, full reviews and your own reviews come with membership.</p>
            </div>
            <Button size="lg" onClick={() => setShowUpgrade(true)}>
              <Crown className="mr-2 h-4 w-4" /> Upgrade to Unlimited
            </Button>
          </Card>
        )}

        <Tabs defaultValue="saved">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="saved"><Bookmark className="mr-2 h-4 w-4" />Saved</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Quiz history</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="mr-2 h-4 w-4" />My reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            {savedLoading ? <Spinner /> : saved.length === 0 ? (
              <Empty text="No saved books yet. Tap the bookmark on any book to keep it here." />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {saved.map((s: any) => s.books && (
                  <div key={s.id} className="group">
                    <Link to={`/book/${s.books.id}`} className="relative block aspect-[2/3] overflow-hidden rounded-md bg-secondary">
                      <BookCover book={s.books} />
                    </Link>
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/book/${s.books.id}`} className="line-clamp-2 font-serif font-semibold leading-tight hover:text-primary">{s.books.title}</Link>
                        <p className="truncate text-sm text-muted-foreground">{s.books.author}</p>
                        {s.books.mood && <Badge variant="outline" className="mt-1 text-xs">{s.books.mood}</Badge>}
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeSaved(s.id)} aria-label={`Remove ${s.books.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-6">
            {historyLoading ? <Spinner /> : history.length === 0 ? (
              <Empty text="Take the mood quiz and your matches will be saved here to revisit anytime — for free." />
            ) : history.map((h: any) => (
              <Card key={h.id} className="p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">{fmt(h.created_at)}</span>
                  {["feeling", "trope", "heatLevel"].map((k) => h.answers?.[k] && <Badge key={k} variant="secondary">{h.answers[k]}</Badge>)}
                </div>
                {h.books.length === 0 ? <p className="text-sm text-muted-foreground">No matches were found for this quiz.</p> : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {h.books.map((b: any) => (
                      <Link key={b.id} to={`/book/${b.id}`} className="w-24 shrink-0" title={b.title}>
                        <div className="relative aspect-[2/3] overflow-hidden rounded bg-secondary"><BookCover book={b} /></div>
                        <p className="mt-1 line-clamp-2 text-xs font-medium">{b.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {!isActive ? (
              <Card className="p-8 text-center">
                <h3 className="mb-2 font-serif text-xl font-semibold">Upgrade to read all reviews and share your own thoughts</h3>
                <p className="mb-5 text-muted-foreground">Writing reviews is part of membership.</p>
                <Button onClick={() => setShowUpgrade(true)}>See plans</Button>
              </Card>
            ) : reviewsLoading ? <Spinner /> : myReviews.length === 0 ? (
              <Empty text="You haven't written any reviews yet. Open any book to share your thoughts." />
            ) : myReviews.map((r: any) => (
              <Card key={r.id} className="p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/book/${r.book_id}`} className="font-serif text-lg font-semibold hover:text-primary">
                    {r.books?.title ?? "A book"} <span className="text-sm font-normal text-muted-foreground">by {r.books?.author}</span>
                  </Link>
                  <span className="text-sm text-muted-foreground">{fmt(r.created_at)}{r.hearts ? ` · ${r.hearts}/5` : ""}</span>
                </div>
                <p className="text-muted-foreground">{r.review_text}</p>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

const Spinner = () => <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
const Empty = ({ text }: { text: string }) => <Card className="p-8 text-center text-muted-foreground">{text}</Card>;
