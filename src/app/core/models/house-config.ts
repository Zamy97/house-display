export type ModuleId =
  | 'clock'
  | 'prayer'
  | 'calendar'
  | 'weather'
  | 'hijri'
  | 'dua'
  | 'hadith'
  | 'ayah'
  | 'worldClocks'
  | 'wifi';

export type DisplayLayout = 'mirror' | 'columns';

export type HouseModules = Record<ModuleId, boolean>;

export type WorldClock = {
  title: string;
  timezone: string;
  flag?: string;
};

export type HouseConfig = {
  houseName: string;
  locale: string;
  timeFormat: 12 | 24;
  layout: DisplayLayout;
  coords: { lat: number; lon: number };
  timezone: string;
  prayerMethod: 'ISNA' | 'MWL' | 'Egypt' | 'Makkah' | 'Karachi';
  asr: 'Standard' | 'Hanafi';
  prayerShowSunrise: boolean;
  openWeatherApiKey: string;
  weatherUnits: 'imperial' | 'metric';
  weatherMaxHourlies: number;
  weatherMaxDailies: number;
  weatherEffects: boolean;
  wifi: { ssid: string; password: string; showPassword: boolean };
  worldClocks: WorldClock[];
  modules: HouseModules;
  content: {
    duaLanguage: 'en' | 'bn';
    ayahIntervalMs: number;
    hadithRotation: 'daily' | 'random';
  };
};

export const DEFAULT_HOUSE_CONFIG: HouseConfig = {
  houseName: 'Home',
  locale: 'en-US',
  timeFormat: 12,
  layout: 'mirror',
  coords: { lat: 42.4710579, lon: -83.0133362 },
  timezone: 'America/Detroit',
  prayerMethod: 'ISNA',
  asr: 'Hanafi',
  prayerShowSunrise: false,
  openWeatherApiKey: '',
  weatherUnits: 'imperial',
  weatherMaxHourlies: 2,
  weatherMaxDailies: 6,
  weatherEffects: true,
  wifi: { ssid: '', password: '', showPassword: false },
  worldClocks: [
    { title: 'LONDON', timezone: 'Europe/London', flag: 'gb' },
    { title: 'DHAKA', timezone: 'Asia/Dhaka', flag: 'bd' },
    { title: 'MAKKAH', timezone: 'Asia/Riyadh', flag: 'sa' },
    { title: 'GAZA', timezone: 'Asia/Gaza', flag: 'ps' },
  ],
  modules: {
    clock: true,
    prayer: true,
    calendar: true,
    weather: true,
    hijri: true,
    dua: true,
    hadith: true,
    ayah: true,
    worldClocks: true,
    wifi: true,
  },
  content: {
    duaLanguage: 'bn',
    ayahIntervalMs: 300000,
    hadithRotation: 'daily',
  },
};

export const MODULE_LABELS: Record<ModuleId, string> = {
  clock: 'Clock',
  prayer: 'Prayer times',
  calendar: 'Monthly calendar',
  weather: 'Weather',
  hijri: 'Islamic date',
  dua: 'Daily dua',
  hadith: 'Daily hadith',
  ayah: 'Quran ayah',
  worldClocks: 'World clocks',
  wifi: 'Wi‑Fi QR',
};

export const LAYOUT_LABELS: Record<DisplayLayout, string> = {
  mirror: 'MagicMirror (left modules, right weather, bottom content)',
  columns: 'Three columns (content in center)',
};
