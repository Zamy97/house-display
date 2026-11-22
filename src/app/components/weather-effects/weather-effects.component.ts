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

type SnowFlake = {
  i: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  jiggleDelay: number;
  jiggleDuration: number;
  image: number;
};

/** Scattered flakes that sway as they fall, same idea as MMM-DynamicWeather snow. */
function snowFlakes(count: number): SnowFlake[] {
  return Array.from({ length: count }, (_, i) => {
    const size = 0.35 + Math.random() * 0.75;
    const duration = 16 + Math.random() * 18 * (1.15 - size);
    return {
      i,
      left: Math.random() * 110 - 8,
      size,
      delay: -Math.random() * duration,
      duration,
      jiggleDelay: -Math.random() * 14,
      jiggleDuration: 9 + Math.random() * 11,
      image: 1 + Math.floor(Math.random() * 3),
    };
  });
}

type CloudPuff = {
  i: number;
  top: number;
  scale: number;
  opacity: number;
  delay: number;
  duration: number;
};

/** The same cloud picture as the current-weather icon, small and large, drifting left to right. */
function cloudPuffs(count: number): CloudPuff[] {
  return Array.from({ length: count }, (_, i) => {
    const big = i % 3 === 0;
    const scale = big ? 1.35 + Math.random() * 0.55 : 0.55 + Math.random() * 0.35;
    const duration = big ? 42 + Math.random() * 18 : 24 + Math.random() * 14;
    return {
      i,
      top: big ? 6 + Math.random() * 58 : 2 + Math.random() * 78,
      scale,
      opacity: big ? 0.7 + Math.random() * 0.14 : 0.48 + Math.random() * 0.18,
      delay: -Math.random() * duration,
      duration,
    };
  });
}

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
          @for (f of flakes; track f.i) {
            <span
              class="flake"
              [style.--left]="f.left"
              [style.--delay]="f.delay + 's'"
              [style.--dur]="f.duration + 's'"
            >
              <span
                class="jiggle"
                [style.--size]="f.size"
                [style.--jdelay]="f.jiggleDelay + 's'"
                [style.--jdur]="f.jiggleDuration + 's'"
              >
                <span
                  class="crystal"
                  [style.background-image]="'url(/weather-effects/snow' + f.image + '.png)'"
                ></span>
              </span>
            </span>
          }
        }
        @if (effect === 'clouds') {
          @for (c of clouds; track c.i) {
            <span
              class="cloud-base"
              [style.--top]="c.top"
              [style.--delay]="c.delay + 's'"
              [style.--dur]="c.duration + 's'"
            >
              <span class="cloud" [style.--scale]="c.scale" [style.--o]="c.opacity"></span>
            </span>
          }
        }
        @if (effect === 'storm') {
          <div class="haze"></div>
          <div class="bolt bolt-1"></div>
          <div class="bolt bolt-2"></div>
        }
      </div>
    }
  `,
  styleUrl: './weather-effects.component.scss',
})
export class WeatherEffectsComponent {
  @Input() effect: WeatherEffect = 'none';
  readonly drops = rainDrops(42);
  readonly flakes = snowFlakes(40);
  readonly clouds = cloudPuffs(9);
}
