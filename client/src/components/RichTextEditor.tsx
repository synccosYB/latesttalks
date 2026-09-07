import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  className = "",
  "data-testid": testId,
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] p-3 focus:outline-none prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-primary [&_a]:underline [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
        ...(testId ? { "data-testid": testId } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const activeStates = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      heading: editor?.isActive("heading", { level: 3 }) ?? false,
      link: editor?.isActive("link") ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const existingHref = editor.getAttributes("link").href as
      | string
      | undefined;
    setLinkUrl(existingHref || "");
    setLinkDialogOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:\/\/|mailto:|tel:)/i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href })
        .run();
    }
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
  }, [editor]);

  if (!editor) return null;

  const toolbarButtons: {
    icon: typeof Bold;
    tooltip: string;
    testId: string;
    isActive?: boolean;
    disabled?: boolean;
    onClick: () => void;
    separatorBefore?: boolean;
  }[] = [
    {
      icon: Bold,
      tooltip: "Bold (Ctrl+B)",
      testId: "button-format-bold",
      isActive: activeStates?.bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      tooltip: "Italic (Ctrl+I)",
      testId: "button-format-italic",
      isActive: activeStates?.italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Underline,
      tooltip: "Underline (Ctrl+U)",
      testId: "button-format-underline",
      isActive: activeStates?.underline,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: List,
      tooltip: "Bullet List",
      testId: "button-format-insertUnorderedList",
      isActive: activeStates?.bulletList,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      separatorBefore: true,
    },
    {
      icon: ListOrdered,
      tooltip: "Numbered List",
      testId: "button-format-insertOrderedList",
      isActive: activeStates?.orderedList,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Heading2,
      tooltip: "Heading",
      testId: "button-format-formatBlock",
      isActive: activeStates?.heading,
      onClick: () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      separatorBefore: true,
    },
    {
      icon: LinkIcon,
      tooltip: "Insert Link",
      testId: "button-format-link",
      isActive: activeStates?.link,
      onClick: openLinkDialog,
    },
    {
      icon: Undo,
      tooltip: "Undo (Ctrl+Z)",
      testId: "button-format-undo",
      disabled: !activeStates?.canUndo,
      onClick: () => editor.chain().focus().undo().run(),
      separatorBefore: true,
    },
    {
      icon: Redo,
      tooltip: "Redo (Ctrl+Y)",
      testId: "button-format-redo",
      disabled: !activeStates?.canRedo,
      onClick: () => editor.chain().focus().redo().run(),
    },
  ];

  return (
    <div className={`border rounded-md bg-background ${className}`}>
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        {toolbarButtons.map((btn) => (
          <div key={btn.testId} className="flex items-center">
            {btn.separatorBefore && (
              <Separator orientation="vertical" className="h-6 mx-1" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 toggle-elevate ${btn.isActive ? "toggle-elevated" : ""}`}
                  disabled={btn.disabled}
                  onClick={btn.onClick}
                  data-testid={btn.testId}
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {btn.tooltip}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>

      <EditorContent editor={editor} />

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
              data-testid="input-link-url"
            />
          </div>
          <DialogFooter className="gap-2">
            {activeStates?.link && (
              <Button
                type="button"
                variant="outline"
                onClick={removeLink}
                data-testid="button-remove-link"
              >
                Remove Link
              </Button>
            )}
            <Button
              type="button"
              onClick={applyLink}
              data-testid="button-apply-link"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
