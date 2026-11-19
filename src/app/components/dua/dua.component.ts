import { Component, Input, OnChanges } from '@angular/core';
import { ContentService, DuaItem } from '../../core/services/content.service';

@Component({
  selector: 'app-dua',
  standalone: true,
  template: `
    <section class="panel content-panel">
      <h2>Dua</h2>
      @if (dua; as d) {
        <div class="title">{{ title }}</div>
        @if (d.arabic) {
          <div class="arabic">{{ d.arabic }}</div>
        }
        <div class="translation">{{ translation }}</div>
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

  get translation(): string {
    if (!this.dua) return '';
    if (this.preferBn && this.dua.textBn) return this.dua.textBn;
    return this.dua.text || '';
  }

  get title(): string {
    if (!this.dua) return '';
    if (this.preferBn && this.dua.titleBn) return this.dua.titleBn;
    return this.dua.title || '';
  }

  ngOnChanges(): void {
    this.content.pickDua(this.preferBn).subscribe((d) => (this.dua = d));
  }
}
