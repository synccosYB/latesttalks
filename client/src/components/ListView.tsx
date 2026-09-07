import { Initiative, QUARTERS, PRIORITY_STYLES } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";
import { PriorityIndicator } from "./PriorityIndicator";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (initiative: Initiative) => void;
}

export function ListView({ initiatives, onInitiativeClick }: ListViewProps) {
  const sortedInitiatives = [...initiatives].sort((a, b) => {
    const quarterOrder = QUARTERS.indexOf(a.quarter) - QUARTERS.indexOf(b.quarter);
    if (quarterOrder !== 0) return quarterOrder;
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (initiatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">No initiatives found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first initiative to get started
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Initiative</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Quarter</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInitiatives.map((initiative) => (
            <TableRow
              key={initiative.id}
              className="cursor-pointer hover-elevate"
              onClick={() => onInitiativeClick(initiative)}
              data-testid={`row-initiative-${initiative.id}`}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{initiative.title}</p>
                  {initiative.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {initiative.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <TeamBadge team={initiative.team} size="sm" />
              </TableCell>
              <TableCell>
                <PriorityIndicator priority={initiative.priority} />
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">{initiative.quarter}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
