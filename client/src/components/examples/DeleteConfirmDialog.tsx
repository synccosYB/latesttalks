import { useState } from "react";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { Button } from "@/components/ui/button";

export default function DeleteConfirmDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>Delete</Button>
      <DeleteConfirmDialog
        open={open}
        title="User Authentication System"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          console.log("Deleted!");
          setOpen(false);
        }}
      />
    </div>
  );
}
