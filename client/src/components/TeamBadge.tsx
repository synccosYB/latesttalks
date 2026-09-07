import { Badge } from "@/components/ui/badge";
import { Team, TEAM_COLORS } from "@/lib/types";

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "default";
}

export function TeamBadge({ team, size = "default" }: TeamBadgeProps) {
  const { bg, text, label } = TEAM_COLORS[team];
  
  return (
    <Badge 
      variant="secondary" 
      className={`${bg} ${text} border-0 ${size === "sm" ? "text-[10px] px-1.5 py-0" : ""}`}
      data-testid={`badge-team-${team}`}
    >
      {label}
    </Badge>
  );
}
