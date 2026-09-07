import { PriorityIndicator } from "../PriorityIndicator";

export default function PriorityIndicatorExample() {
  return (
    <div className="flex flex-col gap-2">
      <PriorityIndicator priority="high" />
      <PriorityIndicator priority="medium" />
      <PriorityIndicator priority="low" />
    </div>
  );
}
