import { motion } from "framer-motion";
import { heatLevelConfig, type HeatLevel } from "@/lib/heatLevelConfig";
import { Button } from "@/components/ui/button";

interface HeatLevelFilterProps {
  selectedLevel: HeatLevel | "all";
  onSelectLevel: (level: HeatLevel | "all") => void;
}

const HeatLevelFilter = ({
  selectedLevel,
  onSelectLevel,
}: HeatLevelFilterProps) => {
  const levels: Array<HeatLevel | "all"> = ["all", "sweet", "warm", "hot", "scorching"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap items-center gap-3 mb-8"
    >
      <span className="text-sm font-medium text-muted-foreground">
        Heat Level:
      </span>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const isSelected = selectedLevel === level;
          const config = level !== "all" ? heatLevelConfig[level] : null;
          const Icon = config?.icon;

          return (
            <Button
              key={level}
              onClick={() => onSelectLevel(level)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`
                transition-all duration-300
                ${
                  isSelected && config
                    ? `bg-gradient-to-r ${config.gradient} ${config.glowColor} hover:opacity-90 border-0 ${config.textColor}`
                    : ""
                }
                ${isSelected && level === "all" ? "bg-primary" : ""}
              `}
            >
              {Icon && <Icon size={14} className="mr-1.5" />}
              {level === "all" ? "All" : config?.label}
            </Button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default HeatLevelFilter;
