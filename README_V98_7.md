# NOVATEK V98,7 — Search cleanup + true fullscreen product transition

## Changes
- Removed the compass button from the global search bar.
- Kept one search bar only: the global header search.
- Removed the duplicate search input from `/search` results.
- Search results now show a compact query summary instead of another search form.
- The header search syncs with the current `/search?q=...` query.
- Product opening transition now renders through a portal directly under `document.body`, preventing transformed product cards from clipping a fixed overlay.
- Product image transition now expands all the way to `100vw × 100dvh` before navigation.
- Increased transition duration slightly so the fullscreen movement is visible on mobile.
- Laptop and PlayStation product cards use the same transition behavior.

## Note
The source project uses Next.js 16.3.4 and React 19.2.8. A full dependency install/build could not be completed in the packaging environment because `npm ci` timed out, so Vercel remains the final build check.
