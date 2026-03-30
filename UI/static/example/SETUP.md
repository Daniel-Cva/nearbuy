# India PMTiles Map — Implementation Guide

Complete step-by-step guide to implement a self-hosted India map using **PMTiles + MapLibre GL JS + Protomaps themes**. No Google Maps, no Mapbox, no API keys. Fully free and open-source.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Dependencies & CDN Links](#2-dependencies--cdn-links)
3. [PMTiles Tile Source Setup](#3-pmtiles-tile-source-setup)
4. [Initialize the Map](#4-initialize-the-map)
5. [Reverse Geocoding (Lat/Lng → Address)](#5-reverse-geocoding-latlng--address)
6. [Forward Geocoding (Search → Location)](#6-forward-geocoding-search--location)
7. [Get User's Live GPS Location](#7-get-users-live-gps-location)
8. [Place Markers on Map](#8-place-markers-on-map)
9. [Custom Markers (HTML Elements)](#9-custom-markers-html-elements)
10. [Draggable Markers](#10-draggable-markers)
11. [Popups on Markers](#11-popups-on-markers)
12. [Live Location Tracking (watchPosition)](#12-live-location-tracking-watchposition)
13. [Map Click Events](#13-map-click-events)
14. [Map Controls (Zoom, Scale)](#14-map-controls-zoom-scale)
15. [Persist Data with localStorage](#15-persist-data-with-localstorage)
16. [Available Map Themes](#16-available-map-themes)
17. [NPM / Bundler Setup (Vite, Webpack, etc.)](#17-npm--bundler-setup-vite-webpack-etc)
18. [Hosting Your Own PMTiles](#18-hosting-your-own-pmtiles)
19. [Gotchas & Troubleshooting](#19-gotchas--troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────┐     HTTP Range Requests     ┌──────────────────────┐
│  Browser     │ ◄──────────────────────────► │  Cloudflare R2       │
│  (MapLibre)  │                              │  (PMTiles hosted)   │
└──────┬───────┘                              └──────────────────────┘
       │
       │  pmtiles.js registers a custom protocol
       │  so MapLibre can read .pmtiles directly
       │
       ▼
┌──────────────┐
│ protomaps-   │  Provides ready-made map layer styles
│ themes-base  │  (roads, buildings, water, labels, etc.)
└──────────────┘
```

**How it works:**

- **PMTiles** is a single-file archive format for map tiles. Instead of millions of individual tile files, everything is in one `.pmtiles` file hosted on any static file server (Cloudflare R2, S3, Vercel, etc.).
- **MapLibre GL JS** is the open-source map renderer (fork of Mapbox GL JS).
- **pmtiles.js** registers a custom `pmtiles://` protocol handler so MapLibre can fetch tile data from the `.pmtiles` file using HTTP range requests.
- **protomaps-themes-base** provides pre-built layer styles (roads, buildings, labels, water, etc.) so you don't have to write hundreds of style layers manually.

---

## 2. Dependencies & CDN Links

### Via CDN (HTML `<script>` tags)

```html
<!-- MapLibre GL JS (map renderer) -->
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" />
<script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>

<!-- PMTiles protocol handler -->
<script src="https://unpkg.com/pmtiles@3/dist/pmtiles.js"></script>

<!-- Protomaps base theme (map layer styles) -->
<script src="https://unpkg.com/protomaps-themes-base@4/dist/protomaps-themes-base.js"></script>
```

### Via NPM (for bundlers)

```bash
npm install maplibre-gl pmtiles protomaps-themes-base
```

```js
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import layers from "protomaps-themes-base";
```

---

## 3. PMTiles Tile Source Setup

### The PMTiles URL

```
https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles
```

This is a Protomaps daily build of India, hosted on Cloudflare R2. Replace with your own URL if self-hosting.

### Register the PMTiles protocol

This **must** run before creating the map:

```js
// CDN usage (global variable)
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// NPM usage
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);
```

### Generate map layers from the theme

```js
// CDN: the global variable is `protomaps_themes_base`
const layers = protomaps_themes_base.default("protomaps", "light");

// NPM import
import layersFn from "protomaps-themes-base";
const layers = layersFn("protomaps", "light");
```

**Parameters:**
- `"protomaps"` — the source name (must match the key in `sources` below)
- `"light"` — the theme name (see [Section 16](#16-available-map-themes))

---

## 4. Initialize the Map

```js
const PMTILES_URL = "https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles";

const map = new maplibregl.Map({
  container: "map",                // ID of the HTML element
  style: {
    version: 8,
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
    sources: {
      protomaps: {                 // source name — must match the first arg in layers()
        type: "vector",
        url: `pmtiles://${PMTILES_URL}`,
        attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    },
    layers: layers                 // from protomaps_themes_base.default()
  },
  center: [78.9629, 20.5937],     // India center [lng, lat]
  zoom: 5,
  maxBounds: [[60, 5], [100, 40]] // restrict to India region
});
```

**Minimum HTML needed:**

```html
<div id="map" style="width: 100%; height: 100vh;"></div>
```

**Important:** The `glyphs` and `sprite` URLs are required for labels and icons to render. These are free assets from Protomaps.

---

## 5. Reverse Geocoding (Lat/Lng → Address)

Convert coordinates to human-readable address using **Nominatim** (free, by OpenStreetMap):

```js
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  const addr = data.address || {};

  return {
    lat: lat,
    lng: lng,
    pincode: addr.postcode || null,
    city: addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || null,
    district: addr.county || addr.state_district || null,
    state: addr.state || null,
    country: addr.country || null,
    fullAddress: data.display_name || null
  };
}
```

**Nominatim Usage Policy:**
- Max 1 request/second
- Set a custom `User-Agent` header in production
- For heavy usage, self-host Nominatim or use a paid geocoding API
- Docs: https://nominatim.org/release-docs/latest/api/Reverse/

---

## 6. Forward Geocoding (Search → Location)

Search for places by name:

```js
async function searchLocation(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=5&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const results = await res.json();

  return results.map(r => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    type: r.type,
    address: r.address
  }));
}

// Usage: fly to a search result
const results = await searchLocation("Mumbai");
if (results.length > 0) {
  map.flyTo({ center: [results[0].lng, results[0].lat], zoom: 14 });
}
```

---

## 7. Get User's Live GPS Location

**One-time location:**

```js
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    map.flyTo({ center: [longitude, latitude], zoom: 15 });
  },
  (err) => console.error("Location error:", err.message),
  { enableHighAccuracy: true }
);
```

**Continuous tracking:**

```js
const watchId = navigator.geolocation.watchPosition(
  (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    // Update marker position, UI, etc.
  },
  (err) => console.error(err),
  { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
);

// To stop tracking:
navigator.geolocation.clearWatch(watchId);
```

**Requirements:**
- HTTPS or localhost (geolocation is blocked on plain HTTP)
- User must grant permission in the browser

---

## 8. Place Markers on Map

**Basic marker:**

```js
const marker = new maplibregl.Marker({ color: "#e11d48" })
  .setLngLat([78.9629, 20.5937])   // [lng, lat] — NOT [lat, lng]
  .addTo(map);
```

**Remove a marker:**

```js
marker.remove();
```

**Move a marker:**

```js
marker.setLngLat([newLng, newLat]);
```

> **IMPORTANT:** MapLibre uses `[longitude, latitude]` order everywhere. This is the opposite of what most geocoding APIs return (`lat, lng`).

---

## 9. Custom Markers (HTML Elements)

Use any HTML/CSS as a marker:

```js
const el = document.createElement("div");
el.style.cssText = `
  width: 32px; height: 32px; border-radius: 50%;
  background: #4f46e5; border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: white; font-weight: bold;
`;
el.textContent = "A";

const marker = new maplibregl.Marker({ element: el })
  .setLngLat([77.209, 28.6139])
  .addTo(map);
```

**Pulsing dot (for live location):**

```css
.pulse-dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 3px white, 0 0 8px rgba(59,130,246,0.5);
  position: relative;
}
.pulse-dot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  animation: pulse-ring 1.5s ease-out infinite;
}
@keyframes pulse-ring {
  0%   { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}
```

```js
const el = document.createElement("div");
el.className = "pulse-dot";
const marker = new maplibregl.Marker({ element: el })
  .setLngLat([lng, lat])
  .addTo(map);
```

---

## 10. Draggable Markers

```js
const marker = new maplibregl.Marker({ draggable: true })
  .setLngLat([77.209, 28.6139])
  .addTo(map);

marker.on("dragend", () => {
  const { lng, lat } = marker.getLngLat();
  console.log("New position:", lat, lng);
});
```

---

## 11. Popups on Markers

**Attach popup to a marker:**

```js
const popup = new maplibregl.Popup({ offset: 20, maxWidth: "300px" })
  .setHTML("<h3>Business Name</h3><p>Some description</p>");

const marker = new maplibregl.Marker()
  .setLngLat([77.209, 28.6139])
  .setPopup(popup)
  .addTo(map);
```

**Standalone popup (no marker):**

```js
new maplibregl.Popup()
  .setLngLat([77.209, 28.6139])
  .setHTML("<p>Hello from Delhi</p>")
  .addTo(map);
```

**Toggle popup programmatically:**

```js
marker.togglePopup();
```

**Update popup content:**

```js
marker.setPopup(
  new maplibregl.Popup({ offset: 20 }).setHTML("<b>Updated content</b>")
);
```

---

## 12. Live Location Tracking (watchPosition)

Full implementation pattern for tracking + displaying a user's live location:

```js
let watchId = null;
let myMarker = null;

function startTracking() {
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;

      if (!myMarker) {
        // First position — create marker and fly to it
        const el = document.createElement("div");
        el.className = "pulse-dot";
        myMarker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
        map.flyTo({ center: [lng, lat], zoom: 15 });
      } else {
        // Update position
        myMarker.setLngLat([lng, lat]);
      }
    },
    (err) => alert("Location error: " + err.message),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
```

---

## 13. Map Click Events

**Click to get coordinates:**

```js
map.on("click", (e) => {
  const { lng, lat } = e.lngLat;
  console.log(`Clicked: ${lat}, ${lng}`);

  // Place a marker at click location
  new maplibregl.Marker()
    .setLngLat([lng, lat])
    .addTo(map);
});
```

**Change cursor on hover:**

```js
map.getCanvas().style.cursor = "crosshair";  // set
map.getCanvas().style.cursor = "";            // reset
```

---

## 14. Map Controls (Zoom, Scale)

```js
// Zoom in/out buttons + compass
map.addControl(new maplibregl.NavigationControl(), "top-right");

// Scale bar
map.addControl(new maplibregl.ScaleControl(), "bottom-right");

// Fullscreen toggle
map.addControl(new maplibregl.FullscreenControl(), "top-right");

// Geolocate button (built-in GPS button)
map.addControl(new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
}), "top-right");
```

---

## 15. Persist Data with localStorage

Save and load any map data (landmarks, user positions, etc.):

```js
// Save
function saveLandmarks(landmarks) {
  localStorage.setItem("landmarks", JSON.stringify(landmarks));
}

// Load
function loadLandmarks() {
  return JSON.parse(localStorage.getItem("landmarks") || "[]");
}

// Restore markers on page load
map.on("load", () => {
  const landmarks = loadLandmarks();
  landmarks.forEach(l => {
    new maplibregl.Marker()
      .setLngLat([l.lng, l.lat])
      .setPopup(new maplibregl.Popup().setHTML(`<b>${l.name}</b>`))
      .addTo(map);
  });
});
```

**Note:** localStorage has a ~5MB limit. If storing images as base64 data URLs, it fills up fast. For production, use IndexedDB or a backend.

---

## 16. Available Map Themes

The second argument to `protomaps_themes_base.default()` controls the theme:

| Theme        | Usage                                                        |
|------------- |--------------------------------------------------------------|
| `"light"`    | Default light theme with colors                              |
| `"dark"`     | Dark mode theme                                              |
| `"white"`    | Minimal white/gray theme                                     |
| `"grayscale"`| Grayscale theme                                              |
| `"black"`    | Deep black theme                                             |
| `"contrast"` | High-contrast theme                                          |

```js
// Dark mode example
const layers = protomaps_themes_base.default("protomaps", "dark");
```

When changing theme, also update the `sprite` URL to match:

```
https://protomaps.github.io/basemaps-assets/sprites/v4/light
https://protomaps.github.io/basemaps-assets/sprites/v4/dark
```

---

## 17. NPM / Bundler Setup (Vite, Webpack, etc.)

```bash
npm install maplibre-gl pmtiles protomaps-themes-base
```

```js
// main.js
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import layers from "protomaps-themes-base";

const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${PMTILES_URL}`,
        attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    },
    layers: layers("protomaps", "light")
  },
  center: [78.9629, 20.5937],
  zoom: 5
});
```

### Svelte (SvelteKit)

```bash
npm create svelte@latest my-map-app
cd my-map-app
npm install
npm install maplibre-gl pmtiles protomaps-themes-base
```

**`src/lib/Map.svelte`** — Reusable map component:

```svelte
<script>
  import { onMount, onDestroy } from "svelte";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { Protocol } from "pmtiles";
  import layers from "protomaps-themes-base";

  /** @type {string} */
  export let pmtilesUrl = "https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles";

  /** @type {"light"|"dark"|"white"|"grayscale"|"black"|"contrast"} */
  export let theme = "light";

  /** @type {maplibregl.Map|null} */
  export let map = null;

  let container;

  onMount(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${theme}`,
        sources: {
          protomaps: {
            type: "vector",
            url: `pmtiles://${pmtilesUrl}`,
            attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
          }
        },
        layers: layers("protomaps", theme)
      },
      center: [78.9629, 20.5937],
      zoom: 5,
      maxBounds: [[60, 5], [100, 40]]
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
  });

  onDestroy(() => {
    if (map) map.remove();
  });
</script>

<div bind:this={container} class="map-container">
  <slot />
</div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
  }
</style>
```

**`src/routes/+page.svelte`** — Use the component:

```svelte
<script>
  import Map from "$lib/Map.svelte";
  import maplibregl from "maplibre-gl";

  let map;

  function handleClick() {
    if (!map) return;
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      new maplibregl.Marker({ color: "#e11d48" })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<b>${lat.toFixed(5)}, ${lng.toFixed(5)}</b>`))
        .addTo(map);
    });
  }
</script>

<div style="height: 100vh;">
  <Map bind:map theme="light" on:mount={handleClick} />
</div>
```

**`src/routes/+layout.svelte`** (if using SvelteKit, prevent SSR for the map):

```svelte
<script>
  import { browser } from "$app/environment";
</script>

{#if browser}
  <slot />
{:else}
  <p>Loading map...</p>
{/if}
```

> **Note:** MapLibre needs the DOM, so it must only run in the browser. Use `onMount` (which only runs client-side) or guard with `browser` check in SvelteKit.

#### Svelte 5 (Runes syntax)

If using Svelte 5 with runes, the component looks like:

```svelte
<script>
  import { onMount } from "svelte";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { Protocol } from "pmtiles";
  import layers from "protomaps-themes-base";

  let { pmtilesUrl = "https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles", theme = "light" } = $props();
  let container = $state(null);
  let map = $state(null);

  onMount(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${theme}`,
        sources: {
          protomaps: {
            type: "vector",
            url: `pmtiles://${pmtilesUrl}`
          }
        },
        layers: layers("protomaps", theme)
      },
      center: [78.9629, 20.5937],
      zoom: 5
    });

    return () => map?.remove();
  });
</script>

<div bind:this={container} style="width:100%;height:100%;"></div>
```
```

---

## 18. Hosting Your Own PMTiles

### Option A: Cloudflare R2 (recommended, free tier)

1. Create a Cloudflare R2 bucket
2. Upload your `.pmtiles` file
3. Enable **public access** on the bucket (Settings → Public access → Allow)  
4. Your URL will be: `https://<account-hash>.r2.dev/<filename>.pmtiles`
5. Ensure CORS is configured to allow `Range` requests:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Content-Range", "Content-Length"],
    "MaxAgeSeconds": 86400
  }
]
```

### Option B: AWS S3 / Any static host

Same concept — upload the file and configure CORS for `Range` header.

### Option C: Self-hosted with nginx

```nginx
location /tiles/ {
    root /var/www;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Headers Range;
    add_header Access-Control-Expose-Headers Content-Range,Content-Length;
}
```

### Getting PMTiles files

- **Protomaps daily builds:** https://maps.protomaps.com/builds/ (free, updated daily)
- **Generate custom extracts:** Use `pmtiles extract` CLI tool to cut a region from a larger file
- **From OpenStreetMap:** Use `tilemaker` or `planetiler` to generate from .osm.pbf

---

## 19. Gotchas & Troubleshooting

### Map is blank / not loading

| Problem | Fix |
|---------|-----|
| `protomapsL is not defined` | The global variable is `protomaps_themes_base`, NOT `protomapsL` |
| Map container has 0 height | Ensure the map `<div>` has explicit height (`height: 100vh` or parent flex) |
| CORS errors in console | PMTiles host must allow `Range` header in CORS config |
| Tiles not loading on `file://` | Serve via HTTP (even `npx serve` works). PMTiles needs HTTP range requests |
| Labels/icons missing | You're missing `glyphs` and/or `sprite` in the style object |

### Common mistakes

- **Coordinate order:** MapLibre uses `[lng, lat]`. Nominatim returns `lat, lon`. Don't mix them up.
- **Source name mismatch:** The first argument to `protomaps_themes_base.default("sourceName", "theme")` must exactly match the key in `sources: { sourceName: { ... } }`.
- **Protocol registration timing:** `maplibregl.addProtocol("pmtiles", ...)` must happen BEFORE `new maplibregl.Map()`.

### Version compatibility (as of March 2026)

| Library | Version | Global variable (CDN) |
|---------|---------|----------------------|
| MapLibre GL JS | `4.x` | `maplibregl` |
| PMTiles | `3.x` | `pmtiles` |
| Protomaps Themes Base | `4.x` | `protomaps_themes_base` |

### Quick test: minimal working example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script>
  <script src="https://unpkg.com/pmtiles@3/dist/pmtiles.js"></script>
  <script src="https://unpkg.com/protomaps-themes-base@4/dist/protomaps-themes-base.js"></script>
</head>
<body>
  <div id="map" style="width:100%;height:100vh;"></div>
  <script>
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles://https://pub-4b0a973598864d559db309cfe2c3e16a.r2.dev/india_daily_20260306.pmtiles"
          }
        },
        layers: protomaps_themes_base.default("protomaps", "light")
      },
      center: [78.9629, 20.5937],
      zoom: 5
    });
  </script>
</body>
</html>
```

---

## Summary: Copy-paste checklist

```
1. Add 3 script/link tags (MapLibre CSS + JS, PMTiles JS, Protomaps theme JS)
2. Create a <div id="map"> with explicit height
3. Register PMTiles protocol: maplibregl.addProtocol("pmtiles", new pmtiles.Protocol().tile)
4. Generate layers: protomaps_themes_base.default("protomaps", "light")
5. Create map with style object containing: version, glyphs, sprite, sources, layers
6. Source URL format: "pmtiles://https://your-host.com/your-file.pmtiles"
7. Use Nominatim for geocoding (free, 1 req/sec limit)
8. Serve over HTTP/HTTPS (not file://)
```
