import { Component, Input, OnChanges } from '@angular/core';
import { PrayerRow, PrayerService } from '../../core/services/prayer.service';
import { HouseConfig } from '../../core/models/house-config';

@Component({
  selector: 'app-prayer',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Prayer Times</h2>
      <table>
        @for (row of rows; track row.name) {
          <tr>
            <td>{{ row.name }}</td>
            <td class="time">{{ row.time }}</td>
          </tr>
        }
      </table>
    </section>
  `,
  styleUrl: './prayer.component.scss',
})
export class PrayerComponent implements OnChanges {
  @Input({ required: true }) config!: HouseConfig;
  rows: PrayerRow[] = [];

  constructor(private readonly prayer: PrayerService) {}

  ngOnChanges(): void {
    if (this.config) {
      this.rows = this.prayer.getToday(this.config);
    }
  }
}
