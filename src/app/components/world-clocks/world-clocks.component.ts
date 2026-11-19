import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { WorldClock } from '../../core/models/house-config';

@Component({
  selector: 'app-world-clocks',
  standalone: true,
  template: `
    <section class="panel">
      <div class="grid">
        @for (row of rows; track row.title) {
          <div class="cell">
            <div class="zone">{{ row.title }}</div>
            <div class="time">{{ row.time }}</div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './world-clocks.component.scss',
})
export class WorldClocksComponent implements OnInit, OnChanges, OnDestroy {
  @Input() clocks: WorldClock[] = [];
  @Input() timeFormat: 12 | 24 = 12;
  rows: { title: string; time: string }[] = [];
  private timer?: number;

  ngOnInit(): void {
    this.refresh();
    this.timer = window.setInterval(() => this.refresh(), 30000);
  }

  ngOnChanges(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private refresh(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: this.timeFormat === 12,
    };
    this.rows = (this.clocks || []).map((clock) => ({
      title: clock.title,
      time: new Intl.DateTimeFormat('en-US', {
        ...options,
        timeZone: clock.timezone,
      }).format(now),
    }));
  }
}
