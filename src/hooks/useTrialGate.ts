import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";
import { canUseFreeTrial, getDeviceUses, setDeviceUses } from "@/lib/trialLimit";

/** Returns consume(): true if the user may proceed (and records the try). */
export function useTrialGate() {
  const { user } = useAuth();
  const consume = useCallback(async (): Promise<boolean> => {
    const deviceUses = getDeviceUses();
    if (!user) {
      if (!canUseFreeTrial(deviceUses)) return false;
      setDeviceUses(deviceUses + 1);
      return true;
    }
    const { data, error } = await supabase.rpc("consume_trial", {
      device_uses: deviceUses,
      check_env: getPaddleEnvironment(),
    });
    if (error) { console.error(error); return false; }
    const res = data as { allowed: boolean; subscribed: boolean; uses: number };
    if (!res.subscribed) setDeviceUses(Math.max(deviceUses, res.uses));
    return res.allowed;
  }, [user]);
  return { consume };
}
