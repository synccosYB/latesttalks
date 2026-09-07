import { useState } from "react";
import { TimelineView } from "../TimelineView";
import type { Initiative, Quarter } from "@/lib/types";

const initialMockData: Initiative[] = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Build OAuth2 integration with Google and GitHub providers",
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
  {
    id: "3",
    title: "Launch email campaign",
    description: "Q2 product launch marketing push",
    team: "marketing",
    priority: "high",
    quarter: "Q2",
  },
  {
    id: "4",
    title: "Mobile app beta",
    description: "Release beta version to early adopters",
    team: "product",
    priority: "high",
    quarter: "Q3",
  },
  {
    id: "5",
    title: "Sales training program",
    description: "Train sales team on new product features",
    team: "sales",
    priority: "low",
    quarter: "Q4",
  },
];

export default function TimelineViewExample() {
  const [initiatives, setInitiatives] = useState(initialMockData);

  const handleMove = (id: string, newQuarter: Quarter) => {
    setInitiatives(prev => 
      prev.map(i => i.id === id ? { ...i, quarter: newQuarter } : i)
    );
  };

  return (
    <div className="h-[500px] overflow-auto bg-background">
      <TimelineView
        initiatives={initiatives}
        year={2024}
        onInitiativeClick={(i) => console.log("Clicked:", i.title)}
        onAddClick={(q) => console.log("Add to:", q)}
        onMoveInitiative={handleMove}
      />
    </div>
  );
}
