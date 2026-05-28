# Boxart Generator

Search SteamGridDB and GOG for game cover art and composite the result onto a 3D Steam case template. Download as PNG.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and paste your SteamGridDB API key
# Get one at https://www.steamgriddb.com/profile/preferences/api
```

## Run

```bash
npm run dev
```

- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:5174

The Vite dev server proxies `/api/*` to the Express server.

## Files

- `server.js` — Express backend. Endpoints: `/api/search/steamgrid`, `/api/search/gog`, `/api/proxy`.
- `src/lib/composite.js` — Loads the template, composites the chosen cover behind it, exports PNG. Supports both rectangular and 4-point perspective targets.
- `public/steam-boxart.png` — Steam case template. The front face is at x=44..544, y=129..849.
