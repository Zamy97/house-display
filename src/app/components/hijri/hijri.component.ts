import { Component, Input, OnChanges } from '@angular/core';
import { HijriService } from '../../core/services/hijri.service';

@Component({
  selector: 'app-hijri',
  standalone: true,
  template: `
    <section class="panel hijri-panel">
      <div class="label">Islamic Date</div>
      <div class="value">{{ value }}</div>
    </section>
  `,
  styleUrl: './hijri.component.scss',
})
export class HijriComponent implements OnChanges {
  @Input() locale = 'en-US';
  value = '';

  constructor(private readonly hijri: HijriService) {}

  ngOnChanges(): void {
    this.value = this.hijri.format(new Date(), this.locale);
  }
}
