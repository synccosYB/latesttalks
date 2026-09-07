import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const outDir = path.join(root, "exports/figma-export/data/pages");
const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:5000";

const MAX_IMAGE_BYTES = 400 * 1024;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function resolveDynamicPages() {
  const episodes = await getJson(`${BASE}/api/episodes?status=published`);
  const guests = await getJson(`${BASE}/api/guests`);
  const sponsors = await getJson(`${BASE}/api/sponsors`);
  const publicEp = episodes.find((e) => !e.isPremium) || episodes[0];
  return {
    episodeId: publicEp?.id,
    guestId: guests[0]?.id,
    sponsorId: sponsors[0]?.id,
  };
}

const SERIALIZER = `
(() => {
  const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","META","LINK","TEMPLATE","HEAD"]);
  const PLACEHOLDER_TAGS = new Set(["IFRAME","VIDEO","CANVAS","EMBED","OBJECT","AUDIO"]);

  function parseColor(str) {
    if (!str) return null;
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(",").map(s => parseFloat(s.trim()));
    const a = parts.length > 3 ? parts[3] : 1;
    if (a === 0) return null;
    return { r: parts[0] / 255, g: parts[1] / 255, b: parts[2] / 255, a };
  }

  function parseGradient(str) {
    if (!str || str === "none") return null;
    const m = str.match(/linear-gradient\\(([^]*)\\)$/);
    if (!m) return null;
    // split top-level commas
    const inner = m[1];
    const parts = [];
    let depth = 0, cur = "";
    for (const ch of inner) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    let angle = 180;
    let stopsStart = 0;
    const first = parts[0];
    if (/deg/.test(first)) { angle = parseFloat(first); stopsStart = 1; }
    else if (/^to /.test(first)) {
      const map = { "to top": 0, "to right": 90, "to bottom": 180, "to left": 270,
        "to top right": 45, "to bottom right": 135, "to bottom left": 225, "to top left": 315 };
      angle = map[first] !== undefined ? map[first] : 180;
      stopsStart = 1;
    }
    const stops = [];
    const stopParts = parts.slice(stopsStart);
    for (let i = 0; i < stopParts.length; i++) {
      const sp = stopParts[i];
      const color = parseColor(sp) || (sp.includes("transparent") ? { r:0,g:0,b:0,a:0 } : null);
      if (!color && !sp.includes("transparent")) continue;
      const posM = sp.match(/([\\d.]+)%\\s*$/);
      const pos = posM ? parseFloat(posM[1]) / 100 : (stopParts.length > 1 ? i / (stopParts.length - 1) : 0);
      stops.push({ color: color || { r:0,g:0,b:0,a:0 }, position: pos });
    }
    if (stops.length < 2) return null;
    return { angle, stops };
  }

  function fontWeightNum(w) {
    const n = parseInt(w, 10);
    return isNaN(n) ? (w === "bold" ? 700 : 400) : n;
  }

  function textStyleOf(cs) {
    return {
      fontSize: parseFloat(cs.fontSize) || 16,
      fontWeight: fontWeightNum(cs.fontWeight),
      color: parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 },
      lineHeight: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight) || null,
      letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0,
      textAlign: cs.textAlign,
      italic: cs.fontStyle === "italic",
      textTransform: cs.textTransform,
    };
  }

  function nodeName(el) {
    const tag = el.tagName.toLowerCase();
    const tid = el.getAttribute && el.getAttribute("data-testid");
    if (tid) return tag + " " + tid;
    const cls = (typeof el.className === "string" ? el.className : "").split(/\\s+/).filter(c => c && !/[:\\[\\]]/.test(c)).slice(0, 2).join(".");
    return cls ? tag + "." + cls : tag;
  }

  const MAX_DEPTH = 40;
  let nodeCount = 0;
  const MAX_NODES = 6000;

  function serialize(el, parentLeft, parentTop, depth) {
    if (nodeCount > MAX_NODES || depth > MAX_DEPTH) return null;
    if (el.nodeType !== 1) return null;
    if (SKIP_TAGS.has(el.tagName)) return null;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return null;
    const rect = el.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w < 1 || h < 1) return null;
    if (parseFloat(cs.opacity) === 0) return null;
    nodeCount++;

    const x = rect.left + window.scrollX - parentLeft;
    const y = rect.top + window.scrollY - parentTop;
    const absLeft = rect.left + window.scrollX;
    const absTop = rect.top + window.scrollY;

    const base = {
      name: nodeName(el),
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      w: Math.round(w * 100) / 100,
      h: Math.round(h * 100) / 100,
      opacity: parseFloat(cs.opacity),
    };

    if (el.tagName === "svg" || el.tagName === "SVG") {
      const svgText = el.outerHTML;
      if (svgText.length < 20000) {
        return { ...base, type: "SVG", svg: svgText, color: parseColor(cs.color) };
      }
      return { ...base, type: "PLACEHOLDER", label: "Graphic" };
    }

    if (PLACEHOLDER_TAGS.has(el.tagName)) {
      const label = el.getAttribute("title") || (el.tagName === "IFRAME" ? "Video Embed" : el.tagName.toLowerCase());
      return { ...base, type: "PLACEHOLDER", label };
    }

    if (el.tagName === "IMG") {
      return {
        ...base,
        type: "IMAGE",
        src: el.currentSrc || el.src,
        alt: el.alt || "",
        objectFit: cs.objectFit,
        radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(v => parseFloat(v) || 0),
      };
    }

    const frame = { ...base, type: "FRAME", children: [] };

    const bg = parseColor(cs.backgroundColor);
    if (bg) frame.bg = bg;
    const grad = parseGradient(cs.backgroundImage);
    if (grad) frame.gradient = grad;
    // background image (url) on div
    const bgUrlM = cs.backgroundImage && cs.backgroundImage.match(/url\\(["']?(.*?)["']?\\)/);
    if (bgUrlM && !bgUrlM[1].startsWith("data:image/svg")) frame.bgImage = bgUrlM[1];

    const radius = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(v => parseFloat(v) || 0);
    if (radius.some(r => r > 0)) frame.radius = radius;

    const bw = parseFloat(cs.borderTopWidth) || 0;
    const bc = parseColor(cs.borderTopColor);
    if (bw > 0 && bc && cs.borderTopStyle !== "none") { frame.borderWidth = bw; frame.borderColor = bc; }

    if (cs.overflow === "hidden" || cs.overflowX === "hidden") frame.clips = true;

    const disp = cs.display;
    if (disp === "flex" || disp === "inline-flex") {
      frame.layout = {
        mode: cs.flexDirection.startsWith("column") ? "column" : "row",
        reverse: cs.flexDirection.endsWith("reverse"),
        gap: parseFloat(cs.columnGap) || parseFloat(cs.rowGap) || 0,
        justify: cs.justifyContent,
        align: cs.alignItems,
        wrap: cs.flexWrap !== "nowrap",
        pt: parseFloat(cs.paddingTop) || 0,
        pr: parseFloat(cs.paddingRight) || 0,
        pb: parseFloat(cs.paddingBottom) || 0,
        pl: parseFloat(cs.paddingLeft) || 0,
      };
    } else if (disp === "grid") {
      frame.layout = {
        mode: "grid",
        gap: parseFloat(cs.columnGap) || 0,
        rowGap: parseFloat(cs.rowGap) || 0,
        pt: parseFloat(cs.paddingTop) || 0,
        pr: parseFloat(cs.paddingRight) || 0,
        pb: parseFloat(cs.paddingBottom) || 0,
        pl: parseFloat(cs.paddingLeft) || 0,
      };
    }

    // Inputs / textareas: show placeholder text
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
      const ph = el.getAttribute("placeholder") || el.value || "";
      if (ph) {
        frame.children.push({
          type: "TEXT", name: "placeholder", content: ph,
          x: parseFloat(cs.paddingLeft) || 8, y: h / 2 - 8, w: Math.max(20, w - 16), h: 16,
          style: { ...textStyleOf(cs), color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
        });
      }
      return frame;
    }

    // children: elements and direct text nodes
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const text = child.textContent.replace(/\\s+/g, " ").trim();
        if (!text) continue;
        const range = document.createRange();
        range.selectNodeContents(child);
        const r = range.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        frame.children.push({
          type: "TEXT",
          name: "text",
          content: text,
          x: Math.round((r.left + window.scrollX - absLeft) * 100) / 100,
          y: Math.round((r.top + window.scrollY - absTop) * 100) / 100,
          w: Math.round(r.width * 100) / 100 + 2,
          h: Math.round(r.height * 100) / 100,
          style: textStyleOf(cs),
        });
      } else if (child.nodeType === 1) {
        const s = serialize(child, absLeft, absTop, depth + 1);
        if (s) frame.children.push(s);
      }
    }

    return frame;
  }

  document.querySelectorAll("*").forEach(el => {
    el.style.animation = "none";
    el.style.transition = "none";
  });
  window.scrollTo(0, 0);

  const body = document.body;
  const bodyRect = body.getBoundingClientRect();
  const cs = getComputedStyle(body);
  const rootNode = {
    type: "FRAME",
    name: "page",
    x: 0, y: 0,
    w: Math.round(Math.max(document.documentElement.clientWidth, bodyRect.width)),
    h: Math.round(Math.max(document.documentElement.scrollHeight, bodyRect.height)),
    bg: parseColor(cs.backgroundColor) || { r: 0.94, g: 0.93, b: 0.92, a: 1 },
    children: [],
  };
  for (const child of body.children) {
    const s = serialize(child, 0, 0, 0);
    if (s) rootNode.children.push(s);
  }
  return { root: rootNode, nodeCount };
})()
`;

function findChromium() {
  try {
    return execSync("command -v chromium").toString().trim();
  } catch {
    throw new Error("chromium not found in PATH");
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

async function inlineImages(node, cache) {
  const jobs = [];
  function walk(n) {
    if (!n || typeof n !== "object") return;
    for (const key of ["src", "bgImage"]) {
      if (n[key] && !String(n[key]).startsWith("data:")) {
        jobs.push({ node: n, key });
      }
    }
    if (n.children) n.children.forEach(walk);
  }
  walk(node);
  for (const { node: n, key } of jobs) {
    const url = new URL(n[key], BASE).href;
    if (cache.has(url)) {
      const v = cache.get(url);
      if (v) n[key + "Data"] = v;
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_IMAGE_BYTES) {
        cache.set(url, null);
        continue;
      }
      const ct = res.headers.get("content-type") || "image/png";
      if (!ct.startsWith("image/")) { cache.set(url, null); continue; }
      const dataUrl = `data:${ct};base64,${buf.toString("base64")}`;
      cache.set(url, dataUrl);
      n[key + "Data"] = dataUrl;
    } catch {
      cache.set(url, null);
    }
  }
}

async function main() {
  const ids = await resolveDynamicPages();
  console.log("Resolved dynamic ids:", ids);

  const pages = [
    { name: "Home", path: "/" },
    { name: "Podcast", path: "/podcast" },
    ids.episodeId && { name: "Episode Detail", path: `/episode/${ids.episodeId}` },
    { name: "Guests", path: "/guests" },
    ids.guestId && { name: "Guest Profile", path: `/guest/${ids.guestId}` },
    { name: "Hosts", path: "/hosts" },
    { name: "Sponsors", path: "/sponsors" },
    ids.sponsorId && { name: "Sponsor Detail", path: `/sponsor/${ids.sponsorId}` },
    { name: "Advertise", path: "/ads" },
    { name: "Community", path: "/community" },
    { name: "Latest Talks Plus", path: "/plus" },
    { name: "Support Us", path: "/sponsor" },
    { name: "Gift", path: "/gift" },
    { name: "Contact", path: "/contact" },
    { name: "Guest Application", path: "/apply" },
  ].filter(Boolean);

  const browser = await puppeteer.launch({
    executablePath: findChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"],
  });

  fs.mkdirSync(outDir, { recursive: true });
  const imageCache = new Map();
  const viewports = [
    { key: "desktop", width: 1440, height: 900 },
    { key: "mobile", width: 390, height: 844 },
  ];

  const maxPages = parseInt(process.env.MAX_PAGES || "99", 10);
  let captured = 0;
  const index = [];
  for (const pg of pages) {
    const slug0 = pg.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const outFile = path.join(outDir, `${slug0}.json`);
    if (fs.existsSync(outFile)) {
      const prev = JSON.parse(fs.readFileSync(outFile, "utf8"));
      if (prev.desktop && prev.mobile) {
        index.push({ name: pg.name, path: pg.path, file: `${slug0}.json`, ok: true });
        console.log(`SKIP ${pg.name} (already captured)`);
        continue;
      }
    }
    if (captured >= maxPages) {
      index.push({ name: pg.name, path: pg.path, file: `${slug0}.json`, ok: false, pending: true });
      continue;
    }
    captured++;
    const result = { name: pg.name, path: pg.path };
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      try {
        await page.goto(`${BASE}${pg.path}`, { waitUntil: "networkidle2", timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        await autoScroll(page);
        await new Promise((r) => setTimeout(r, 500));
        const data = await page.evaluate(SERIALIZER);
        await inlineImages(data.root, imageCache);
        result[vp.key] = data.root;
        console.log(`${pg.name} [${vp.key}]: ${data.nodeCount} nodes, ${Math.round(data.root.h)}px tall`);
      } catch (e) {
        console.error(`FAILED ${pg.name} [${vp.key}]:`, e.message);
        result[vp.key] = null;
      } finally {
        await page.close();
      }
    }
    const slug = pg.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const file = path.join(outDir, `${slug}.json`);
    fs.writeFileSync(file, JSON.stringify(result));
    index.push({ name: pg.name, path: pg.path, file: `${slug}.json`, ok: !!(result.desktop && result.mobile) });
  }

  fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));
  await browser.close();
  console.log("\nCapture complete:");
  for (const i of index) console.log(` ${i.ok ? "OK " : "ERR"} ${i.name} (${i.file})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
