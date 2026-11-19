import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-wifi',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Wi‑Fi</h2>
      @if (ssid) {
        <div class="ssid">{{ ssid }}</div>
        @if (showPassword && password) {
          <div class="password">{{ password }}</div>
        }
        <div class="hint">Scan / join network on this SSID</div>
      } @else {
        <div class="muted">Set SSID in Settings</div>
      }
    </section>
  `,
  styleUrl: './wifi.component.scss',
})
export class WifiComponent implements OnChanges {
  @Input() ssid = '';
  @Input() password = '';
  @Input() showPassword = false;

  ngOnChanges(): void {
    // placeholder for future QR generation
  }
}
