import { useEffect, useState } from "react";
import { Globe, Instagram, Lock, MessageCircle, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { instagramUrl, telUrl, websiteUrl, whatsappUrl } from "@/lib/vendorLinks";

type Vendor = { id: string | null; name: string | null; type: string | null; instagram_handle: string | null; phone_number: string | null; website_url: string | null; total_count: number; full_access: boolean };

export function WhereToBuy({ bookId, accessKey, onUpgrade }: { bookId: string; accessKey?: string; onUpgrade: () => void }) {
  const [rows, setRows] = useState<Vendor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("get_book_vendors", { _book_id: bookId }).then(({ data }) => {
      if (!cancelled) setRows((data as Vendor[]) ?? []);
    });
    return () => { cancelled = true; };
  }, [bookId, accessKey]);

  if (!rows) return null;
  const total = Number(rows[0]?.total_count ?? 0);
  const full = rows[0]?.full_access ?? false;
  const vendors = rows.filter((r) => r.id);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2">
        <Store className="w-6 h-6 text-primary" /> Where to Buy
      </h2>

      {full ? (
        vendors.length === 0 ? (
          <p className="text-muted-foreground">No sellers listed for this book yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {vendors.map((v) => {
              const ig = instagramUrl(v.instagram_handle), wa = whatsappUrl(v.phone_number), tel = telUrl(v.phone_number), web = websiteUrl(v.website_url);
              return (
                <Card key={v.id!} className="p-5 bg-card/80">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge variant="secondary">{v.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {web && <Button asChild size="sm" variant="outline"><a href={web} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 mr-1" />Website</a></Button>}
                    {ig && <Button asChild size="sm" variant="outline"><a href={ig} target="_blank" rel="noopener noreferrer"><Instagram className="w-4 h-4 mr-1" />@{v.instagram_handle!.replace(/^@/, "").replace(/.*instagram\.com\//i, "").replace(/\/$/, "")}</a></Button>}
                    {wa && <Button asChild size="sm" variant="outline"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</a></Button>}
                    {tel && <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="w-4 h-4 mr-1" />{v.phone_number}</a></Button>}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card className="relative overflow-hidden p-6 md:p-8 bg-card/80 border-primary/20">
          <div aria-hidden className="grid gap-3 sm:grid-cols-2 blur-sm select-none pointer-events-none opacity-60 mb-6">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-md border border-border p-4">
                <div className="h-4 w-32 bg-muted rounded mb-3" />
                <div className="h-3 w-48 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="text-center">
            <Lock className="w-7 h-7 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-serif font-semibold mb-2">
              {total > 0 ? total === 1 ? "1 seller stocks this book" : `${total} sellers stock this book` : "Find where to buy your next read"}
            </h3>
            <p className="text-muted-foreground mb-5">Subscribe to see local Nigerian bookstores, online links and vendor contact info.</p>
            <Button onClick={onUpgrade} className="bg-gradient-to-r from-primary to-dusty-rose">See plans</Button>
          </div>
        </Card>
      )}
    </section>
  );
}
