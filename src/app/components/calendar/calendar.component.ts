import { Component, OnDestroy, OnInit } from '@angular/core';

type DayCell = {
  day: number | null;
  today: boolean;
};

@Component({
  selector: 'app-calendar',
  standalone: true,
  template: `
    <section class="panel calendar-panel">
      <h2>{{ title }}</h2>
      <div class="weekdays">
        @for (d of weekdays; track d) {
          <span>{{ d }}</span>
        }
      </div>
      <div class="grid">
        @for (cell of cells; track $index) {
          <span class="day" [class.empty]="!cell.day" [class.today]="cell.today">
            {{ cell.day || '' }}
          </span>
        }
      </div>
    </section>
  `,
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit, OnDestroy {
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  title = '';
  cells: DayCell[] = [];
  private timer?: number;

  ngOnInit(): void {
    this.build();
    this.timer = window.setInterval(() => this.build(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private build(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    this.title = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const cells: DayCell[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, today: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, today: d === today });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, today: false });
    this.cells = cells;
  }
}
