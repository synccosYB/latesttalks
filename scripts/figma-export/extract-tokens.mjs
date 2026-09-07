import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const cssPath = path.join(root, "client/src/index.css");
const outDir = path.join(root, "exports/figma-export/data");

const css = fs.readFileSync(cssPath, "utf8");

function extractBlock(source, selector) {
  const startIdx = source.indexOf(selector);
  if (startIdx === -1) return "";
  const open = source.indexOf("{", startIdx);
  let depth = 1;
  let i = open + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    i++;
  }
  return source.slice(open + 1, i - 1);
}

function hslTripleToHex(triple) {
  const m = triple.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function parseVars(block) {
  const out = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block))) {
    const name = m[1];
    const value = m[2].trim();
    if (out[name] !== undefined) continue; // keep the first (fallback) declaration
    const hex = hslTripleToHex(value);
    if (hex) out[name] = hex;
  }
  return out;
}

const lightVars = parseVars(extractBlock(css, ":root"));
const darkVars = parseVars(extractBlock(css, ".dark"));

const colorTokenOrder = [
  "background", "foreground", "border", "input", "ring",
  "card", "card-foreground", "card-border",
  "popover", "popover-foreground", "popover-border",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "sidebar", "sidebar-foreground", "sidebar-border",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
];

function pick(vars) {
  const out = {};
  for (const k of colorTokenOrder) if (vars[k]) out[k] = vars[k];
  return out;
}

const tokens = {
  meta: {
    project: "Latest Talks",
    generatedAt: new Date().toISOString(),
    fontFamily: "Poppins",
  },
  brand: {
    Navy: "#10213A",
    Red: "#DE2026",
    Cream: "#F0EDEB",
    Orange: "#FF6B35",
    White: "#FFFFFF",
  },
  colors: {
    light: pick(lightVars),
    dark: pick(darkVars),
  },
  typography: [
    { name: "Display / Hero", fontSize: 56, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 },
    { name: "Page Title", fontSize: 40, fontWeight: 600, lineHeight: 1.2, letterSpacing: 0 },
    { name: "Section Heading", fontSize: 28, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0 },
    { name: "Card Title", fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 },
    { name: "Body Large", fontSize: 18, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
    { name: "Body", fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
    { name: "Small", fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
    { name: "Caption", fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0 },
  ],
  radii: { lg: 9, md: 6, sm: 3, DEFAULT: 8 },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64, 80, 96],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "tokens.json"), JSON.stringify(tokens, null, 2));
console.log("tokens.json written:",
  Object.keys(tokens.colors.light).length, "light colors,",
  Object.keys(tokens.colors.dark).length, "dark colors,",
  tokens.typography.length, "text styles");
