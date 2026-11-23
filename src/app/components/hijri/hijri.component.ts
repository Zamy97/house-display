import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { HijriService } from '../../core/services/hijri.service';

@Component({
  selector: 'app-hijri',
  standalone: true,
  template: `
    <section class="hijri-panel">
      <div class="value">{{ value }}</div>
    </section>
  `,
  styleUrl: './hijri.component.scss',
})
export class HijriComponent implements OnInit, OnChanges, OnDestroy {
  @Input() locale = 'en-US';
  value = '';
  private timer?: number;
  private dateKey = '';

  constructor(private readonly hijri: HijriService) {}

  ngOnInit(): void {
    this.apply(new Date());
    this.hijri.ensureCalendar().subscribe(() => this.apply(new Date()));
    this.timer = window.setInterval(() => this.onMinute(), 60_000);
  }

  ngOnChanges(): void {
    if (this.dateKey) this.apply(new Date());
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  private onMinute(): void {
    const now = new Date();
    const key = this.dayKey(now);
    if (key === this.dateKey) return;
    this.hijri.refresh().subscribe(() => this.apply(now));
  }

  private apply(date: Date): void {
    this.dateKey = this.dayKey(date);
    this.value = this.hijri.format(date, this.locale);
  }

  private dayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
}
