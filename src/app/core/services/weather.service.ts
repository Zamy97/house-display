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
    const base = `https://api.openweathermap.org/data/2.5`;
    const qs = `lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;

    return forkJoin({
      current: this.http.get<any>(`${base}/weather?${qs}`),
      forecast: this.http.get<any>(`${base}/forecast?${qs}`),
    }).pipe(
      map(({ current, forecast }) => this.buildBundle(current, forecast, config)),
      tap((bundle) => this.lastBundle.set(bundle)),
      catchError(() => {
        this.lastBundle.set(null);
        return of(null);
      })
    );
  }

  iconUrl(icon: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${icon}@${size}.png`;
  }

  private buildBundle(current: any, forecast: any, config: HouseConfig): WeatherBundle {
    const units = config.weatherUnits || 'imperial';
    const unitsLabel = units === 'metric' ? 'C' : 'F';
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

    const daily = this.aggregateDaily(list, maxDailies);
    const weatherId = Number(current.weather?.[0]?.id ?? 800);
    const icon = String(current.weather?.[0]?.icon ?? '01d');

    return {
      city: String(current.name ?? ''),
      temp: Number(current.main?.temp ?? 0),
      feelsLike: Math.round(Number(current.main?.feels_like ?? current.main?.temp ?? 0)),
      description: String(current.weather?.[0]?.description ?? ''),
      icon,
      windSpeed: Math.round(Number(current.wind?.speed ?? 0)),
      windDir: this.degToCardinal(Number(current.wind?.deg ?? 0)),
      sunLabel: showSunset ? 'sunset' : 'sunrise',
      sunTime: this.formatHour(sunTs, timeFormat, true),
      unitsLabel,
      effect: this.effectFromId(weatherId),
      hourly,
      daily,
    };
  }

  private aggregateDaily(list: any[], maxDays: number): DailyForecast[] {
    const byDay = new Map<
      string,
      { highs: number[]; lows: number[]; icons: string[]; descriptions: string[]; day: string }
    >();

    for (const item of list) {
      const date = new Date(item.dt * 1000);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const entry = byDay.get(key) || {
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

    const todayKey = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })();

    return [...byDay.entries()]
      .filter(([key]) => key !== todayKey)
      .slice(0, maxDays)
      .map(([, entry]) => {
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
