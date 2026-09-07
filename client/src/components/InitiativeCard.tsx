import { Card } from "@/components/ui/card";
import { Initiative, PRIORITY_STYLES } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";
import { PriorityIndicator } from "./PriorityIndicator";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface InitiativeCardProps {
  initiative: Initiative;
  onClick?: () => void;
  isDragging?: boolean;
}

export function InitiativeCard({ initiative, onClick, isDragging }: InitiativeCardProps) {
  const { border } = PRIORITY_STYLES[initiative.priority];
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: initiative.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        ${border} 
        p-3 
        hover-elevate 
        active-elevate-2 
        cursor-pointer 
        group
        ${isDragging ? "opacity-50 shadow-lg" : ""}
      `}
      onClick={onClick}
      data-testid={`card-initiative-${initiative.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-0.5"
          data-testid={`drag-handle-${initiative.id}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{initiative.title}</h4>
            <TeamBadge team={initiative.team} size="sm" />
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {initiative.description}
          </p>
          
          <PriorityIndicator priority={initiative.priority} />
        </div>
      </div>
    </Card>
  );
}
