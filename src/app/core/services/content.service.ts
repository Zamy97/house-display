import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export type DuaItem = {
  id: number;
  category?: string;
  title?: string;
  titleBn?: string;
  arabic?: string;
  transliteration?: string;
  text?: string;
  textBn?: string;
  repeat?: number;
  reference?: string;
};

export type HadithItem = {
  text?: string;
  textBn?: string;
  arabic?: string;
  reference?: string;
  narrator?: string;
  topic?: string;
};

export type AyahItem = {
  arabic: string;
  translation: string;
  translationBn?: string;
  surahNameEnglish: string;
  surahNameArabic: string;
  ayahNumberInSurah: number;
};

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  private readonly duas$ = this.http
    .get<{ items: DuaItem[] }>('assets/data/duas.json')
    .pipe(
      map((d) => d.items || []),
      shareReplay(1)
    );

  private readonly hadiths$ = this.http
    .get<{ hadiths: HadithItem[] }>('assets/data/hadiths.json')
    .pipe(
      map((d) => d.hadiths || []),
      shareReplay(1)
    );

  private readonly ayahs$ = this.http
    .get<{ ayahs: AyahItem[] }>('assets/data/ayahs.json')
    .pipe(
      map((d) => d.ayahs || []),
      shareReplay(1)
    );

  pickDua(preferBn: boolean): Observable<DuaItem | null> {
    return this.duas$.pipe(
      map((items) => {
        if (!items.length) return null;
        const hour = new Date().getHours();
        const bucket = hour < 16 ? 'morning' : 'evening';
        const filtered = items.filter((i) => i.category === bucket);
        const pool = filtered.length ? filtered : items;
        return pool[duaSlotIndex(pool.length)];
      })
    );
  }

  pickHadith(mode: 'daily' | 'random'): Observable<HadithItem | null> {
    return this.hadiths$.pipe(
      map((items) => {
        if (!items.length) return null;
        const index =
          mode === 'random'
            ? Math.floor(Math.random() * items.length)
            : hadithSlotIndex(items.length);
        return items[index];
      })
    );
  }

  pickAyah(mode: 'daily' | 'random' = 'random'): Observable<AyahItem | null> {
    return this.ayahs$.pipe(
      map((items) => {
        if (!items.length) return null;
        const index =
          mode === 'random'
            ? Math.floor(Math.random() * items.length)
            : this.dayIndex(items.length);
        return items[index];
      })
    );
  }

  private dayIndex(len: number): number {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const day = Math.floor((Date.now() - start.getTime()) / 86400000);
    return day % len;
  }
}

/** Local 3-hour blocks: 12, 3, 6, 9. Morning duas before 4 PM, evening after. */
export function duaSlotIndex(len: number, now = new Date()): number {
  if (len <= 0) return 0;
  const day = calendarDayNumber(now);
  const block = Math.floor(now.getHours() / 3);
  return mod(day * 8 + block, len);
}

/** One hadith from midnight, the next from 1:30 PM, then the next at midnight. */
export function hadithSlotIndex(len: number, now = new Date()): number {
  if (len <= 0) return 0;
  const day = calendarDayNumber(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const afternoon = minutes >= 13 * 60 + 30 ? 1 : 0;
  return mod(day * 2 + afternoon, len);
}

function calendarDayNumber(now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const epoch = Date.UTC(2026, 0, 1);
  return Math.floor((today - epoch) / 86_400_000);
}

function mod(value: number, len: number): number {
  return ((value % len) + len) % len;
}
