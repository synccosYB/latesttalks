import { useState } from "react";
import { Header } from "../Header";

export default function HeaderExample() {
  const [year, setYear] = useState(2024);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  return (
    <Header
      year={year}
      onYearChange={setYear}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onAddInitiative={() => console.log("Add initiative")}
    />
  );
}
