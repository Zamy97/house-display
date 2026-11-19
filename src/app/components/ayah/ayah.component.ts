import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ContentService, AyahItem } from '../../core/services/content.service';

@Component({
  selector: 'app-ayah',
  standalone: true,
  template: `
    <section class="ayah-panel">
      @if (ayah; as a) {
        <div class="arabic">{{ a.arabic }}</div>
        <div class="translation">
          {{ a.translation }} (QS. {{ a.surahNameEnglish }}:{{ a.ayahNumberInSurah }})
        </div>
      }
    </section>
  `,
  styleUrl: './ayah.component.scss',
})
export class AyahComponent implements OnInit, OnDestroy {
  @Input() intervalMs = 300000;
  ayah: AyahItem | null = null;
  private timer?: number;

  constructor(private readonly content: ContentService) {}

  ngOnInit(): void {
    this.refresh();
    this.timer = window.setInterval(() => this.refresh(), this.intervalMs);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private refresh(): void {
    this.content.pickAyah('random').subscribe((a) => (this.ayah = a));
  }
}
