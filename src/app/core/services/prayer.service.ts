import { Injectable } from '@angular/core';
import { PrayTime } from '../lib/praytime';
import { HouseConfig } from '../models/house-config';

export type PrayerRow = { name: string; time: string };

@Injectable({ providedIn: 'root' })
export class PrayerService {
  getToday(config: HouseConfig): PrayerRow[] {
    const format = config.timeFormat === 12 ? '12h' : '24h';
    const prayTime = new PrayTime(config.prayerMethod)
      .format(format)
      .round('nearest')
      .adjust({ asr: config.asr });
    prayTime.location([config.coords.lat, config.coords.lon]).timezone(config.timezone);
    const times = prayTime.times(new Date());
    return [
      { name: 'Fajr', time: String(times.fajr) },
      { name: 'Sunrise', time: String(times.sunrise) },
      { name: 'Dhuhr', time: String(times.dhuhr) },
      { name: 'Asr', time: String(times.asr) },
      { name: 'Maghrib', time: String(times.maghrib) },
      { name: 'Isha', time: String(times.isha) },
    ];
  }

  /** Highlight the active prayer window (after this prayer, before the next). */
  getCurrentName(rows: PrayerRow[]): string {
    const minutes = new Date().getHours() * 60 + new Date().getMinutes();
    const parsed = rows
      .map((row) => ({ name: row.name, mins: this.parseToMinutes(row.time) }))
      .filter((r) => r.mins >= 0);

    let current = parsed[0]?.name || '';
    for (const row of parsed) {
      if (row.mins <= minutes) current = row.name;
    }
    return current;
  }

  private parseToMinutes(value: string): number {
    const cleaned = value.trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return -1;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3];
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }
}
