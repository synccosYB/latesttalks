import { TeamFilter } from "./TeamFilter";
import { Button } from "@/components/ui/button";
import { Team, Priority } from "@/lib/types";
import { Filter, X } from "lucide-react";

interface FilterBarProps {
  selectedTeams: Team[];
  selectedPriorities: Priority[];
  onTeamToggle: (team: Team) => void;
  onPriorityToggle: (priority: Priority) => void;
  onClearFilters: () => void;
}

const ALL_PRIORITIES: Priority[] = ["high", "medium", "low"];

export function FilterBar({ 
  selectedTeams, 
  selectedPriorities,
  onTeamToggle, 
  onPriorityToggle,
  onClearFilters 
}: FilterBarProps) {
  const hasFilters = selectedTeams.length < 5 || selectedPriorities.length < 3;
  
  return (
    <div className="px-4 md:px-6 py-3 border-b bg-muted/20">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        
        <div className="flex-1 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Team:</span>
            <TeamFilter selectedTeams={selectedTeams} onToggle={onTeamToggle} />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Priority:</span>
            {ALL_PRIORITIES.map((priority) => (
              <Button
                key={priority}
                variant={selectedPriorities.includes(priority) ? "default" : "outline"}
                size="sm"
                onClick={() => onPriorityToggle(priority)}
                data-testid={`filter-priority-${priority}`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
