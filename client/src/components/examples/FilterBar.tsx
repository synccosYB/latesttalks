import { useState } from "react";
import { FilterBar } from "../FilterBar";
import type { Team, Priority } from "@/lib/types";

export default function FilterBarExample() {
  const [teams, setTeams] = useState<Team[]>(["engineering", "design", "marketing", "product", "sales"]);
  const [priorities, setPriorities] = useState<Priority[]>(["high", "medium", "low"]);

  return (
    <FilterBar
      selectedTeams={teams}
      selectedPriorities={priorities}
      onTeamToggle={(team) => {
        setTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
      }}
      onPriorityToggle={(priority) => {
        setPriorities(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
      }}
      onClearFilters={() => {
        setTeams(["engineering", "design", "marketing", "product", "sales"]);
        setPriorities(["high", "medium", "low"]);
      }}
    />
  );
}
