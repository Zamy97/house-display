import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
import {
  ALL_MODULE_IDS,
  ModuleId,
  ModuleRegion,
} from '../../core/models/house-config';

export type ViewOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [
    NgTemplateOutlet,
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
export class DisplayComponent implements AfterViewInit, OnDestroy {
  readonly configService = inject(ConfigService);
  readonly weatherService = inject(WeatherService);
  readonly config = this.configService.config;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  /** Full width under the side modules, or the center column when that would cover them. */
  readonly bottomSpan = signal<'center' | 'full'>('center');
  private resizeObserver?: ResizeObserver;
  private declinedFull = false;
  private lastSide = -1;
  private lastMirror = -1;
  private pendingSpan = false;

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
    const wanted = Number(this.config().displayScale) || 1.4;
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

  readonly leftModules = computed(() => this.modulesIn('left'));
  readonly rightModules = computed(() => this.modulesIn('right'));
  readonly bottomModules = computed(() => this.modulesIn('bottom'));

  /** Per-module size multiplier set in Settings. */
  scale(id: ModuleId): number {
    return this.config().moduleScales?.[id] || 1;
  }

  constructor() {
    effect(() => {
      this.config();
      this.viewOrientation();
      this.screenOrientation.set(this.readScreenOrientation());
      if (this.resizeObserver) this.fitBottomSpan();
    });
  }

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const mirror = root.querySelector('.mirror');
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.fitBottomSpan());
    });
    for (const el of [
      mirror,
      root.querySelector('.region.top-left'),
      root.querySelector('.region.top-right'),
      root.querySelector('.region.bottom-bar'),
    ]) {
      if (el) this.resizeObserver.observe(el);
    }
    this.fitBottomSpan();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.screenOrientation.set(this.readScreenOrientation());
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    this.screenOrientation.set(this.readScreenOrientation());
  }

  private modulesIn(region: ModuleRegion): ModuleId[] {
    const cfg = this.config();
    const regions = cfg.moduleRegions || {};
    const order = cfg.moduleOrder || {};
    return ALL_MODULE_IDS.filter(
      (id) => cfg.modules[id] && (regions[id] || 'left') === region
    ).sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));
  }

  private readScreenOrientation(): ViewOrientation {
    return window.innerHeight >= window.innerWidth ? 'vertical' : 'horizontal';
  }

  private contentHeight(el: HTMLElement | null): number {
    if (!el) return 0;
    let total = 0;
    for (const child of Array.from(el.children) as HTMLElement[]) {
      total += child.offsetHeight;
    }
    return total;
  }

  /** Stretch the bottom text when it fits under the side modules. */
  private fitBottomSpan(): void {
    const root = this.host.nativeElement;
    const mirror = root.querySelector('.mirror') as HTMLElement | null;
    const left = root.querySelector('.region.top-left') as HTMLElement | null;
    const right = root.querySelector('.region.top-right') as HTMLElement | null;
    const bar = root.querySelector('.region.bottom-bar') as HTMLElement | null;
    if (!mirror || !bar) return;

    const side = Math.max(this.contentHeight(left), this.contentHeight(right));
    const mirrorH = mirror.clientHeight;
    if (side !== this.lastSide || mirrorH !== this.lastMirror) {
      this.declinedFull = false;
      this.lastSide = side;
      this.lastMirror = mirrorH;
    }

    if (this.viewOrientation() !== 'horizontal') {
      if (this.bottomSpan() !== 'center') this.bottomSpan.set('center');
      return;
    }

    if (this.bottomSpan() === 'full') {
      // flex-end hides the top (the Islamic date) without growing scrollHeight.
      const clipped = this.contentHeight(bar) > bar.clientHeight + 4;
      if (clipped) {
        this.declinedFull = true;
        this.bottomSpan.set('center');
      }
      return;
    }

    if (this.declinedFull || this.pendingSpan) return;
    this.pendingSpan = true;
    this.bottomSpan.set('full');
    requestAnimationFrame(() => {
      this.pendingSpan = false;
      this.fitBottomSpan();
    });
  }
}
