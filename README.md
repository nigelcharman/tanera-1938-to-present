# Tanera Park — 1938 Field Map

Mobile-friendly Leaflet map centered on Tanera Park, Wellington. Overlays [Map Warper map 114001](https://mapwarper.net/maps/114001) (1938 Retrolens/LINZ aerial) on OpenStreetMap or Esri World Imagery.

## Run locally

```bash
npm install
npm run dev
```

Dev server binds `0.0.0.0:4321` → [http://127.0.0.1:4321](http://127.0.0.1:4321)

```bash
npm run build
npm run preview
```

## Phone GPS (HTTPS)

Browsers only expose geolocation in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or `localhost`). On a real phone, deploy static files to HTTPS:

### GitHub Pages

1. `npm run build`
2. Publish the `dist/` folder (Settings → Pages → Deploy from a branch/folder, or use `gh-pages`).
3. Open the `https://…github.io/…` URL and tap **Locate**.

### Netlify

`netlify.toml` sets build → `dist` and an SPA fallback.

**Git connect:** Base directory blank (repo root) · Build command `npm run build` · Publish directory `dist`

**Drag-and-drop:** `npm run build`, then drop the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

Open the Netlify `https://…` URL and tap **Locate**.

Local LAN HTTP (`http://192.168.x.x:4321`) will show the map but **GPS will be blocked** on most mobile browsers.

## Features

- Basemap toggle: OpenStreetMap / Esri World Imagery
- 1938 Map Warper overlay with opacity slider (default 60%)
- Locate: requests permission on tap, shows position + accuracy circle, follow/recenter
- About page (`/about`): how to use, how it was built, licensing
- Attribution: Retrolens/LINZ CC BY-3.0, Map Warper, OSM / Esri

## Tiles

Path (unchanged):

```
https://mapwarper.net/maps/tile/114001/{z}/{x}/{y}.png
```

The app appends `?v=<WARPER_TILE_VERSION>` so browsers drop stale tiles after a re-warp. After warping again on Map Warper, bump `WARPER_TILE_VERSION` in `src/main.js` to the map’s `updated_at` (see https://mapwarper.net/api/v1/maps/114001.json).

Leaflet loads tiles as images (no CORS required for display).
