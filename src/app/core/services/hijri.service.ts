import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HijriService {
  format(date = new Date(), locale = 'en-US'): string {
    try {
      return new Intl.DateTimeFormat(locale + '-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
  }
}
