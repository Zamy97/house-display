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

  private resizeObserver?: ResizeObserver;
  private contentObserver?: MutationObserver;
  private fitting = false;
  private bottomMeasureKey = '';

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

  /** Date, dua, hadith, and ayah. Display size stays capped on a wide screen. */
  readonly readingScale = computed(() => {
    const value = Number(this.config().content?.textScale);
    return value === 1.15 || value === 1.3 ? value : 1;
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
    const bar = root.querySelector('.region.bottom-bar');
    if (bar) {
      this.contentObserver = new MutationObserver(() => {
        this.zone.run(() => this.fitBottomSpan());
      });
      this.contentObserver.observe(bar, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    this.fitBottomSpan();
    document.fonts?.ready.then(() => this.zone.run(() => this.fitBottomSpan()));
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.contentObserver?.disconnect();
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

  /**
   * On a wide screen the reading text is the row under the side modules.
   * It stays full width. The type size changes only when that row is too short.
   */
  private fitBottomSpan(): void {
    if (this.fitting) return;
    const root = this.host.nativeElement;
    const bar = root.querySelector('.region.bottom-bar') as HTMLElement | null;
    if (!bar) return;

    if (bar.clientHeight < 40) {
      this.resetBottomText(bar);
      this.setReadingScale(bar, this.readingScale() * 0.9);
      return;
    }

    this.fitting = true;
    try {
      this.layoutBottomText(bar);
    } finally {
      this.fitting = false;
    }
  }

  private resetBottomText(bar: HTMLElement): void {
    bar.style.removeProperty('--reading-scale');
    this.bottomMeasureKey = '';
    for (const el of this.bottomLines(bar)) {
      el.classList.remove('span-full');
      el.style.order = '';
      el.style.zoom = '';
    }
  }

  private layoutBottomText(bar: HTMLElement): void {
    for (const el of this.bottomLines(bar)) {
      el.classList.add('span-full');
      if (el.style.order) el.style.order = '';
      if (el.style.zoom) el.style.zoom = '';
    }

    const base = this.readingScale() * 0.9;
    const available = bar.clientHeight;
    const key = `${Math.round(bar.clientWidth)}|${bar.innerText}`;
    if (key !== this.bottomMeasureKey) {
      this.bottomMeasureKey = key;
      this.setReadingScale(bar, base);
    }
    const rendered = bar.scrollHeight;
    const applied = parseFloat(bar.style.getPropertyValue('--reading-scale')) || base;
    let next = applied;
    if (rendered > available + 1) {
      next = applied * ((available - 8) / rendered);
    }
    next = Math.min(base, Math.max(0.68, next));
    this.setReadingScale(bar, next);
  }

  private setReadingScale(bar: HTMLElement, scale: number): void {
    const next = String(Math.round(scale * 1000) / 1000);
    if (bar.style.getPropertyValue('--reading-scale') !== next) {
      bar.style.setProperty('--reading-scale', next);
    }
  }

  private bottomLines(bar: HTMLElement): HTMLElement[] {
    return this.lineGroups(bar).flat();
  }

  /** Lines that stay together: a long arabic line does not decide for the lines around it. */
  private lineGroups(bar: HTMLElement): HTMLElement[][] {
    const nodes = Array.from(
      bar.querySelectorAll(
        [
          'app-hijri',
          'app-dua h2',
          'app-dua .arabic',
          'app-dua .transliteration',
          'app-dua .translation',
          'app-dua .bangla',
          'app-dua .repeat',
          'app-dua .ref',
          'app-hadith h2',
          'app-hadith .text',
          'app-hadith .bangla',
          'app-ayah .arabic',
          'app-ayah .translation',
          'app-ayah .bangla',
        ].join(', ')
      )
    ) as HTMLElement[];

    const groups: HTMLElement[][] = [];
    let index = 0;
    while (index < nodes.length) {
      const el = nodes[index];
      if (el.tagName === 'APP-HIJRI') {
        groups.push([el]);
        index++;
        continue;
      }
      const owner = el.closest('app-dua, app-hadith, app-ayah');
      if (owner?.tagName === 'APP-DUA' && (el.tagName === 'H2' || el.classList.contains('arabic'))) {
        const group: HTMLElement[] = [];
        while (index < nodes.length) {
          const next = nodes[index];
          if (next.closest('app-dua') !== owner) break;
          if (next.tagName !== 'H2' && !next.classList.contains('arabic')) break;
          group.push(next);
          index++;
        }
        groups.push(group);
        continue;
      }
      if (owner?.tagName === 'APP-AYAH' && el.classList.contains('arabic')) {
        groups.push([el]);
        index++;
        continue;
      }
      if (owner?.tagName === 'APP-DUA') {
        groups.push([nodes[index]]);
        index++;
        continue;
      }
      const group: HTMLElement[] = [];
      while (
        index < nodes.length &&
        nodes[index].closest('app-dua, app-hadith, app-ayah') === owner
      ) {
        group.push(nodes[index]);
        index++;
      }
      if (group.length) groups.push(group);
    }
    return groups;
  }
}
