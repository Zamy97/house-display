import { Component, Input, OnChanges } from '@angular/core';
import { WeatherService, WeatherSnapshot } from '../../core/services/weather.service';
import { HouseConfig } from '../../core/models/house-config';

@Component({
  selector: 'app-weather',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Weather</h2>
      @if (weather; as w) {
        <div class="temp">{{ w.temp }}°</div>
        <div class="desc">{{ w.description }}</div>
        <div class="city">{{ w.city }}</div>
      } @else {
        <div class="muted">Add OpenWeather API key in Settings</div>
      }
    </section>
  `,
  styleUrl: './weather.component.scss',
})
export class WeatherComponent implements OnChanges {
  @Input({ required: true }) config!: HouseConfig;
  weather: WeatherSnapshot | null = null;

  constructor(private readonly weatherService: WeatherService) {}

  ngOnChanges(): void {
    if (!this.config) return;
    this.weatherService.fetch(this.config).subscribe((w) => (this.weather = w));
  }
}
