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
   * Each text line stretches under the side modules on its own.
   * A line that does not fit there stays in the center column, and that
   * does not pull the lines that do fit back into the center.
   */
  private fitBottomSpan(): void {
    if (this.fitting) return;
    const root = this.host.nativeElement;
    const mirror = root.querySelector('.mirror') as HTMLElement | null;
    const left = root.querySelector('.region.top-left') as HTMLElement | null;
    const right = root.querySelector('.region.top-right') as HTMLElement | null;
    const bar = root.querySelector('.region.bottom-bar') as HTMLElement | null;
    if (!mirror || !bar) return;

    if (this.viewOrientation() !== 'horizontal' || bar.clientHeight < 40) {
      this.resetBottomText(bar);
      return;
    }

    this.fitting = true;
    try {
      this.layoutBottomText(mirror, bar, left, right);
    } finally {
      this.fitting = false;
    }
  }

  private resetBottomText(bar: HTMLElement): void {
    for (const el of this.bottomLines(bar)) {
      el.classList.remove('span-full');
      el.style.order = '';
      el.style.zoom = '';
    }
  }

  private layoutBottomText(
    mirror: HTMLElement,
    bar: HTMLElement,
    left: HTMLElement | null,
    right: HTMLElement | null
  ): void {
    const gap = parseFloat(getComputedStyle(mirror).columnGap) || 0;
    const leftLane = (left?.offsetWidth ?? 0) + gap;
    const rightLane = (right?.offsetWidth ?? 0) + gap;
    const track = Math.max(160, bar.clientWidth - leftLane - rightLane);
    bar.style.setProperty('--lane-left', `${Math.round(leftLane)}px`);
    bar.style.setProperty('--center-track', `${Math.round(track)}px`);

    const groups = this.lineGroups(bar);
    const heights = groups.map((group) =>
      group.reduce((sum, el) => sum + this.fullOuterHeight(el), 0)
    );

    const barRect = bar.getBoundingClientRect();
    const scale = barRect.height / (bar.clientHeight || 1) || 1;
    const bottoms = [left, right]
      .filter((col): col is HTMLElement => !!col)
      .map((col) => this.columnContentBottom(col));
    const sideBottom = bottoms.length ? Math.max(...bottoms) : barRect.top;
    let remaining = Math.max(0, (barRect.bottom - sideBottom) / scale - 8);

    // A suffix of the text, so a line never jumps ahead of the one above it.
    // The arabic line can stay in the center while the lines under it stretch.
    let start = groups.length;
    let used = 0;
    for (let i = groups.length - 1; i >= 0; i--) {
      if (this.isHijri(groups[i])) {
        if (start === i + 1 && used + heights[i] <= remaining + 4) start = i;
        break;
      }
      if (heights[i] <= 4) {
        start = i;
        continue;
      }
      if (used + heights[i] > remaining + 4) break;
      used += heights[i];
      start = i;
    }

    groups.forEach((group, groupIndex) => {
      const wide = groupIndex >= start;
      group.forEach((el) => {
        el.classList.toggle('span-full', wide);
        if (el.style.order) el.style.order = '';
        const mod = el.closest('.mod') as HTMLElement | null;
        const zoom = mod?.style.zoom && mod.style.zoom !== '1' ? mod.style.zoom : '';
        if (el.style.zoom !== zoom) el.style.zoom = zoom;
      });
    });
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
          'app-hadith .ref',
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

  private isHijri(group: HTMLElement[]): boolean {
    return group[0]?.tagName === 'APP-HIJRI';
  }

  /** Bottom of the modules in a side column, not the empty space under them. */
  private columnContentBottom(column: HTMLElement): number {
    let bottom = column.getBoundingClientRect().top;
    for (const child of Array.from(column.children) as HTMLElement[]) {
      const rect = child.getBoundingClientRect();
      if (rect.height > 0) bottom = Math.max(bottom, rect.bottom);
    }
    return bottom;
  }

  /** Height of one line at the full bar width, including its margin. */
  private fullOuterHeight(el: HTMLElement): number {
    const had = el.classList.contains('span-full');
    const prevFlex = el.style.flex;
    el.classList.add('span-full');
    el.style.flex = '0 0 auto';
    const styles = getComputedStyle(el);
    const height =
      el.offsetHeight +
      (parseFloat(styles.marginTop) || 0) +
      (parseFloat(styles.marginBottom) || 0);
    el.style.flex = prevFlex;
    if (!had) el.classList.remove('span-full');
    return height;
  }
}
