import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { useState } from "react";
import { Initiative, Quarter, QUARTERS } from "@/lib/types";
import { QuarterColumn } from "./QuarterColumn";
import { InitiativeCard } from "./InitiativeCard";

interface TimelineViewProps {
  initiatives: Initiative[];
  year: number;
  onInitiativeClick: (initiative: Initiative) => void;
  onAddClick: (quarter: Quarter) => void;
  onMoveInitiative: (initiativeId: string, newQuarter: Quarter) => void;
}

export function TimelineView({
  initiatives,
  year,
  onInitiativeClick,
  onAddClick,
  onMoveInitiative,
}: TimelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const activeInitiative = activeId 
    ? initiatives.find(i => i.id === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const quarter = over.id as Quarter;
      if (QUARTERS.includes(quarter)) {
        onMoveInitiative(active.id as string, quarter);
      }
    }
    
    setActiveId(null);
  };

  const getInitiativesByQuarter = (quarter: Quarter) => {
    return initiatives.filter(i => i.quarter === quarter);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 md:p-6 overflow-x-auto min-h-[calc(100vh-8rem)]">
        {QUARTERS.map((quarter) => (
          <QuarterColumn
            key={quarter}
            quarter={quarter}
            year={year}
            initiatives={getInitiativesByQuarter(quarter)}
            onInitiativeClick={onInitiativeClick}
            onAddClick={() => onAddClick(quarter)}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeInitiative && (
          <div className="w-[280px] opacity-90">
            <InitiativeCard initiative={activeInitiative} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
