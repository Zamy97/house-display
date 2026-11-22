# House Display

Angular kiosk dashboard for home Raspberry Pis — prayer times, dua, hadith, Quran ayah, weather, clocks, and more.

Built to replace MagicMirror module churn with an app we fully control. Users can toggle modules and configure the house from **Settings**.

## Features

- Fullscreen mirror-style display (same visual language as our MagicMirror theme)
- **Settings page** (`/settings`) — show/hide modules, lat/lon, prayer method, Wi‑Fi, OpenWeather key
- Config saved in `localStorage` (export/import JSON)
- Offline content: duas, hadith sample, full Quran ayahs
- Local prayer calculation (PrayTimes / ISNA + Hanafi)
- Optional OpenWeather current conditions

## Develop

```bash
cd house-display
npm start
```

Open http://localhost:4200 — gear icon opens Settings.

## Production build

```bash
npm run build
```

Output: `dist/house-display/browser/`

Serve with any static server, e.g.:

```bash
npx serve -s dist/house-display/browser -l 8080
```

## Deploy to Vercel

Repo includes `vercel.json` (build + SPA rewrites).

```bash
npx vercel
# production:
npx vercel --prod
```

Or import `Zamy97/house-display` in the Vercel dashboard (defaults from `vercel.json`).

After deploy, open the URL → **Settings** (gear) to configure the house. Config is stored in that browser’s `localStorage`.

## Raspberry Pi kiosk

Full steps: **[PI-SETUP.md](./PI-SETUP.md)**. The Pi opens [house-display.vercel.app](https://house-display.vercel.app) full screen on desktop login. Wi-Fi stays on.

```bash
cd ~/house-display
chmod +x scripts/pi-kiosk/*.sh
./scripts/pi-kiosk/install.sh
```

## Module toggles

| Module | What it shows |
|--------|----------------|
| clock | Local time + date |
| prayer | Today’s salah times |
| weather | OpenWeather (needs API key) |
| hijri | Islamic date |
| dua | Morning/evening dua from local JSON |
| hadith | Daily/random hadith |
| ayah | Rotating Quran ayah |
| worldClocks | Configurable timezones |
| wifi | SSID (+ optional password) |

## Related

- Playbook / house configs: [magicmirror-house-setup](https://github.com/Zamy97/magicmirror-house-setup)
- Content sources: MMM-DailyDua, MMM-DailyHadith, MMM-QuranAyah
