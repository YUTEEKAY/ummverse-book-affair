import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Vendor = { id: string; name: string; type: string; instagram_handle: string | null; phone_number: string | null; website_url: string | null };
type Book = { id: string; title: string; author: string };
const TYPES = ["Nigerian Vendor", "Online Store"];
const empty = { name: "", type: TYPES[0], instagram_handle: "", phone_number: "", website_url: "" };

export function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [links, setLinks] = useState<{ book_id: string; vendor_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignFor, setAssignFor] = useState<Vendor | null>(null);

  const load = async () => {
    const [v, l] = await Promise.all([
      supabase.from("vendors").select("*").order("name"),
      supabase.from("book_vendors").select("book_id, vendor_id"),
    ]);
    if (v.error) toast.error("Couldn't load vendors", { description: v.error.message });
    setVendors((v.data as Vendor[]) ?? []);
    setLinks(l.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (v: Vendor | null) => {
    setEditing(v);
    setForm(v ? { name: v.name, type: v.type, instagram_handle: v.instagram_handle ?? "", phone_number: v.phone_number ?? "", website_url: v.website_url ?? "" } : empty);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Vendor name is required");
    setSaving(true);
    const row = { name: form.name.trim(), type: form.type, instagram_handle: form.instagram_handle.trim() || null, phone_number: form.phone_number.trim() || null, website_url: form.website_url.trim() || null };
    const { error } = editing ? await supabase.from("vendors").update(row).eq("id", editing.id) : await supabase.from("vendors").insert(row);
    setSaving(false);
    if (error) return toast.error("Couldn't save vendor", { description: error.message });
    toast.success(editing ? "Vendor updated" : "Vendor added");
    setOpen(false);
    load();
  };

  const remove = async (v: Vendor) => {
    if (!confirm(`Delete ${v.name}? It will be removed from every book.`)) return;
    const { error } = await supabase.from("vendors").delete().eq("id", v.id);
    if (error) return toast.error("Couldn't delete vendor", { description: error.message });
    toast.success("Vendor deleted");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Vendor Manager</CardTitle>
          <CardDescription>Bookstores and online shops shown to paid members under "Where to Buy".</CardDescription>
        </div>
        <Button onClick={() => startEdit(null)}><Plus className="h-4 w-4 mr-2" />Add vendor</Button>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : vendors.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No vendors yet. Add your first bookstore.</p>
        ) : (
          <div className="divide-y divide-border">
            {vendors.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium flex items-center gap-2">{v.name} <Badge variant="secondary">{v.type}</Badge></div>
                  <div className="text-sm text-muted-foreground">
                    {[v.instagram_handle && `@${v.instagram_handle.replace(/^@/, "")}`, v.phone_number, v.website_url].filter(Boolean).join(" · ") || "No contact details"}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAssignFor(v)}>
                  Books ({links.filter((l) => l.vendor_id === v.id).length})
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Edit ${v.name}`} onClick={() => startEdit(v)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${v.name}`} onClick={() => remove(v)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit vendor" : "Add vendor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="v-name">Name</Label><Input id="v-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="v-ig">Instagram handle</Label><Input id="v-ig" placeholder="@bookstore" value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} /></div>
            <div><Label htmlFor="v-phone">Phone / WhatsApp</Label><Input id="v-phone" placeholder="0803 123 4567" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></div>
            <div><Label htmlFor="v-web">Website</Label><Input id="v-web" placeholder="https://…" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {assignFor && <AssignBooks vendor={assignFor} assigned={links.filter((l) => l.vendor_id === assignFor.id).map((l) => l.book_id)} onClose={() => setAssignFor(null)} onChange={load} />}
    </Card>
  );
}

function AssignBooks({ vendor, assigned, onClose, onChange }: { vendor: Vendor; assigned: string[]; onClose: () => void; onChange: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [assignedBooks, setAssignedBooks] = useState<Book[]>([]);
  const assignedSet = useMemo(() => new Set(assigned), [assigned]);

  useEffect(() => {
    if (!assigned.length) return setAssignedBooks([]);
    supabase.from("books").select("id, title, author").in("id", assigned).order("title").then(({ data }) => setAssignedBooks(data ?? []));
  }, [assigned]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return setResults([]);
    const t = setTimeout(async () => {
      const safe = q.replace(/[%,()]/g, " ");
      const { data } = await supabase.from("books").select("id, title, author").or(`title.ilike.%${safe}%,author.ilike.%${safe}%`).order("title").limit(15);
      setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const toggle = async (b: Book) => {
    const { error } = assignedSet.has(b.id)
      ? await supabase.from("book_vendors").delete().eq("vendor_id", vendor.id).eq("book_id", b.id)
      : await supabase.from("book_vendors").insert({ vendor_id: vendor.id, book_id: b.id });
    if (error) return toast.error("Couldn't update", { description: error.message });
    onChange();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Books sold by {vendor.name}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2">
          {assignedBooks.length === 0 && <p className="text-sm text-muted-foreground">No books assigned yet.</p>}
          {assignedBooks.map((b) => (
            <Badge key={b.id} variant="secondary" className="gap-1 pr-1">
              {b.title}
              <button aria-label={`Remove ${b.title}`} onClick={() => toggle(b)} className="rounded hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search books by title or author" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {results.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 py-2">
              <div className="text-sm"><div className="font-medium">{b.title}</div><div className="text-muted-foreground">{b.author}</div></div>
              <Button size="sm" variant={assignedSet.has(b.id) ? "outline" : "default"} onClick={() => toggle(b)}>
                {assignedSet.has(b.id) ? "Unassign" : "Assign"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
