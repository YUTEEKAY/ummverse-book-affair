import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 5000,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      // Paid access counts in any payment mode, matching the server check.
      return (data ?? []).find(isActiveRow) ?? data?.[0] ?? null;
    },
  });
  const s = q.data;
  const isActive = !!s && isActiveRow(s);
  return { subscription: s, isActive, refetch: q.refetch };
}

type Row = { status: string; current_period_end: string | null };
function isActiveRow(s: Row) {
  const futureEnd = !s.current_period_end || new Date(s.current_period_end) > new Date();
  return (["active", "trialing", "past_due", "active_monthly", "active_annual"].includes(s.status) && futureEnd) ||
    (s.status === "canceled" && !!s.current_period_end && new Date(s.current_period_end) > new Date());
}
