export function stripHtmlToText(input: string | null | undefined): string {
  if (!input) return "";

  let text = input;

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, "\n");
  text = text.replace(/<(p|div|h[1-6]|blockquote|pre)(\s[^>]*)?>/gi, "\n");
  text = text.replace(/<li(\s[^>]*)?>/gi, "\n- ");
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, "");

  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_m, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : _m;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : _m;
    })
    .replace(/&amp;/gi, "&");

  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
