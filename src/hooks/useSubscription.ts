import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentEnvironment } from "@/lib/flutterwave";

export function useSubscription() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id, getPaymentEnvironment()],
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 5000,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", getPaymentEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const s = q.data;
  const futureEnd = !s?.current_period_end || new Date(s.current_period_end) > new Date();
  const isActive = !!s && (
    (["active", "trialing", "past_due", "active_monthly", "active_annual"].includes(s.status) && futureEnd) ||
    (s.status === "canceled" && !!s.current_period_end && new Date(s.current_period_end) > new Date())
  );
  return { subscription: s, isActive, refetch: q.refetch };
}
