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

type CloudPiece = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  opacity: number;
  blur: number;
  sheet: boolean;
};

type CloudPuff = {
  i: number;
  top: number;
  delay: number;
  duration: number;
  pieces: CloudPiece[];
};

function piece(
  x: number,
  y: number,
  sx: number,
  sy: number,
  opacity: number,
  blur = 0,
  sheet = false
): CloudPiece {
  return { x, y, sx, sy, opacity, blur, sheet };
}

/** Different outlines from the weather cloud: a puff, a wide bank, a tall pile, a flat sheet. */
function cloudPieces(style: number): CloudPiece[] {
  const flip = Math.random() < 0.5 ? -1 : 1;
  if (style === 0) {
    const size = 0.38 + Math.random() * 0.28;
    return [piece(0, 0, flip * size, size * (0.82 + Math.random() * 0.36), 0.5 + Math.random() * 0.22)];
  }
  if (style === 1) {
    const size = 0.62 + Math.random() * 0.22;
    return [
      piece(0, 16, flip * size, size * 0.86, 0.62),
      piece(78, 0, -flip * size * 0.72, size * 0.78, 0.54),
      piece(148, 24, flip * size * 0.5, size * 0.55, 0.46),
    ];
  }
  if (style === 2) {
    const size = 0.78 + Math.random() * 0.28;
    return [
      piece(8, 34, flip * size, size * 0.92, 0.68),
      piece(34, 0, -flip * size * 0.58, size * 0.66, 0.58),
    ];
  }
  if (style === 3) {
    const size = 1.05 + Math.random() * 0.45;
    return [piece(0, 0, flip * size, size * (0.38 + Math.random() * 0.12), 0.32 + Math.random() * 0.12, 0.6, true)];
  }
  if (style === 4) {
    const size = 0.95 + Math.random() * 0.32;
    return [
      piece(0, 12, flip * size, size * 0.96, 0.7),
      piece(64, -6, -flip * size * 0.38, size * 0.34, 0.52),
    ];
  }
  const size = 0.28 + Math.random() * 0.14;
  return [piece(0, 0, flip * size * 1.35, size * 0.62, 0.38, 1.2)];
}

function cloudPuffs(count: number): CloudPuff[] {
  return Array.from({ length: count }, (_, i) => {
    const style = i % 6;
    const duration = style === 0 || style === 5 ? 20 + Math.random() * 12 : 36 + Math.random() * 18;
    return {
      i,
      top: 3 + Math.random() * 74,
      delay: -Math.random() * duration,
      duration,
      pieces: cloudPieces(style),
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
              @for (piece of c.pieces; track $index) {
                <span
                  class="cloud"
                  [class.sheet]="piece.sheet"
                  [style.--x]="piece.x"
                  [style.--y]="piece.y"
                  [style.--sx]="piece.sx"
                  [style.--sy]="piece.sy"
                  [style.--o]="piece.opacity"
                  [style.--blur]="piece.blur"
                ></span>
              }
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
  readonly clouds = cloudPuffs(8);
}
