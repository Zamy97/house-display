import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { WeatherBundle, WeatherService } from '../../core/services/weather.service';
import { HouseConfig } from '../../core/models/house-config';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss',
})
export class WeatherComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) config!: HouseConfig;
  weather: WeatherBundle | null = null;
  private sub?: Subscription;
  private refreshTimer?: number;

  constructor(private readonly weatherService: WeatherService) {}

  ngOnChanges(): void {
    this.load();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = window.setInterval(() => this.load(), 10 * 60 * 1000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  iconUrl(icon: string, size: '2x' | '4x' = '2x'): string {
    return this.weatherService.iconUrl(icon, size);
  }

  extraIcon(name: 'wind' | 'sunrise' | 'sunset'): string {
    return this.weatherService.extraIcon(name);
  }

  private load(): void {
    if (!this.config) return;
    this.sub?.unsubscribe();
    this.sub = this.weatherService
      .fetchBundle(this.config)
      .subscribe((w) => (this.weather = w));
  }
}
