# Monastery360 (PWA)

Immersive cultural-heritage platform to explore Sikkim monasteries with 360° tours, interactive map, audio guides, cultural calendar, and an AI chatbot.

## Features
- 360° viewer (embeds external panorama links)
- Leaflet + OpenStreetMap map with sect and district filters
- Monastery profiles from static JSON
- Web Speech API multilingual audio narration
- Cultural calendar from static JSON
- OpenAI-powered chatbot (client-side)
- PWA: installable, offline cache via service worker

## Quick Start
1. Serve the folder over HTTP (required for Service Worker and fetch).
   - Node: `npx http-server -p 5173` or `npx serve -l 5173`
   - Python: `python3 -m http.server 5173`
2. Open `http://localhost:5173/` in your browser.
3. (Optional) Click Settings and paste your OpenAI API key to enable the chatbot.

## Data
- `data/monasteries.json` – Monastery entries with coordinates, sect, district, descriptions, and optional `viewerUrl` for 360.
- `data/events.json` – Cultural events with ISO dates and `monasteryId` references.

## OpenAI Chatbot
- The API key is stored in `localStorage` under `openai_api_key`.
- Uses `gpt-4o-mini` by default; adjust in `app.js` if needed.

## PWA
- `manifest.json` and `sw.js` included. On first load, the app caches core assets for basic offline support.

## Icons
- Add PNG icons at `assets/icons/icon-192.png` and `assets/icons/icon-512.png`.

## Notes
- The Web Speech API voice list depends on the OS/browser.
- External 360° providers must allow embedding (CORS/frame-ancestors policies apply).
