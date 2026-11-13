import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

export function useSubscription() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("environment", getPaddleEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const s = q.data;
  const futureEnd = !s?.current_period_end || new Date(s.current_period_end) > new Date();
  const isActive = !!s && (
    (["active", "trialing", "past_due"].includes(s.status) && futureEnd) ||
    (s.status === "canceled" && !!s.current_period_end && new Date(s.current_period_end) > new Date())
  );
  return { subscription: s, isActive, refetch: q.refetch };
}
