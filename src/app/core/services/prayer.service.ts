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
    const now = new Date();
    const times = prayTime.times(now);
    const rows: PrayerRow[] = [
      { name: 'Fajr', time: String(times.fajr) },
      { name: 'Sunrise', time: String(times.sunrise) },
      { name: 'Dhuhr', time: String(times.dhuhr) },
      { name: 'Asr', time: String(times.asr) },
      { name: 'Maghrib', time: String(times.maghrib) },
      { name: 'Isha', time: String(times.isha) },
    ];
    const ishaMins = this.parseToMinutes(String(times.isha));
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (ishaMins >= 0 && nowMins >= ishaMins) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      rows[0].time = String(prayTime.times(tomorrow).fajr);
    }
    return config.prayerShowSunrise ? rows : rows.filter((r) => r.name !== 'Sunrise');
  }

  /** Highlight the prayer in progress. After Isha, highlight the next Fajr. */
  getCurrentName(rows: PrayerRow[]): string {
    const minutes = new Date().getHours() * 60 + new Date().getMinutes();
    const parsed = rows
      .filter((row) => row.name !== 'Sunrise')
      .map((row) => ({ name: row.name, mins: this.parseToMinutes(row.time) }))
      .filter((r) => r.mins >= 0);

    const isha = parsed.find((row) => row.name === 'Isha');
    if (isha && minutes >= isha.mins) return 'Fajr';

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
