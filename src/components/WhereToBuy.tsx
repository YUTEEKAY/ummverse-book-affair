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
  const [counts, setCounts] = useState({ nigerian_count: 0, online_count: 0, total_count: 0 });

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("get_book_vendor_counts", { _book_id: bookId }).then(({ data }) => {
      if (!cancelled && data?.[0]) setCounts(data[0]);
    });
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
                <Card key={v.id ?? v.name} className="p-5 bg-card/80">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge variant="secondary">{v.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {web && <Button asChild size="sm" variant="outline"><a href={web} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 mr-1" />Website</a></Button>}
                    {ig && <Button asChild size="sm" variant="outline"><a href={ig} target="_blank" rel="noopener noreferrer"><Instagram className="w-4 h-4 mr-1" />@{v.instagram_handle?.replace(/^@/, "").replace(/.*instagram\.com\//i, "").replace(/\/$/, "")}</a></Button>}
                    {wa && <Button asChild size="sm" variant="outline"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</a></Button>}
                    {tel && <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="w-4 h-4 mr-1" />{v.phone_number}</a></Button>}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <div className="border-y border-border bg-secondary/40 px-5 py-7">
          <div className="text-center">
            <Lock className="w-7 h-7 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-serif font-semibold mb-2">
              {total > 0 ? `Available at ${counts.nigerian_count} Nigerian Bookstore${counts.nigerian_count === 1 ? "" : "s"} & ${counts.online_count} Online Site${counts.online_count === 1 ? "" : "s"} — Unlock to view` : "No outlets listed for this book yet"}
            </h3>
            <p className="text-muted-foreground mb-5">Subscribe to see local Nigerian bookstores, online links and vendor contact info.</p>
            <Button onClick={onUpgrade} className="h-auto min-h-10 whitespace-normal">Upgrade to Unlock Vendor Links</Button>
          </div>
        </div>
      )}
    </section>
  );
}
