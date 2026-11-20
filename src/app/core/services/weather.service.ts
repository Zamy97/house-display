import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { HouseConfig } from '../models/house-config';

export type WeatherEffect = 'none' | 'rain' | 'snow' | 'clouds' | 'storm';

export type HourlyForecast = {
  time: string;
  temp: number;
  icon: string;
  description: string;
};

export type DailyForecast = {
  day: string;
  high: number;
  low: number;
  icon: string;
  description: string;
};

export type WeatherBundle = {
  city: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  windSpeed: number;
  windDir: string;
  sunLabel: string;
  sunTime: string;
  unitsLabel: string;
  effect: WeatherEffect;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

const ORDINALS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** OpenWeather icon ids → MMM-OpenWeatherForecast icons/1c filenames. */
const OPEN_WEATHER_ICON_FILES: Record<string, string> = {
  '01d': 'clear-day',
  '01n': 'clear-night',
  '02d': 'partly-cloudy-day',
  '02n': 'partly-cloudy-night',
  '03d': 'cloudy',
  '03n': 'cloudy',
  '04d': 'cloudy',
  '04n': 'cloudy',
  '09d': 'rain',
  '09n': 'rain',
  '10d': 'rain',
  '10n': 'rain',
  '11d': 'thunderstorm',
  '11n': 'thunderstorm',
  '13d': 'snow',
  '13n': 'snow',
  '50d': 'fog',
  '50n': 'fog',
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  readonly lastBundle = signal<WeatherBundle | null>(null);

  fetchBundle(config: HouseConfig): Observable<WeatherBundle | null> {
    if (!config.openWeatherApiKey) {
      this.lastBundle.set(null);
      return of(null);
    }

    const units = config.weatherUnits || 'imperial';
    const key = config.openWeatherApiKey;
    const { lat, lon } = config.coords;
    const qs = `lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;

    // Prefer One Call 3.0 (same as MMM-OpenWeatherMapForecast) for full daily rows.
    const oneCallUrl =
      `https://api.openweathermap.org/data/3.0/onecall?${qs}` +
      `&exclude=minutely,alerts`;

    return this.http.get<any>(oneCallUrl).pipe(
      map((oneCall) => this.buildFromOneCall(oneCall, config)),
      catchError(() => this.fetchFromFreeApis(qs, config)),
      tap((bundle) => this.lastBundle.set(bundle)),
      catchError(() => {
        this.lastBundle.set(null);
        return of(null);
      })
    );
  }

  /** OpenWeather icon ids mapped to the MMM-OpenWeatherForecast 1c set. */
  iconUrl(icon: string, _size: '2x' | '4x' = '2x'): string {
    const file = OPEN_WEATHER_ICON_FILES[icon] ?? 'cloudy';
    return `/weather-icons/1c/${file}.svg`;
  }

  extraIcon(name: 'wind' | 'sunrise' | 'sunset'): string {
    return `/weather-icons/1c/i-${name}.svg`;
  }

  private fetchFromFreeApis(qs: string, config: HouseConfig): Observable<WeatherBundle | null> {
    const base = `https://api.openweathermap.org/data/2.5`;
    return forkJoin({
      current: this.http.get<any>(`${base}/weather?${qs}`),
      forecast: this.http.get<any>(`${base}/forecast?${qs}`),
    }).pipe(
      map(({ current, forecast }) => this.buildFromForecast25(current, forecast, config)),
      catchError(() => of(null))
    );
  }

  private buildFromOneCall(data: any, config: HouseConfig): WeatherBundle {
    const unitsLabel = (config.weatherUnits || 'imperial') === 'metric' ? 'C' : 'F';
    const timeFormat = config.timeFormat === 12 ? '12' : '24';
    const maxHourlies = config.weatherMaxHourlies ?? 2;
    const maxDailies = config.weatherMaxDailies ?? 6;
    const current = data.current || {};
    const now = Date.now() / 1000;
    const sunrise = Number(current.sunrise || 0);
    const sunset = Number(current.sunset || 0);
    const showSunset = sunrise < now && sunset > now;
    const sunTs = (showSunset ? sunset : sunrise) * 1000;

    const hourlies: any[] = Array.isArray(data.hourly) ? data.hourly : [];
    // Match MM default: every 3 hours, skip "now"
    const hourly: HourlyForecast[] = [];
    for (let i = 3; i < hourlies.length && hourly.length < maxHourlies; i += 3) {
      const item = hourlies[i];
      hourly.push({
        time: this.formatHour(item.dt * 1000, timeFormat),
        temp: Math.round(item.temp ?? 0),
        icon: String(item.weather?.[0]?.icon ?? '01d'),
        description: String(item.weather?.[0]?.description ?? ''),
      });
    }

    const dailies: any[] = Array.isArray(data.daily) ? data.daily : [];
    // Skip today (index 0) like MagicMirror unless we need the count
    const start = dailies.length - 1 >= maxDailies ? 1 : 0;
    const daily = dailies.slice(start, start + maxDailies).map((item: any) => ({
      day: DAYS[new Date(item.dt * 1000).getDay()],
      high: Math.round(item.temp?.max ?? item.temp?.day ?? 0),
      low: Math.round(item.temp?.min ?? item.temp?.night ?? 0),
      icon: String(item.weather?.[0]?.icon ?? '01d'),
      description: String(item.weather?.[0]?.description ?? ''),
    }));

    const weatherId = Number(current.weather?.[0]?.id ?? 800);
    return {
      city: '',
      temp: Number(current.temp ?? 0),
      feelsLike: Math.round(Number(current.feels_like ?? current.temp ?? 0)),
      description: String(current.weather?.[0]?.description ?? ''),
      icon: String(current.weather?.[0]?.icon ?? '01d'),
      windSpeed: Math.round(Number(current.wind_speed ?? 0)),
      windDir: this.degToCardinal(Number(current.wind_deg ?? 0)),
      sunLabel: showSunset ? 'sunset' : 'sunrise',
      sunTime: this.formatHour(sunTs, timeFormat, true),
      unitsLabel,
      effect: this.effectFromId(weatherId),
      hourly,
      daily,
    };
  }

  private buildFromForecast25(current: any, forecast: any, config: HouseConfig): WeatherBundle {
    const unitsLabel = (config.weatherUnits || 'imperial') === 'metric' ? 'C' : 'F';
    const timeFormat = config.timeFormat === 12 ? '12' : '24';
    const maxHourlies = config.weatherMaxHourlies ?? 2;
    const maxDailies = config.weatherMaxDailies ?? 6;

    const now = Date.now() / 1000;
    const sunrise = Number(current.sys?.sunrise || 0);
    const sunset = Number(current.sys?.sunset || 0);
    const showSunset = sunrise < now && sunset > now;
    const sunTs = (showSunset ? sunset : sunrise) * 1000;

    const list: any[] = Array.isArray(forecast?.list) ? forecast.list : [];
    const hourly = list.slice(0, maxHourlies).map((item) => ({
      time: this.formatHour(item.dt * 1000, timeFormat),
      temp: Math.round(item.main?.temp ?? 0),
      icon: String(item.weather?.[0]?.icon ?? '01d'),
      description: String(item.weather?.[0]?.description ?? ''),
    }));

    return {
      city: String(current.name ?? ''),
      temp: Number(current.main?.temp ?? 0),
      feelsLike: Math.round(Number(current.main?.feels_like ?? current.main?.temp ?? 0)),
      description: String(current.weather?.[0]?.description ?? ''),
      icon: String(current.weather?.[0]?.icon ?? '01d'),
      windSpeed: Math.round(Number(current.wind?.speed ?? 0)),
      windDir: this.degToCardinal(Number(current.wind?.deg ?? 0)),
      sunLabel: showSunset ? 'sunset' : 'sunrise',
      sunTime: this.formatHour(sunTs, timeFormat, true),
      unitsLabel,
      effect: this.effectFromId(Number(current.weather?.[0]?.id ?? 800)),
      hourly,
      daily: this.aggregateDaily(list, maxDailies),
    };
  }

  /**
   * Build up to maxDays from 3-hour slots.
   * Prefer upcoming days (skip today when possible), but include today
   * when needed so a request for 6 days is filled from whatever the API returns.
   */
  private aggregateDaily(list: any[], maxDays: number): DailyForecast[] {
    const byDay = new Map<
      string,
      { sort: number; highs: number[]; lows: number[]; icons: string[]; descriptions: string[]; day: string }
    >();

    for (const item of list) {
      const date = new Date(item.dt * 1000);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const entry = byDay.get(key) || {
        sort: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
        highs: [],
        lows: [],
        icons: [],
        descriptions: [],
        day: DAYS[date.getDay()],
      };
      entry.highs.push(Number(item.main?.temp_max ?? item.main?.temp ?? 0));
      entry.lows.push(Number(item.main?.temp_min ?? item.main?.temp ?? 0));
      entry.icons.push(String(item.weather?.[0]?.icon ?? '01d'));
      entry.descriptions.push(String(item.weather?.[0]?.description ?? ''));
      byDay.set(key, entry);
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const ordered = [...byDay.entries()].sort((a, b) => a[1].sort - b[1].sort);

    const future = ordered.filter(([key]) => key !== todayKey);
    const todayEntry = ordered.find(([key]) => key === todayKey);
    const selected =
      future.length >= maxDays
        ? future.slice(0, maxDays)
        : [...(todayEntry ? [todayEntry] : []), ...future].slice(0, maxDays);

    return selected.map(([, entry]) => {
      const mid = entry.icons[Math.min(2, entry.icons.length - 1)] || entry.icons[0];
      return {
        day: entry.day,
        high: Math.round(Math.max(...entry.highs)),
        low: Math.round(Math.min(...entry.lows)),
        icon: mid,
        description: entry.descriptions[Math.min(2, entry.descriptions.length - 1)] || '',
      };
    });
  }

  private formatHour(ts: number, format: '12' | '24', withMinutes = false): string {
    const opts: Intl.DateTimeFormatOptions =
      format === '12'
        ? {
            hour: 'numeric',
            ...(withMinutes ? { minute: '2-digit' } : {}),
            hour12: true,
          }
        : {
            hour: '2-digit',
            ...(withMinutes ? { minute: '2-digit' } : {}),
            hour12: false,
          };
    return new Intl.DateTimeFormat('en-US', opts).format(new Date(ts)).toLowerCase();
  }

  private degToCardinal(deg: number): string {
    return ORDINALS[Math.round(((deg % 360) / 360) * 16) % 16];
  }

  private effectFromId(id: number): WeatherEffect {
    if (id >= 200 && id < 300) return 'storm';
    if (id >= 300 && id < 600) return 'rain';
    if (id >= 600 && id < 700) return 'snow';
    if (id === 801 || id === 802 || id === 803 || id === 804) return 'clouds';
    return 'none';
  }
}
