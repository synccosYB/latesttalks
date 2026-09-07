import { Badge } from "@/components/ui/badge";
import { Priority, PRIORITY_STYLES } from "@/lib/types";
import { AlertCircle, Minus, ArrowDown } from "lucide-react";

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
}

const PRIORITY_ICONS: Record<Priority, typeof AlertCircle> = {
  high: AlertCircle,
  medium: Minus,
  low: ArrowDown,
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-slate-500 dark:text-slate-400",
};

export function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  const Icon = PRIORITY_ICONS[priority];
  const { label } = PRIORITY_STYLES[priority];
  
  return (
    <div className={`flex items-center gap-1 ${PRIORITY_COLORS[priority]}`} data-testid={`priority-${priority}`}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
