import { useState } from "react";
import { InitiativeModal } from "../InitiativeModal";
import { Button } from "@/components/ui/button";

export default function InitiativeModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <InitiativeModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => console.log("Submitted:", data)}
        defaultQuarter="Q2"
      />
    </div>
  );
}
