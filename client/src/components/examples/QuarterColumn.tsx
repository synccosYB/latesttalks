import { DndContext } from "@dnd-kit/core";
import { QuarterColumn } from "../QuarterColumn";
import type { Initiative } from "@/lib/types";

const mockInitiatives: Initiative[] = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Build OAuth2 integration with Google and GitHub",
    team: "engineering",
    priority: "high",
    quarter: "Q1",
  },
  {
    id: "2",
    title: "Redesign dashboard UI",
    description: "Create modern, intuitive dashboard experience",
    team: "design",
    priority: "medium",
    quarter: "Q1",
  },
];

export default function QuarterColumnExample() {
  return (
    <DndContext>
      <div className="max-w-sm">
        <QuarterColumn
          quarter="Q1"
          year={2024}
          initiatives={mockInitiatives}
          onInitiativeClick={(i) => console.log("Clicked:", i.title)}
          onAddClick={() => console.log("Add clicked")}
        />
      </div>
    </DndContext>
  );
}
