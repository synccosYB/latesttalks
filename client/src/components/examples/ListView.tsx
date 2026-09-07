import { ListView } from "../ListView";
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
  {
    id: "3",
    title: "Launch email campaign",
    description: "Q2 product launch marketing push",
    team: "marketing",
    priority: "high",
    quarter: "Q2",
  },
];

export default function ListViewExample() {
  return (
    <ListView
      initiatives={mockInitiatives}
      onInitiativeClick={(i) => console.log("Clicked:", i.title)}
    />
  );
}
