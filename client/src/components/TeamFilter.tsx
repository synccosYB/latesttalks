import { Button } from "@/components/ui/button";
import { Team, TEAM_COLORS } from "@/lib/types";

interface TeamFilterProps {
  selectedTeams: Team[];
  onToggle: (team: Team) => void;
}

const ALL_TEAMS: Team[] = ["engineering", "design", "marketing", "product", "sales"];

export function TeamFilter({ selectedTeams, onToggle }: TeamFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TEAMS.map((team) => {
        const { bg, text, label } = TEAM_COLORS[team];
        const isSelected = selectedTeams.includes(team);
        
        return (
          <Button
            key={team}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(team)}
            className={isSelected ? `${bg} ${text} border-0` : ""}
            data-testid={`filter-team-${team}`}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
