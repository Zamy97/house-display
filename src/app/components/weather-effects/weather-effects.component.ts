import { Component, Input } from '@angular/core';
import { WeatherEffect } from '../../core/services/weather.service';

@Component({
  selector: 'app-weather-effects',
  standalone: true,
  template: `
    @if (effect && effect !== 'none') {
      <div class="fx" [attr.data-effect]="effect" aria-hidden="true">
        @if (effect === 'rain' || effect === 'storm') {
          @for (i of drops; track i) {
            <span class="drop" [style.--i]="i"></span>
          }
        }
        @if (effect === 'snow') {
          @for (i of flakes; track i) {
            <span class="flake" [style.--i]="i">❄</span>
          }
        }
        @if (effect === 'clouds' || effect === 'storm') {
          <div class="haze"></div>
        }
      </div>
    }
  `,
  styleUrl: './weather-effects.component.scss',
})
export class WeatherEffectsComponent {
  @Input() effect: WeatherEffect = 'none';
  readonly drops = Array.from({ length: 24 }, (_, i) => i);
  readonly flakes = Array.from({ length: 18 }, (_, i) => i);
}
