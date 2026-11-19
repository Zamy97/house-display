import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import {
  DISPLAY_SCALE_OPTIONS,
  HouseConfig,
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
  private readonly router = inject(Router);
  draft: HouseConfig = structuredClone(this.configService.config());
  moduleIds = Object.keys(MODULE_LABELS) as ModuleId[];
  labels = MODULE_LABELS;
  scaleOptions = DISPLAY_SCALE_OPTIONS;
  importText = '';
  message = '';

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
