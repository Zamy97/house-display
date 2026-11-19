import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_HOUSE_CONFIG,
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
    return {
      ...base,
      ...overlay,
      coords: { ...base.coords, ...(overlay.coords || {}) },
      wifi: { ...base.wifi, ...(overlay.wifi || {}) },
      content: { ...base.content, ...(overlay.content || {}) },
      modules: { ...base.modules, ...(overlay.modules || {}) },
      worldClocks: overlay.worldClocks?.length
        ? overlay.worldClocks
        : base.worldClocks,
    };
  }
}
