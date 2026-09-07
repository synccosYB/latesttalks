import { useState } from "react";
import { TeamFilter } from "../TeamFilter";
import type { Team } from "@/lib/types";

export default function TeamFilterExample() {
  const [selected, setSelected] = useState<Team[]>(["engineering", "design"]);
  
  const handleToggle = (team: Team) => {
    setSelected(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  return <TeamFilter selectedTeams={selected} onToggle={handleToggle} />;
}
