import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import {
  ALL_MODULE_IDS,
  DISPLAY_SCALE_OPTIONS,
  DisplayOrientation,
  HouseConfig,
  MODULE_LABELS,
  MODULE_REGION_LABELS,
  MODULE_REGION_OPTIONS,
  MODULE_SCALE_OPTIONS,
  ModuleId,
  ModuleRegion,
  ORIENTATION_LABELS,
} from '../../core/models/house-config';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);
  draft: HouseConfig = structuredClone(this.configService.config());
  moduleIds = ALL_MODULE_IDS;
  labels = MODULE_LABELS;
  orientationIds = Object.keys(ORIENTATION_LABELS) as DisplayOrientation[];
  orientationLabels = ORIENTATION_LABELS;
  scaleOptions = DISPLAY_SCALE_OPTIONS;
  moduleScaleOptions = MODULE_SCALE_OPTIONS;
  regionOptions = MODULE_REGION_OPTIONS;
  regionLabels = MODULE_REGION_LABELS;
  importText = '';
  message = '';

  moduleScale(id: ModuleId): number {
    return this.draft.moduleScales?.[id] ?? 1;
  }

  setModuleScale(id: ModuleId, value: number): void {
    this.draft.moduleScales = {
      ...this.draft.moduleScales,
      [id]: Number(value),
    };
  }

  moduleRegion(id: ModuleId): ModuleRegion {
    return this.draft.moduleRegions?.[id] ?? 'left';
  }

  setModuleRegion(id: ModuleId, value: ModuleRegion): void {
    this.draft.moduleRegions = { ...this.draft.moduleRegions, [id]: value };
  }

  /** Modules currently assigned to a region, sorted by order. */
  modulesInRegion(region: ModuleRegion): ModuleId[] {
    return this.moduleIds
      .filter((id) => this.moduleRegion(id) === region)
      .sort(
        (a, b) =>
          (this.draft.moduleOrder?.[a] ?? 99) -
          (this.draft.moduleOrder?.[b] ?? 99)
      );
  }

  moveModule(id: ModuleId, direction: -1 | 1): void {
    const region = this.moduleRegion(id);
    const list = this.modulesInRegion(region);
    const index = list.indexOf(id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= list.length) return;

    const a = list[index];
    const b = list[swapWith];
    const orderA = this.draft.moduleOrder?.[a] ?? (index + 1) * 10;
    const orderB = this.draft.moduleOrder?.[b] ?? (swapWith + 1) * 10;
    this.draft.moduleOrder = {
      ...this.draft.moduleOrder,
      [a]: orderB,
      [b]: orderA,
    };
  }

  canMove(id: ModuleId, direction: -1 | 1): boolean {
    const list = this.modulesInRegion(this.moduleRegion(id));
    const index = list.indexOf(id);
    const next = index + direction;
    return index >= 0 && next >= 0 && next < list.length;
  }

  save(): void {
    this.configService.update(this.draft);
    this.message = 'Saved. Open the display to see changes.';
  }

  saveAndBack(): void {
    this.configService.update(this.draft);
    void this.router.navigateByUrl('/');
  }

  reset(): void {
    this.configService.reset();
    this.draft = structuredClone(this.configService.config());
    this.message = 'Reset to defaults.';
  }

  exportConfig(): void {
    this.importText = this.configService.exportJson();
    this.message = 'Config exported into the text box below.';
  }

  importConfig(): void {
    try {
      this.configService.importJson(this.importText);
      this.draft = structuredClone(this.configService.config());
      this.message = 'Imported.';
    } catch {
      this.message = 'Import failed — invalid JSON.';
    }
  }
}
