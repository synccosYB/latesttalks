---
name: Rich text rendering convention
description: How admin-entered HTML descriptions are displayed on public pages
---

Episode descriptions are stored as HTML (produced by a contentEditable rich-text editor in the admin area).

**Rule:** Full-content public views render that HTML sanitized via the `RichTextContent` component (DOMPurify allow-list + auto-linking of URLs/emails/phones). Card/list excerpts use `stripHtmlToText` from `shared/textUtils.ts` for plain-text previews.

**Why:** Stripping HTML on the full episode page silently discarded admin formatting (bold, lists, headings); the decision was to render sanitized HTML rather than downgrade the editor to a plain textarea.

**How to apply:** Any new public surface that shows a full rich-text field should use `RichTextContent`, never raw `dangerouslySetInnerHTML` and never `stripHtmlToText` (that's only for excerpts).

**Editor side:** The admin editor is TipTap-based (`RichTextEditor`), replacing the deprecated `document.execCommand`. Any change to the editor's output must stay within `RichTextContent`'s DOMPurify allow-list (p, br, strong/em/u/s, ul/ol/li, h2-h4, a[href], div, span, blockquote) — new marks/nodes outside that list will be silently stripped on public pages unless the allow-list is updated in lockstep. TipTap v3 note: StarterKit already bundles Link and Underline; toolbar active states require `useEditorState` (editor doesn't re-render on transactions by default).
