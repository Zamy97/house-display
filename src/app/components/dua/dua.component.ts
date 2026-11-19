import { Component, Input, OnChanges } from '@angular/core';
import { ContentService, DuaItem } from '../../core/services/content.service';

@Component({
  selector: 'app-dua',
  standalone: true,
  template: `
    <section class="panel content-panel">
      <h2>Dua of the Day</h2>
      @if (dua; as d) {
        @if (d.arabic) {
          <div class="arabic">{{ d.arabic }}</div>
        }
        @if (d.transliteration) {
          <div class="transliteration">{{ d.transliteration }}</div>
        }
        @if (d.text) {
          <div class="translation">{{ d.text }}</div>
        }
        @if (preferBn && d.textBn) {
          <div class="bangla">{{ d.textBn }}</div>
        }
        @if (d.repeat && d.repeat > 1) {
          <div class="repeat">Repeat {{ d.repeat }}x</div>
        }
        @if (d.reference) {
          <div class="ref">{{ d.reference }}</div>
        }
      }
    </section>
  `,
  styleUrl: './dua.component.scss',
})
export class DuaComponent implements OnChanges {
  @Input() preferBn = false;
  dua: DuaItem | null = null;

  constructor(private readonly content: ContentService) {}

  ngOnChanges(): void {
    this.content.pickDua(this.preferBn).subscribe((d) => (this.dua = d));
  }
}
