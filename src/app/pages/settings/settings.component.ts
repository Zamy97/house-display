import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import {
  DisplayLayout,
  HouseConfig,
  LAYOUT_LABELS,
  MODULE_LABELS,
  ModuleId,
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
  draft: HouseConfig = structuredClone(this.configService.config());
  moduleIds = Object.keys(MODULE_LABELS) as ModuleId[];
  labels = MODULE_LABELS;
  layoutIds = Object.keys(LAYOUT_LABELS) as DisplayLayout[];
  layoutLabels = LAYOUT_LABELS;
  importText = '';
  message = '';

  save(): void {
    this.configService.update(this.draft);
    this.message = 'Saved. Open the display to see changes.';
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
