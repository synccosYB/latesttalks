export type Team = "engineering" | "design" | "marketing" | "product" | "sales";
export type Priority = "high" | "medium" | "low";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface Initiative {
  id: string;
  title: string;
  description: string;
  team: Team;
  priority: Priority;
  quarter: Quarter;
}

export const TEAM_COLORS: Record<Team, { bg: string; text: string; label: string }> = {
  engineering: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Engineering" },
  design: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300", label: "Design" },
  marketing: { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", label: "Marketing" },
  product: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", label: "Product" },
  sales: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", label: "Sales" },
};

export const PRIORITY_STYLES: Record<Priority, { border: string; label: string }> = {
  high: { border: "border-l-4 border-l-red-500", label: "High" },
  medium: { border: "border-l-4 border-l-amber-500", label: "Medium" },
  low: { border: "border-l-2 border-l-slate-300 dark:border-l-slate-600", label: "Low" },
};

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
