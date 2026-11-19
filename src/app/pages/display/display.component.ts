import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import { WeatherService } from '../../core/services/weather.service';
import { ClockComponent } from '../../components/clock/clock.component';
import { PrayerComponent } from '../../components/prayer/prayer.component';
import { CalendarComponent } from '../../components/calendar/calendar.component';
import { WeatherComponent } from '../../components/weather/weather.component';
import { WeatherEffectsComponent } from '../../components/weather-effects/weather-effects.component';
import { HijriComponent } from '../../components/hijri/hijri.component';
import { DuaComponent } from '../../components/dua/dua.component';
import { HadithComponent } from '../../components/hadith/hadith.component';
import { AyahComponent } from '../../components/ayah/ayah.component';
import { WorldClocksComponent } from '../../components/world-clocks/world-clocks.component';
import { WifiComponent } from '../../components/wifi/wifi.component';

import { ModuleId } from '../../core/models/house-config';

export type ViewOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [
    RouterLink,
    ClockComponent,
    PrayerComponent,
    CalendarComponent,
    WeatherComponent,
    WeatherEffectsComponent,
    HijriComponent,
    DuaComponent,
    HadithComponent,
    AyahComponent,
    WorldClocksComponent,
    WifiComponent,
  ],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss',
})
export class DisplayComponent {
  readonly configService = inject(ConfigService);
  readonly weatherService = inject(WeatherService);
  readonly config = this.configService.config;

  private readonly screenOrientation = signal<ViewOrientation>(
    this.readScreenOrientation()
  );

  /** Resolved layout: Settings choice, or screen when set to Auto. */
  readonly viewOrientation = computed<ViewOrientation>(() => {
    const choice = this.config().orientation || 'vertical';
    if (choice === 'horizontal' || choice === 'vertical') return choice;
    return this.screenOrientation();
  });

  readonly effectiveScale = computed(() => {
    const wanted = Number(this.config().displayScale) || 1.55;
    if (this.viewOrientation() === 'horizontal') {
      return Math.min(wanted, 1.2);
    }
    return wanted;
  });

  readonly weatherEffect = computed(() => {
    const cfg = this.config();
    if (!cfg.modules.weather || !cfg.weatherEffects) return 'none';
    return this.weatherService.lastBundle()?.effect || 'none';
  });

  /** Per-module size multiplier set in Settings. */
  scale(id: ModuleId): number {
    return this.config().moduleScales?.[id] || 1;
  }

  constructor() {
    // Keep screen probe fresh when using Auto
    effect(() => {
      this.config().orientation;
      this.screenOrientation.set(this.readScreenOrientation());
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.screenOrientation.set(this.readScreenOrientation());
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    this.screenOrientation.set(this.readScreenOrientation());
  }

  private readScreenOrientation(): ViewOrientation {
    return window.innerHeight >= window.innerWidth ? 'vertical' : 'horizontal';
  }
}
