// Latest Talks Website Importer - Figma plugin main code
// Reads token + page-capture JSON (produced by the export scripts) and
// rebuilds the website as native Figma frames, text layers and styles.

interface RGBA_ {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface GradientData {
  angle: number;
  stops: { color: RGBA_; position: number }[];
}

interface TextStyleData {
  fontSize: number;
  fontWeight: number;
  color: RGBA_;
  lineHeight: number | null;
  letterSpacing: number;
  textAlign: string;
  italic: boolean;
  textTransform: string;
}

interface LayoutData {
  mode: "row" | "column" | "grid";
  reverse?: boolean;
  gap: number;
  rowGap?: number;
  justify?: string;
  align?: string;
  wrap?: boolean;
  pt: number;
  pr: number;
  pb: number;
  pl: number;
}

interface CapturedNode {
  type: "FRAME" | "TEXT" | "IMAGE" | "SVG" | "PLACEHOLDER";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  bg?: RGBA_;
  gradient?: GradientData;
  bgImage?: string;
  bgImageData?: string;
  radius?: number[];
  borderWidth?: number;
  borderColor?: RGBA_;
  clips?: boolean;
  layout?: LayoutData;
  children?: CapturedNode[];
  content?: string;
  style?: TextStyleData;
  src?: string;
  srcData?: string;
  alt?: string;
  objectFit?: string;
  svg?: string;
  color?: RGBA_ | null;
  label?: string;
}

interface PageCapture {
  name: string;
  path: string;
  desktop: CapturedNode | null;
  mobile: CapturedNode | null;
}

interface TokensFile {
  brand: Record<string, string>;
  colors: { light: Record<string, string>; dark: Record<string, string> };
  typography: {
    name: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
  }[];
}

figma.showUI(__html__, { width: 360, height: 420 });

const WEIGHT_STYLES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

const loadedFonts = new Set<string>();
const failedFonts = new Set<string>();
const FALLBACK_FONT: FontName = { family: "Inter", style: "Regular" };

function weightToStyle(weight: number, italic: boolean): string {
  const nearest = Object.keys(WEIGHT_STYLES)
    .map(Number)
    .reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
  const base = WEIGHT_STYLES[nearest];
  if (!italic) return base;
  return base === "Regular" ? "Italic" : `${base} Italic`;
}

async function getFont(weight: number, italic: boolean): Promise<FontName> {
  const style = weightToStyle(weight, italic);
  const key = `Poppins/${style}`;
  if (loadedFonts.has(key)) return { family: "Poppins", style };
  if (!failedFonts.has(key)) {
    try {
      await figma.loadFontAsync({ family: "Poppins", style });
      loadedFonts.add(key);
      return { family: "Poppins", style };
    } catch (e) {
      failedFonts.add(key);
      log(`Poppins ${style} not available, falling back to Inter`);
    }
  }
  await figma.loadFontAsync(FALLBACK_FONT);
  return FALLBACK_FONT;
}

function log(text: string): void {
  figma.ui.postMessage({ type: "log", text });
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

function solidPaint(c: RGBA_): SolidPaint {
  return {
    type: "SOLID",
    color: { r: c.r, g: c.g, b: c.b },
    opacity: c.a,
  };
}

function gradientPaint(g: GradientData): GradientPaint {
  // CSS angle: 0deg points up, clockwise. Build a gradient transform.
  const rad = ((g.angle - 90) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const transform: Transform = [
    [cos, -sin, 0.5 - 0.5 * cos + 0.5 * sin],
    [sin, cos, 0.5 - 0.5 * sin - 0.5 * cos],
  ];
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: transform,
    gradientStops: g.stops.map((s) => ({
      position: Math.max(0, Math.min(1, s.position)),
      color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a },
    })),
  };
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) return null;
  return figma.base64Decode(dataUrl.slice(idx + 7));
}

const imageHashCache = new Map<string, string>();

function imagePaintFromDataUrl(dataUrl: string, objectFit?: string): ImagePaint | null {
  let hash = imageHashCache.get(dataUrl);
  if (!hash) {
    const bytes = dataUrlToBytes(dataUrl);
    if (!bytes) return null;
    try {
      hash = figma.createImage(bytes).hash;
    } catch (e) {
      return null;
    }
    imageHashCache.set(dataUrl, hash);
  }
  return {
    type: "IMAGE",
    imageHash: hash,
    scaleMode: objectFit === "contain" ? "FIT" : "FILL",
  };
}

function applyCorners(node: RectangleCornerMixin, radius?: number[]): void {
  if (!radius) return;
  node.topLeftRadius = radius[0] || 0;
  node.topRightRadius = radius[1] || 0;
  node.bottomRightRadius = radius[2] || 0;
  node.bottomLeftRadius = radius[3] || 0;
}

function mapJustify(justify?: string): "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" {
  switch (justify) {
    case "center":
      return "CENTER";
    case "flex-end":
    case "end":
      return "MAX";
    case "space-between":
    case "space-around":
    case "space-evenly":
      return "SPACE_BETWEEN";
    default:
      return "MIN";
  }
}

function mapAlign(align?: string): "MIN" | "CENTER" | "MAX" {
  switch (align) {
    case "center":
      return "CENTER";
    case "flex-end":
    case "end":
      return "MAX";
    default:
      return "MIN";
  }
}

function applyTransformCase(content: string, transform?: string): string {
  if (transform === "uppercase") return content.toUpperCase();
  if (transform === "lowercase") return content.toLowerCase();
  return content;
}

let builtNodes = 0;

async function yieldEvery(n: number): Promise<void> {
  builtNodes++;
  if (builtNodes % n === 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
  }
}

async function buildText(data: CapturedNode): Promise<TextNode> {
  const t = figma.createText();
  const style = data.style || {
    fontSize: 16,
    fontWeight: 400,
    color: { r: 0, g: 0, b: 0, a: 1 },
    lineHeight: null,
    letterSpacing: 0,
    textAlign: "left",
    italic: false,
    textTransform: "none",
  };
  const font = await getFont(style.fontWeight, style.italic);
  t.fontName = font;
  t.characters = applyTransformCase(data.content || "", style.textTransform);
  t.fontSize = Math.max(1, style.fontSize);
  t.fills = [solidPaint(style.color)];
  if (style.lineHeight) {
    t.lineHeight = { value: style.lineHeight, unit: "PIXELS" };
  }
  if (style.letterSpacing) {
    t.letterSpacing = { value: style.letterSpacing, unit: "PIXELS" };
  }
  t.textAlignHorizontal =
    style.textAlign === "center" ? "CENTER" : style.textAlign === "right" ? "RIGHT" : "LEFT";
  t.textAutoResize = "HEIGHT";
  t.resize(Math.max(4, data.w), Math.max(4, data.h));
  t.name = (data.content || "text").slice(0, 40);
  return t;
}

function buildImage(data: CapturedNode): SceneNode {
  const rect = figma.createRectangle();
  rect.resize(Math.max(1, data.w), Math.max(1, data.h));
  rect.name = data.alt ? `img: ${data.alt.slice(0, 30)}` : data.name || "image";
  applyCorners(rect, data.radius);
  const dataUrl = data.srcData;
  const paint = dataUrl ? imagePaintFromDataUrl(dataUrl, data.objectFit) : null;
  if (paint) {
    rect.fills = [paint];
  } else {
    rect.fills = [
      { type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.87 } },
    ];
  }
  return rect;
}

async function buildPlaceholder(data: CapturedNode): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.resize(Math.max(1, data.w), Math.max(1, data.h));
  frame.name = `Placeholder: ${data.label || "embed"}`;
  frame.fills = [{ type: "SOLID", color: { r: 0.12, g: 0.16, b: 0.23 } }];
  frame.cornerRadius = 8;
  if (data.w > 60 && data.h > 24) {
    const label = figma.createText();
    const font = await getFont(600, false);
    label.fontName = font;
    label.characters = data.label || "Embed";
    label.fontSize = Math.min(16, Math.max(10, data.h / 6));
    label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.7 }];
    label.textAlignHorizontal = "CENTER";
    frame.appendChild(label);
    label.x = data.w / 2 - label.width / 2;
    label.y = data.h / 2 - label.height / 2;
  }
  return frame;
}

function buildSvg(data: CapturedNode): SceneNode | null {
  if (!data.svg) return null;
  let svg = data.svg;
  if (data.color) {
    const rgb = `rgb(${Math.round(data.color.r * 255)},${Math.round(data.color.g * 255)},${Math.round(
      data.color.b * 255,
    )})`;
    svg = svg.split("currentColor").join(rgb);
  }
  try {
    const node = figma.createNodeFromSvg(svg);
    node.name = data.name || "icon";
    if (data.w > 0 && data.h > 0 && node.width > 0 && node.height > 0) {
      node.resize(data.w, data.h);
    }
    return node;
  } catch (e) {
    return null;
  }
}

async function buildNode(data: CapturedNode): Promise<SceneNode | null> {
  await yieldEvery(150);
  switch (data.type) {
    case "TEXT": {
      return buildText(data);
    }
    case "IMAGE": {
      return buildImage(data);
    }
    case "SVG": {
      return buildSvg(data);
    }
    case "PLACEHOLDER": {
      return buildPlaceholder(data);
    }
    case "FRAME": {
      return buildFrame(data);
    }
    default:
      return null;
  }
}

async function buildFrame(data: CapturedNode): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.resize(Math.max(1, data.w), Math.max(1, data.h));
  frame.name = data.name || "frame";
  frame.clipsContent = !!data.clips;
  if (typeof data.opacity === "number" && data.opacity < 1) {
    frame.opacity = data.opacity;
  }

  const fills: Paint[] = [];
  if (data.bg) fills.push(solidPaint(data.bg));
  if (data.gradient) fills.push(gradientPaint(data.gradient));
  if (data.bgImageData) {
    const paint = imagePaintFromDataUrl(data.bgImageData);
    if (paint) fills.push(paint);
  }
  frame.fills = fills;

  applyCorners(frame, data.radius);

  if (data.borderWidth && data.borderColor) {
    frame.strokes = [solidPaint(data.borderColor)];
    frame.strokeWeight = data.borderWidth;
    frame.strokeAlign = "INSIDE";
  }

  const children = data.children || [];
  const layout = data.layout;
  const useAutoLayout = !!layout && layout.mode !== "grid" && children.length > 0;

  if (useAutoLayout && layout) {
    frame.layoutMode = layout.mode === "column" ? "VERTICAL" : "HORIZONTAL";
    frame.itemSpacing = layout.gap || 0;
    frame.paddingTop = layout.pt;
    frame.paddingRight = layout.pr;
    frame.paddingBottom = layout.pb;
    frame.paddingLeft = layout.pl;
    frame.primaryAxisAlignItems = mapJustify(layout.justify);
    frame.counterAxisAlignItems = mapAlign(layout.align);
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "FIXED";
    if (layout.wrap && layout.mode === "row") {
      frame.layoutWrap = "WRAP";
      frame.counterAxisSpacing = layout.rowGap != null ? layout.rowGap : layout.gap || 0;
    }
  }

  const ordered = layout && layout.reverse ? children.slice().reverse() : children;
  for (const childData of ordered) {
    const child = await buildNode(childData);
    if (!child) continue;
    frame.appendChild(child);
    if (useAutoLayout) {
      if ("layoutSizingHorizontal" in child) {
        try {
          child.layoutSizingHorizontal = "FIXED";
          child.layoutSizingVertical = "FIXED";
        } catch (e) {
          // some node types don't allow this; ignore
        }
      }
      if (child.type !== "TEXT" && "resize" in child) {
        try {
          child.resize(Math.max(1, childData.w), Math.max(1, childData.h));
        } catch (e) {
          // ignore
        }
      }
    } else {
      child.x = childData.x;
      child.y = childData.y;
    }
  }

  // Re-assert size: auto layout may have grown the frame.
  try {
    frame.resize(Math.max(1, data.w), Math.max(1, data.h));
  } catch (e) {
    // ignore
  }
  return frame;
}

async function createColorStyles(tokens: TokensFile): Promise<number> {
  let count = 0;
  const groups: [string, Record<string, string>][] = [
    ["Brand", tokens.brand],
    ["Light", tokens.colors.light],
    ["Dark", tokens.colors.dark],
  ];
  const existing = await figma.getLocalPaintStylesAsync();
  const existingNames = new Set(existing.map((s) => s.name));
  for (const [group, colors] of groups) {
    for (const key of Object.keys(colors)) {
      const name = `Latest Talks/${group}/${key}`;
      if (existingNames.has(name)) continue;
      const style = figma.createPaintStyle();
      style.name = name;
      style.paints = [{ type: "SOLID", color: hexToRgb(colors[key]) }];
      count++;
    }
  }
  return count;
}

async function createTextStyles(tokens: TokensFile): Promise<number> {
  let count = 0;
  const existing = await figma.getLocalTextStylesAsync();
  const existingNames = new Set(existing.map((s) => s.name));
  for (const t of tokens.typography) {
    const name = `Latest Talks/${t.name}`;
    if (existingNames.has(name)) continue;
    const font = await getFont(t.fontWeight, false);
    const style = figma.createTextStyle();
    style.name = name;
    style.fontName = font;
    style.fontSize = t.fontSize;
    style.lineHeight = { value: t.lineHeight * 100, unit: "PERCENT" };
    if (t.letterSpacing) {
      style.letterSpacing = { value: t.letterSpacing, unit: "PERCENT" };
    }
    count++;
  }
  return count;
}

async function buildPage(capture: PageCapture): Promise<void> {
  const page = figma.createPage();
  page.name = capture.name;
  await figma.setCurrentPageAsync(page);

  let x = 0;
  const variants: [string, CapturedNode | null, number][] = [
    ["Desktop 1440", capture.desktop, 1440],
    ["Mobile 390", capture.mobile, 390],
  ];
  for (const [label, rootData, width] of variants) {
    if (!rootData) {
      log(`  (no ${label} capture for ${capture.name})`);
      continue;
    }
    builtNodes = 0;
    const frame = await buildFrame(rootData);
    frame.name = `${capture.name} - ${label}`;
    frame.x = x;
    frame.y = 0;
    frame.clipsContent = true;
    page.appendChild(frame);
    x += width + 200;
    log(`  built ${label} (${builtNodes} layers)`);
  }
}

figma.ui.onmessage = async (msg: {
  type: string;
  tokens?: TokensFile;
  page?: PageCapture;
  pageCount?: number;
}) => {
  try {
    if (msg.type === "start") {
      await figma.loadFontAsync(FALLBACK_FONT);
      if (msg.tokens) {
        const colorCount = await createColorStyles(msg.tokens);
        const textCount = await createTextStyles(msg.tokens);
        log(`Created ${colorCount} color styles and ${textCount} text styles.`);
      }
      figma.ui.postMessage({ type: "next-page" });
    } else if (msg.type === "page" && msg.page) {
      log(`Building page: ${msg.page.name}...`);
      await buildPage(msg.page);
      figma.ui.postMessage({ type: "next-page" });
    } else if (msg.type === "finish") {
      log("Import complete.");
      figma.notify("Latest Talks import complete");
      figma.ui.postMessage({ type: "done" });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log(`ERROR: ${message}`);
    figma.ui.postMessage({ type: "next-page" });
  }
};
