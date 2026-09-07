import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Initiative, Quarter } from "@/lib/types";
import { InitiativeCard } from "./InitiativeCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuarterColumnProps {
  quarter: Quarter;
  year: number;
  initiatives: Initiative[];
  onInitiativeClick: (initiative: Initiative) => void;
  onAddClick: () => void;
}

export function QuarterColumn({ 
  quarter, 
  year, 
  initiatives, 
  onInitiativeClick,
  onAddClick 
}: QuarterColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: quarter,
  });

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {quarter} {year}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initiatives.length} initiative{initiatives.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onAddClick}
            data-testid={`button-add-${quarter}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`
          flex-1 
          min-h-[200px] 
          rounded-lg 
          p-2 
          transition-colors
          ${isOver 
            ? "bg-primary/5 border-2 border-dashed border-primary/30" 
            : "bg-muted/30 border-2 border-dashed border-transparent"
          }
        `}
        data-testid={`dropzone-${quarter}`}
      >
        <SortableContext 
          items={initiatives.map(i => i.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {initiatives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No initiatives</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag items here or click + to add
                </p>
              </div>
            ) : (
              initiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  onClick={() => onInitiativeClick(initiative)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
