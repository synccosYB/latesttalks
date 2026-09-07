import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { InitiativeCard } from "../InitiativeCard";
import type { Initiative } from "@/lib/types";

const mockInitiative: Initiative = {
  id: "1",
  title: "Implement user authentication system",
  description: "Build OAuth2 integration with Google and GitHub providers for seamless user login experience",
  team: "engineering",
  priority: "high",
  quarter: "Q1",
};

export default function InitiativeCardExample() {
  return (
    <DndContext>
      <SortableContext items={[mockInitiative.id]} strategy={verticalListSortingStrategy}>
        <div className="max-w-sm">
          <InitiativeCard 
            initiative={mockInitiative} 
            onClick={() => console.log("Card clicked")}
          />
        </div>
      </SortableContext>
    </DndContext>
  );
}
