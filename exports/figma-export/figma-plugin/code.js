"use strict";
// Latest Talks Website Importer - Figma plugin main code
// Reads token + page-capture JSON (produced by the export scripts) and
// rebuilds the website as native Figma frames, text layers and styles.
figma.showUI(__html__, { width: 360, height: 420 });
const WEIGHT_STYLES = {
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
const loadedFonts = new Set();
const failedFonts = new Set();
const FALLBACK_FONT = { family: "Inter", style: "Regular" };
function weightToStyle(weight, italic) {
    const nearest = Object.keys(WEIGHT_STYLES)
        .map(Number)
        .reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
    const base = WEIGHT_STYLES[nearest];
    if (!italic)
        return base;
    return base === "Regular" ? "Italic" : `${base} Italic`;
}
async function getFont(weight, italic) {
    const style = weightToStyle(weight, italic);
    const key = `Poppins/${style}`;
    if (loadedFonts.has(key))
        return { family: "Poppins", style };
    if (!failedFonts.has(key)) {
        try {
            await figma.loadFontAsync({ family: "Poppins", style });
            loadedFonts.add(key);
            return { family: "Poppins", style };
        }
        catch (e) {
            failedFonts.add(key);
            log(`Poppins ${style} not available, falling back to Inter`);
        }
    }
    await figma.loadFontAsync(FALLBACK_FONT);
    return FALLBACK_FONT;
}
function log(text) {
    figma.ui.postMessage({ type: "log", text });
}
function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
        r: parseInt(clean.slice(0, 2), 16) / 255,
        g: parseInt(clean.slice(2, 4), 16) / 255,
        b: parseInt(clean.slice(4, 6), 16) / 255,
    };
}
function solidPaint(c) {
    return {
        type: "SOLID",
        color: { r: c.r, g: c.g, b: c.b },
        opacity: c.a,
    };
}
function gradientPaint(g) {
    // CSS angle: 0deg points up, clockwise. Build a gradient transform.
    const rad = ((g.angle - 90) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const transform = [
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
function dataUrlToBytes(dataUrl) {
    const idx = dataUrl.indexOf("base64,");
    if (idx === -1)
        return null;
    return figma.base64Decode(dataUrl.slice(idx + 7));
}
const imageHashCache = new Map();
function imagePaintFromDataUrl(dataUrl, objectFit) {
    let hash = imageHashCache.get(dataUrl);
    if (!hash) {
        const bytes = dataUrlToBytes(dataUrl);
        if (!bytes)
            return null;
        try {
            hash = figma.createImage(bytes).hash;
        }
        catch (e) {
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
function applyCorners(node, radius) {
    if (!radius)
        return;
    node.topLeftRadius = radius[0] || 0;
    node.topRightRadius = radius[1] || 0;
    node.bottomRightRadius = radius[2] || 0;
    node.bottomLeftRadius = radius[3] || 0;
}
function mapJustify(justify) {
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
function mapAlign(align) {
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
function applyTransformCase(content, transform) {
    if (transform === "uppercase")
        return content.toUpperCase();
    if (transform === "lowercase")
        return content.toLowerCase();
    return content;
}
let builtNodes = 0;
async function yieldEvery(n) {
    builtNodes++;
    if (builtNodes % n === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
}
async function buildText(data) {
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
function buildImage(data) {
    const rect = figma.createRectangle();
    rect.resize(Math.max(1, data.w), Math.max(1, data.h));
    rect.name = data.alt ? `img: ${data.alt.slice(0, 30)}` : data.name || "image";
    applyCorners(rect, data.radius);
    const dataUrl = data.srcData;
    const paint = dataUrl ? imagePaintFromDataUrl(dataUrl, data.objectFit) : null;
    if (paint) {
        rect.fills = [paint];
    }
    else {
        rect.fills = [
            { type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.87 } },
        ];
    }
    return rect;
}
async function buildPlaceholder(data) {
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
function buildSvg(data) {
    if (!data.svg)
        return null;
    let svg = data.svg;
    if (data.color) {
        const rgb = `rgb(${Math.round(data.color.r * 255)},${Math.round(data.color.g * 255)},${Math.round(data.color.b * 255)})`;
        svg = svg.split("currentColor").join(rgb);
    }
    try {
        const node = figma.createNodeFromSvg(svg);
        node.name = data.name || "icon";
        if (data.w > 0 && data.h > 0 && node.width > 0 && node.height > 0) {
            node.resize(data.w, data.h);
        }
        return node;
    }
    catch (e) {
        return null;
    }
}
async function buildNode(data) {
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
async function buildFrame(data) {
    const frame = figma.createFrame();
    frame.resize(Math.max(1, data.w), Math.max(1, data.h));
    frame.name = data.name || "frame";
    frame.clipsContent = !!data.clips;
    if (typeof data.opacity === "number" && data.opacity < 1) {
        frame.opacity = data.opacity;
    }
    const fills = [];
    if (data.bg)
        fills.push(solidPaint(data.bg));
    if (data.gradient)
        fills.push(gradientPaint(data.gradient));
    if (data.bgImageData) {
        const paint = imagePaintFromDataUrl(data.bgImageData);
        if (paint)
            fills.push(paint);
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
        if (!child)
            continue;
        frame.appendChild(child);
        if (useAutoLayout) {
            if ("layoutSizingHorizontal" in child) {
                try {
                    child.layoutSizingHorizontal = "FIXED";
                    child.layoutSizingVertical = "FIXED";
                }
                catch (e) {
                    // some node types don't allow this; ignore
                }
            }
            if (child.type !== "TEXT" && "resize" in child) {
                try {
                    child.resize(Math.max(1, childData.w), Math.max(1, childData.h));
                }
                catch (e) {
                    // ignore
                }
            }
        }
        else {
            child.x = childData.x;
            child.y = childData.y;
        }
    }
    // Re-assert size: auto layout may have grown the frame.
    try {
        frame.resize(Math.max(1, data.w), Math.max(1, data.h));
    }
    catch (e) {
        // ignore
    }
    return frame;
}
async function createColorStyles(tokens) {
    let count = 0;
    const groups = [
        ["Brand", tokens.brand],
        ["Light", tokens.colors.light],
        ["Dark", tokens.colors.dark],
    ];
    const existing = await figma.getLocalPaintStylesAsync();
    const existingNames = new Set(existing.map((s) => s.name));
    for (const [group, colors] of groups) {
        for (const key of Object.keys(colors)) {
            const name = `Latest Talks/${group}/${key}`;
            if (existingNames.has(name))
                continue;
            const style = figma.createPaintStyle();
            style.name = name;
            style.paints = [{ type: "SOLID", color: hexToRgb(colors[key]) }];
            count++;
        }
    }
    return count;
}
async function createTextStyles(tokens) {
    let count = 0;
    const existing = await figma.getLocalTextStylesAsync();
    const existingNames = new Set(existing.map((s) => s.name));
    for (const t of tokens.typography) {
        const name = `Latest Talks/${t.name}`;
        if (existingNames.has(name))
            continue;
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
async function buildPage(capture) {
    const page = figma.createPage();
    page.name = capture.name;
    await figma.setCurrentPageAsync(page);
    let x = 0;
    const variants = [
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
figma.ui.onmessage = async (msg) => {
    try {
        if (msg.type === "start") {
            await figma.loadFontAsync(FALLBACK_FONT);
            if (msg.tokens) {
                const colorCount = await createColorStyles(msg.tokens);
                const textCount = await createTextStyles(msg.tokens);
                log(`Created ${colorCount} color styles and ${textCount} text styles.`);
            }
            figma.ui.postMessage({ type: "next-page" });
        }
        else if (msg.type === "page" && msg.page) {
            log(`Building page: ${msg.page.name}...`);
            await buildPage(msg.page);
            figma.ui.postMessage({ type: "next-page" });
        }
        else if (msg.type === "finish") {
            log("Import complete.");
            figma.notify("Latest Talks import complete");
            figma.ui.postMessage({ type: "done" });
        }
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        log(`ERROR: ${message}`);
        figma.ui.postMessage({ type: "next-page" });
    }
};
