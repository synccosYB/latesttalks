import { useMemo } from "react";
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "s",
  "ul", "ol", "li", "h2", "h3", "h4",
  "a", "div", "span", "blockquote",
];
const ALLOWED_ATTR = ["href"];

const LINKIFY_REGEX =
  /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkifyTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const textNode = current as Text;
    if (!textNode.parentElement?.closest("a")) {
      textNodes.push(textNode);
    }
  }

  for (const node of textNodes) {
    const text = node.nodeValue || "";
    LINKIFY_REGEX.lastIndex = 0;
    if (!LINKIFY_REGEX.test(text)) continue;
    LINKIFY_REGEX.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = LINKIFY_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const matched = match[0];
      const anchor = document.createElement("a");
      anchor.textContent = matched;
      if (match[1]) {
        anchor.setAttribute("href", matched);
      } else if (match[2]) {
        anchor.setAttribute("href", `mailto:${matched}`);
      } else {
        anchor.setAttribute("href", `tel:${matched.replace(/[^\d+]/g, "")}`);
      }
      fragment.appendChild(anchor);
      lastIndex = match.index + matched.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode?.replaceChild(fragment, node);
  }
}

interface RichTextContentProps {
  html: string | null | undefined;
  className?: string;
  "data-testid"?: string;
}

export default function RichTextContent({
  html,
  className = "",
  "data-testid": testId,
}: RichTextContentProps) {
  const { renderedHtml, isPlainText } = useMemo(() => {
    if (!html) return { renderedHtml: "", isPlainText: true };

    const plain = !looksLikeHtml(html);
    const source = plain ? escapeHtml(html) : html;

    const clean = DOMPurify.sanitize(source, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });

    const container = document.createElement("div");
    container.innerHTML = clean;

    linkifyTextNodes(container);

    container.querySelectorAll("a").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      if (/^https?:/i.test(href)) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
    });

    return { renderedHtml: container.innerHTML, isPlainText: plain };
  }, [html]);

  if (!renderedHtml) return null;

  return (
    <div
      className={[
        isPlainText ? "whitespace-pre-wrap" : "",
        "[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2",
        "[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2",
        "[&_li]:my-0.5",
        "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1",
        "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1",
        "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1",
        "[&_a]:text-[#DE2026] [&_a]:break-all hover:[&_a]:underline",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-muted [&_blockquote]:pl-3 [&_blockquote]:my-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
