import { motion } from "framer-motion";
import { getHeatLevelConfig } from "@/lib/heatLevelConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatLevelBadgeProps {
  heatLevel: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const HeatLevelBadge = ({
  heatLevel,
  size = "md",
  showLabel = true,
  className = "",
}: HeatLevelBadgeProps) => {
  const config = getHeatLevelConfig(heatLevel);

  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${config.gradient} ${config.glowColor} ${sizeClasses[size]} font-medium ${config.textColor} backdrop-blur-sm transition-all duration-300 ${className}`}
          >
            <Icon size={iconSizes[size]} className="flex-shrink-0" />
            {showLabel && (
              <span className="hidden sm:inline whitespace-nowrap">
                {config.label}
              </span>
            )}
            <span className="sm:hidden">{config.emoji}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-background/95 backdrop-blur-sm border-2"
        >
          <p className="font-serif italic">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HeatLevelBadge;
