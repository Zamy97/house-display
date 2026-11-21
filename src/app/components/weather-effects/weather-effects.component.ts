import { Component, Input } from '@angular/core';
import { WeatherEffect } from '../../core/services/weather.service';

type RainDrop = {
  i: number;
  left: number;
  height: number;
  opacity: number;
  delay: number;
  duration: number;
  drift: number;
  slant: number;
};

/** Scattered streaks, same idea as MMM-DynamicWeather's makeItRain. */
function rainDrops(count: number): RainDrop[] {
  return Array.from({ length: count }, (_, i) => {
    const slant = -8 - Math.random() * 10;
    return {
      i,
      left: Math.random() * 100,
      height: 22 + Math.random() * 58,
      opacity: 0.22 + Math.random() * 0.45,
      delay: -Math.random() * 2.2,
      duration: 0.65 + Math.random() * 0.85,
      drift: Math.tan((slant * Math.PI) / 180) * 720,
      slant,
    };
  });
}

@Component({
  selector: 'app-weather-effects',
  standalone: true,
  template: `
    @if (effect && effect !== 'none') {
      <div class="fx" [attr.data-effect]="effect" aria-hidden="true">
        @if (effect === 'rain' || effect === 'storm') {
          @for (d of drops; track d.i) {
            <span
              class="drop"
              [style.--left]="d.left"
              [style.--h]="d.height"
              [style.--o]="d.opacity"
              [style.--delay]="d.delay + 's'"
              [style.--dur]="d.duration + 's'"
              [style.--drift]="d.drift + 'px'"
              [style.--slant]="d.slant + 'deg'"
            ></span>
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
  readonly drops = rainDrops(42);
  readonly flakes = Array.from({ length: 18 }, (_, i) => i);
}
