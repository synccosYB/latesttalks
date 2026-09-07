# Latest Talks — Figma Import Package

This package rebuilds the Latest Talks website as a native, fully editable Figma file.
It contains a small Figma plugin plus the captured design data of the live website.

Nothing here is a screenshot — the plugin creates real Figma frames, Auto Layout,
text layers, images, and color/text styles that you can edit like any other design.

## What's inside

```
figma-plugin/   The plugin you load into Figma (manifest.json, code.js, ui.html)
data/           The captured website data
  tokens.json          Brand colors (light + dark) and Poppins typography scale
  pages/*.json         15 public pages, each captured at desktop (1440px) and mobile (390px)
```

Pages included: Home, Podcast, Episode Detail, Guests, Guest Profile, Hosts,
Sponsors, Sponsor Detail, Advertise, Community, Latest Talks+, Support Us,
Gift, Contact, and Guest Application.

## How to run it (about 5 minutes)

You need the **Figma desktop app** (free) — plugins in development mode don't run
in the browser version.

1. **Unzip this package** somewhere easy to find (e.g. your Desktop).
2. Open the Figma desktop app and create a **new empty design file**.
3. In the menu, go to: **Plugins → Development → Import plugin from manifest…**
4. Pick the file `figma-plugin/manifest.json` from the unzipped folder.
5. Run the plugin: **Plugins → Development → Latest Talks Website Importer**.
6. In the plugin window, click the dashed box and select **all the JSON files**
   from the `data` folder **and** the `data/pages` folder
   (tokens.json + all 16 files inside data/pages — you can select them all at once).
7. Click **Build in Figma** and wait. The plugin builds one Figma page per website
   page — the whole import takes a few minutes. Progress is shown in the plugin window.

## What you get

- One Figma page per website page, each with a **Desktop 1440** and a **Mobile 390** frame.
- Editable layers: Auto Layout frames matching the site's flexbox structure,
  real text layers in Poppins, images, and rounded rectangles.
- **Color styles** under "Latest Talks / Brand / Light / Dark" — the full brand
  palette including Navy `#10213A`, Red `#DE2026`, and Cream `#F0EDEB`.
- **Text styles** under "Latest Talks /" — the Poppins typography scale
  (Display/Hero down to Caption).

## Good to know

- The Poppins font is available in Figma's built-in Google Fonts library, so it
  loads automatically. If a weight is missing, the plugin falls back to Inter.
- Video embeds (YouTube) appear as dark placeholder frames labeled "Video Embed" —
  Figma can't embed videos.
- This is a one-time snapshot of the site. If the website changes, a fresh capture
  can be generated and re-imported the same way.
- If you run the plugin twice in the same file, it will add the pages again
  (styles are not duplicated). Use a fresh file for a clean import.

## Troubleshooting

- **"Import plugin from manifest" is grayed out** — you're in the browser version
  of Figma. Download the desktop app from figma.com/downloads.
- **The plugin window says "Skipped …"** for a file — that's fine; it just means
  the file wasn't needed (e.g. index.json).
- **Import feels slow** — normal. Pages like Home and Podcast contain hundreds of
  layers each. Leave the plugin window open until it says "All done!".
