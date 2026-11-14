import { Flame } from "lucide-react";
import { heatRating } from "@/lib/heatMeter";
interface HeatLevelBadgeProps { heatLevel: string | null; size?: "sm" | "md" | "lg"; showLabel?: boolean; className?: string }
export default function HeatLevelBadge({ heatLevel, size = "md", showLabel = true, className = "" }: HeatLevelBadgeProps) {
  const rating = heatRating(heatLevel);
  if (!rating) return null;
  return <span title={`${rating}/5 spice · ${heatLevel}`} aria-label={`${rating} of 5 spice`} className={`inline-flex flex-wrap items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-primary ${className}`}>
    {Array.from({length:5},(_,i)=><Flame key={i} className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${i<rating ? "fill-primary" : "text-muted-foreground/30"}`} />)}
    {showLabel && <span className="text-xs font-medium">{rating}/5</span>}
  </span>;
}
