import { useState } from "react";
import { InitiativeDetailModal } from "../InitiativeDetailModal";
import { Button } from "@/components/ui/button";
import type { Initiative } from "@/lib/types";

const mockInitiative: Initiative = {
  id: "1",
  title: "Implement User Authentication System",
  description: "Build a comprehensive OAuth2 integration with Google, GitHub, and email/password authentication. Include password reset, session management, and 2FA support.",
  team: "engineering",
  priority: "high",
  quarter: "Q1",
};

export default function InitiativeDetailModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>View Details</Button>
      <InitiativeDetailModal
        open={open}
        initiative={mockInitiative}
        onClose={() => setOpen(false)}
        onEdit={(i) => console.log("Edit:", i.title)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}
