import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="panel clock-panel">
      <div class="date">{{ now | date: 'EEEE, MMMM d, y' }}</div>
      <div class="time">
        {{ now | date: timeFormat === 12 ? 'h:mm' : 'HH:mm' }}<span class="secs">:{{ now | date: 'ss' }}</span>@if (timeFormat === 12) { {{ now | date: 'a' }} }
      </div>
    </section>
  `,
  styleUrl: './clock.component.scss',
})
export class ClockComponent implements OnInit, OnDestroy {
  @Input() timeFormat: 12 | 24 = 12;
  now = new Date();
  private timer?: number;

  ngOnInit(): void {
    this.timer = window.setInterval(() => (this.now = new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
