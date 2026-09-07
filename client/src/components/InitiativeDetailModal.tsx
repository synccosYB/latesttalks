import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Initiative } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";
import { PriorityIndicator } from "./PriorityIndicator";
import { Edit, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface InitiativeDetailModalProps {
  open: boolean;
  initiative: Initiative | null;
  onClose: () => void;
  onEdit: (initiative: Initiative) => void;
  onDelete: (id: string) => void;
}

export function InitiativeDetailModal({ 
  open, 
  initiative, 
  onClose, 
  onEdit,
  onDelete 
}: InitiativeDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!initiative) return null;

  const handleDelete = () => {
    onDelete(initiative.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl">{initiative.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <TeamBadge team={initiative.team} />
                  <span className="text-sm text-muted-foreground">{initiative.quarter}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-sm">
                {initiative.description || "No description provided."}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Priority</h4>
              <PriorityIndicator priority={initiative.priority} />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
              data-testid="button-delete-initiative"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
            <Button onClick={() => onEdit(initiative)} data-testid="button-edit-initiative">
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        title={initiative.title}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
