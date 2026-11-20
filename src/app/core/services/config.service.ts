import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_HOUSE_CONFIG,
  DISPLAY_SCALE_OPTIONS,
  HouseConfig,
  ModuleId,
} from '../models/house-config';

const STORAGE_KEY = 'house-display.config.v1';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly state = signal<HouseConfig>(this.readInitial());

  readonly config = this.state.asReadonly();
  readonly enabledModules = computed(() => this.state().modules);

  isEnabled(id: ModuleId): boolean {
    return !!this.state().modules[id];
  }

  update(partial: Partial<HouseConfig>): void {
    const next = { ...this.state(), ...partial };
    this.state.set(next);
    this.persist(next);
  }

  setModule(id: ModuleId, enabled: boolean): void {
    const modules = { ...this.state().modules, [id]: enabled };
    this.update({ modules });
  }

  reset(): void {
    this.state.set(structuredClone(DEFAULT_HOUSE_CONFIG));
    this.persist(this.state());
  }

  exportJson(): string {
    return JSON.stringify(this.state(), null, 2);
  }

  importJson(raw: string): void {
    const parsed = JSON.parse(raw) as HouseConfig;
    const merged = this.merge(DEFAULT_HOUSE_CONFIG, parsed);
    this.state.set(merged);
    this.persist(merged);
  }

  private readInitial(): HouseConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return this.merge(DEFAULT_HOUSE_CONFIG, JSON.parse(raw));
      }
    } catch {
      // ignore
    }
    return structuredClone(DEFAULT_HOUSE_CONFIG);
  }

  private persist(config: HouseConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }

  private merge(base: HouseConfig, overlay: Partial<HouseConfig>): HouseConfig {
    const merged: HouseConfig = {
      ...base,
      ...overlay,
      coords: { ...base.coords, ...(overlay.coords || {}) },
      wifi: { ...base.wifi, ...(overlay.wifi || {}) },
      content: { ...base.content, ...(overlay.content || {}) },
      modules: { ...base.modules, ...(overlay.modules || {}) },
      moduleScales: { ...base.moduleScales, ...(overlay.moduleScales || {}) },
      moduleRegions: {
        ...base.moduleRegions,
        ...(overlay.moduleRegions || {}),
      },
      moduleOrder: { ...base.moduleOrder, ...(overlay.moduleOrder || {}) },
      worldClocks: overlay.worldClocks?.length
        ? overlay.worldClocks
        : base.worldClocks,
    };
    merged.displayScale = this.snapDisplayScale(merged.displayScale);
    this.placeHijriAboveDua(merged);
    return merged;
  }

  /** Old default kept the Islamic date under weather. Sit it just above the dua. */
  private placeHijriAboveDua(merged: HouseConfig): void {
    if (merged.moduleRegions.hijri !== 'right') return;
    if ((merged.moduleOrder.hijri ?? 20) !== 20) return;
    merged.moduleRegions.hijri = 'bottom';
    merged.moduleOrder.hijri = (merged.moduleOrder.dua ?? 10) - 5;
  }

  /** Keep the select from going blank when an old saved scale isn't in the list. */
  private snapDisplayScale(value: number): number {
    const options = DISPLAY_SCALE_OPTIONS.map((o) => o.value);
    if (options.includes(value)) return value;
    return options.reduce((best, cur) =>
      Math.abs(cur - value) < Math.abs(best - value) ? cur : best
    );
  }
}
