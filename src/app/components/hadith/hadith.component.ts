import { Component, Input, OnChanges } from '@angular/core';
import { ContentService, HadithItem } from '../../core/services/content.service';

@Component({
  selector: 'app-hadith',
  standalone: true,
  template: `
    <section class="panel content-panel">
      <h2>Hadith of the Day</h2>
      @if (hadith; as h) {
        <div class="text">{{ h.text }}</div>
        @if (h.textBn) {
          <div class="bangla">{{ h.textBn }}</div>
        }
        @if (h.reference) {
          <div class="ref">{{ h.reference }}</div>
        }
      }
    </section>
  `,
  styleUrl: './hadith.component.scss',
})
export class HadithComponent implements OnChanges {
  @Input() mode: 'daily' | 'random' = 'daily';
  hadith: HadithItem | null = null;

  constructor(private readonly content: ContentService) {}

  ngOnChanges(): void {
    this.content.pickHadith(this.mode).subscribe((h) => (this.hadith = h));
  }
}
