import { StatsBar } from "../StatsBar";
import type { Initiative } from "@/lib/types";

const mockInitiatives: Initiative[] = [
  { id: "1", title: "Auth", description: "", team: "engineering", priority: "high", quarter: "Q1" },
  { id: "2", title: "UI", description: "", team: "design", priority: "medium", quarter: "Q1" },
  { id: "3", title: "Campaign", description: "", team: "marketing", priority: "high", quarter: "Q2" },
  { id: "4", title: "Mobile", description: "", team: "product", priority: "low", quarter: "Q3" },
  { id: "5", title: "Training", description: "", team: "sales", priority: "medium", quarter: "Q4" },
];

export default function StatsBarExample() {
  return <StatsBar initiatives={mockInitiatives} />;
}
