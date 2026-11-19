import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { PrayerRow, PrayerService } from '../../core/services/prayer.service';
import { HouseConfig } from '../../core/models/house-config';

@Component({
  selector: 'app-prayer',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Today</h2>
      <table>
        @for (row of rows; track row.name) {
          <tr [class.current]="row.name === current">
            <td>{{ row.name }}</td>
            <td class="time">{{ row.time }}</td>
          </tr>
        }
      </table>
    </section>
  `,
  styleUrl: './prayer.component.scss',
})
export class PrayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) config!: HouseConfig;
  rows: PrayerRow[] = [];
  current = '';
  private timer?: number;

  constructor(private readonly prayer: PrayerService) {}

  ngOnInit(): void {
    this.timer = window.setInterval(() => this.refreshCurrent(), 30000);
  }

  ngOnChanges(): void {
    if (!this.config) return;
    this.rows = this.prayer.getToday(this.config);
    this.refreshCurrent();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private refreshCurrent(): void {
    this.current = this.prayer.getCurrentName(this.rows);
  }
}
