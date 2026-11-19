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
  arabic?: string;
  reference?: string;
  narrator?: string;
  topic?: string;
};

export type AyahItem = {
  arabic: string;
  translation: string;
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
        return pool[this.dayIndex(pool.length)];
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
            : this.dayIndex(items.length);
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
