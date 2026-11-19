import { Component, computed, inject } from '@angular/core';
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

  readonly weatherEffect = computed(() => {
    const cfg = this.config();
    if (!cfg.modules.weather || !cfg.weatherEffects) return 'none';
    return this.weatherService.lastBundle()?.effect || 'none';
  });
}
