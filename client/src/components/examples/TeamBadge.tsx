import { TeamBadge } from "../TeamBadge";

export default function TeamBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <TeamBadge team="engineering" />
      <TeamBadge team="design" />
      <TeamBadge team="marketing" />
      <TeamBadge team="product" />
      <TeamBadge team="sales" />
    </div>
  );
}
