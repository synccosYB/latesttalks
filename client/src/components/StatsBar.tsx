import { Initiative, Team, Priority, TEAM_COLORS, PRIORITY_STYLES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface StatsBarProps {
  initiatives: Initiative[];
}

export function StatsBar({ initiatives }: StatsBarProps) {
  const total = initiatives.length;
  
  const teamCounts = initiatives.reduce((acc, i) => {
    acc[i.team] = (acc[i.team] || 0) + 1;
    return acc;
  }, {} as Record<Team, number>);
  
  const priorityCounts = initiatives.reduce((acc, i) => {
    acc[i.priority] = (acc[i.priority] || 0) + 1;
    return acc;
  }, {} as Record<Priority, number>);

  return (
    <div className="px-4 md:px-6 py-2 border-b bg-muted/10 flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-muted-foreground">Total:</span>
        <Badge variant="secondary" className="font-semibold">{total}</Badge>
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-muted-foreground">By Priority:</span>
        {(Object.keys(PRIORITY_STYLES) as Priority[]).map((priority) => (
          <span key={priority} className="flex items-center gap-1">
            <span className="text-muted-foreground capitalize">{priority}:</span>
            <span className="font-medium">{priorityCounts[priority] || 0}</span>
          </span>
        ))}
      </div>
      
      <div className="h-4 w-px bg-border hidden md:block" />
      
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <span className="text-muted-foreground">By Team:</span>
        {(Object.keys(TEAM_COLORS) as Team[]).map((team) => (
          teamCounts[team] ? (
            <Badge 
              key={team} 
              variant="secondary"
              className={`${TEAM_COLORS[team].bg} ${TEAM_COLORS[team].text} border-0`}
            >
              {TEAM_COLORS[team].label}: {teamCounts[team]}
            </Badge>
          ) : null
        ))}
      </div>
    </div>
  );
}
