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
}
