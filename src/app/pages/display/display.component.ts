import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
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
export class DisplayComponent implements OnInit {
  readonly configService = inject(ConfigService);
  readonly weatherService = inject(WeatherService);
  readonly config = this.configService.config;

  /** Follows the screen — no Settings toggle required. Prefers vertical when tall. */
  readonly viewOrientation = signal<ViewOrientation>('vertical');

  /**
   * Vertical (portrait TV) can use the full TV size setting.
   * Horizontal has less height, so scale is capped so modules aren't clipped.
   */
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

  ngOnInit(): void {
    this.refreshOrientation();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.refreshOrientation();
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    this.refreshOrientation();
  }

  private refreshOrientation(): void {
    const tall = window.innerHeight >= window.innerWidth;
    this.viewOrientation.set(tall ? 'vertical' : 'horizontal');
  }
}
