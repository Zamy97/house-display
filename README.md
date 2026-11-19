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

1. Build (on Mac or Pi): `npm run build`
2. Copy `dist/house-display/browser` to the Pi (e.g. `~/house-display`)
3. Serve + Chromium:

```bash
# simple static server
npx --yes serve -s ~/house-display -l 8080 &

# labwc autostart
# wlr-randr ...
# chromium --kiosk --incognito --noerrdialogs http://localhost:8080 &
```

Prefer waiting until the port is up before launching Chromium (same pattern as our old kiosk wait script).

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
