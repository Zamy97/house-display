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

/** Where a module stacks on the mirror. */
export type ModuleRegion = 'left' | 'right' | 'bottom';

export type DisplayLayout = 'mirror' | 'columns';
/** auto = follow screen; vertical/horizontal = locked choice */
export type DisplayOrientation = 'auto' | 'vertical' | 'horizontal';

export type HouseModules = Record<ModuleId, boolean>;

export const ALL_MODULE_IDS: ModuleId[] = [
  'clock',
  'prayer',
  'calendar',
  'weather',
  'hijri',
  'dua',
  'hadith',
  'ayah',
  'worldClocks',
  'wifi',
];

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
  orientation: DisplayOrientation;
  /** Overall UI scale for TV viewing distance (1 = Example CSS, ~1.55 for 43"). */
  displayScale: number;
  /** Per-module size multiplier (1 = normal). Lets each house tune each widget. */
  moduleScales: Record<ModuleId, number>;
  /** Which column/band each module stacks in. */
  moduleRegions: Record<ModuleId, ModuleRegion>;
  /** Sort order within a region (lower = higher up). */
  moduleOrder: Record<ModuleId, number>;
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
    /** Size of the date, dua, hadith, and ayah. 1 is the normal size. */
    textScale: number;
  };
};

export const DEFAULT_HOUSE_CONFIG: HouseConfig = {
  houseName: 'Home',
  locale: 'en-US',
  timeFormat: 12,
  layout: 'mirror',
  orientation: 'vertical',
  displayScale: 1.4,
  moduleScales: {
    clock: 1,
    prayer: 1,
    calendar: 1,
    weather: 1,
    hijri: 1,
    dua: 1,
    hadith: 1,
    ayah: 1,
    worldClocks: 1,
    wifi: 1,
  },
  moduleRegions: {
    clock: 'left',
    prayer: 'left',
    calendar: 'left',
    worldClocks: 'left',
    wifi: 'left',
    weather: 'right',
    hijri: 'bottom',
    dua: 'bottom',
    hadith: 'bottom',
    ayah: 'bottom',
  },
  moduleOrder: {
    clock: 10,
    prayer: 20,
    calendar: 30,
    worldClocks: 40,
    wifi: 50,
    weather: 10,
    hijri: 5,
    dua: 10,
    hadith: 20,
    ayah: 30,
  },
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
    { title: 'MACCA', timezone: 'Asia/Riyadh', flag: 'sa' },
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
    textScale: 1,
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

export const ORIENTATION_LABELS: Record<DisplayOrientation, string> = {
  vertical: 'Vertical (default)',
  horizontal: 'Horizontal',
  auto: 'Auto (follow screen)',
};

export const DISPLAY_SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 1.0, label: 'Compact' },
  { value: 1.2, label: 'Comfortable' },
  { value: 1.4, label: 'TV (default)' },
  { value: 1.6, label: 'Large TV' },
  { value: 1.8, label: 'Extra large' },
];

export const TEXT_SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'A bit bigger' },
  { value: 1.3, label: 'Bigger' },
];

export const MODULE_SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.8, label: 'Smaller' },
  { value: 0.9, label: 'Small' },
  { value: 1.0, label: 'Normal' },
  { value: 1.15, label: 'Big' },
  { value: 1.3, label: 'Bigger' },
  { value: 1.5, label: 'Huge' },
];

export const MODULE_REGION_LABELS: Record<ModuleRegion, string> = {
  left: 'Left',
  bottom: 'Middle',
  right: 'Right',
};

export const MODULE_REGION_OPTIONS = Object.keys(
  MODULE_REGION_LABELS
) as ModuleRegion[];
