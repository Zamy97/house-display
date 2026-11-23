import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
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
export class HadithComponent implements OnChanges, OnDestroy {
  @Input() mode: 'daily' | 'random' = 'daily';
  hadith: HadithItem | null = null;
  private timer?: number;

  constructor(private readonly content: ContentService) {}

  ngOnChanges(): void {
    this.refresh(true);
    if (!this.timer) {
      this.timer = window.setInterval(() => this.refresh(false), 60_000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  private refresh(force: boolean): void {
    if (!force && this.mode === 'random') return;
    this.content.pickHadith(this.mode).subscribe((h) => {
      if (h?.text === this.hadith?.text && h?.reference === this.hadith?.reference) return;
      this.hadith = h;
    });
  }
}
