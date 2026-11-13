import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { computeKpis, statusOf, tierOf, type AdminUserRow, type Tier } from "@/lib/adminMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Users, CreditCard, DollarSign, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | Tier;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free Trial" },
  { key: "monthly", label: "Monthly" },
  { key: "annual", label: "Annual" },
];
const TIER_LABEL: Record<Tier, string> = { free: "Free", monthly: "Monthly", annual: "Annual" };
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");

export function UserManagement() {
  const env = getPaddleEnvironment();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: rows = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-users", env],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", { check_env: env });
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });

  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      (filter === "all" || tierOf(r) === filter) &&
      (!q || r.email?.toLowerCase().includes(q) || r.full_name?.toLowerCase().includes(q)));
  }, [rows, filter, search]);

  const run = async (id: string, fn: () => PromiseLike<{ error: any }>, ok: string) => {
    setBusy(id);
    const { error } = await fn();
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(ok);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const setTier = (r: AdminUserRow, tier: Tier) =>
    run(r.id, () => supabase.rpc("admin_set_tier", { target_user: r.id, tier, check_env: env }),
      tier === "free" ? `Removed gifted access for ${r.email}` : `Gifted ${TIER_LABEL[tier]} access to ${r.email}`);
  const resetTrials = (r: AdminUserRow) =>
    run(r.id, () => supabase.rpc("admin_reset_trials", { target_user: r.id }), `Reset free tries for ${r.email}`);

  const kpiCards = [
    { title: "Registered Users", value: kpis.totalUsers.toLocaleString(), sub: "Signed-in accounts", icon: Users },
    { title: "Active Paid Subscribers", value: kpis.paid.toLocaleString(), sub: `${kpis.monthly} Monthly · ${kpis.annual} Annual`, icon: CreditCard },
    { title: "Estimated MRR", value: `$${kpis.mrr.toFixed(2)}`, sub: "Monthly $5 + Annual $70 ÷ 12", icon: DollarSign },
    { title: "Free Trial Users", value: (kpis.trials[0] + kpis.trials[1] + kpis.trials[2]).toLocaleString(), sub: `0/2: ${kpis.trials[0]} · 1/2: ${kpis.trials[1]} · 2/2: ${kpis.trials[2]}`, icon: Sparkles },
  ];

  if (error) return <Card><CardContent className="py-8 text-destructive">Could not load users: {(error as Error).message}</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ title, value, sub, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "…" : value}</div>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Users & Subscriptions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button key={f.key} size="sm" className="rounded-full" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="relative md:ml-auto md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search email or name" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead><TableHead>Full Name</TableHead><TableHead>Signed Up</TableHead>
                    <TableHead>Free Tries</TableHead><TableHead>Tier</TableHead><TableHead>Status</TableHead>
                    <TableHead>Next Renewal</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No users match.</TableCell></TableRow>
                  )}
                  {visible.map((r) => {
                    const tier = tierOf(r);
                    const status = statusOf(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.email}</TableCell>
                        <TableCell>{r.full_name || "—"}</TableCell>
                        <TableCell>{fmtDate(r.created_at)}</TableCell>
                        <TableCell>{r.trials_used}/2</TableCell>
                        <TableCell>
                          <Badge variant={tier === "free" ? "secondary" : "default"}>{TIER_LABEL[tier]}</Badge>
                          {r.is_manual && tier !== "free" && <span className="ml-1 text-xs text-muted-foreground">gift</span>}
                        </TableCell>
                        <TableCell>
                          {status === "—" ? "—" : <Badge variant={status === "Active" || status === "Trialing" ? "outline" : "secondary"}>{status}</Badge>}
                        </TableCell>
                        <TableCell>{tier === "free" ? "—" : fmtDate(r.current_period_end)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={busy === r.id} aria-label={`Actions for ${r.email}`}>
                                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Grant access</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setTier(r, "annual")}>Gift Annual (1 year)</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTier(r, "monthly")}>Gift Monthly (1 month)</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTier(r, "free")}>Remove gifted access</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => resetTrials(r)}>Reset free tries</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
