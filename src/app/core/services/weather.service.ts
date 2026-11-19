import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { HouseConfig } from '../models/house-config';

export type WeatherSnapshot = {
  temp: number;
  description: string;
  icon: string;
  city: string;
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  fetch(config: HouseConfig): Observable<WeatherSnapshot | null> {
    if (!config.openWeatherApiKey) {
      return of(null);
    }
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${config.coords.lat}&lon=${config.coords.lon}` +
      `&units=imperial&appid=${config.openWeatherApiKey}`;

    return this.http.get<any>(url).pipe(
      map((data) => ({
        temp: Math.round(data.main?.temp ?? 0),
        description: String(data.weather?.[0]?.description ?? ''),
        icon: String(data.weather?.[0]?.icon ?? '01d'),
        city: String(data.name ?? ''),
      })),
      catchError(() => of(null))
    );
  }
}
