import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-wifi',
  standalone: true,
  template: `
    <section class="panel">
      @if (ssid) {
        @if (qrUrl) {
          <img class="qr" [src]="qrUrl" alt="Wi‑Fi QR" width="120" height="120" />
        }
        <div class="ssid">{{ ssid }}</div>
        @if (showPassword && password) {
          <div class="password">{{ password }}</div>
        }
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
  qrUrl = '';

  ngOnChanges(): void {
    if (!this.ssid) {
      this.qrUrl = '';
      return;
    }
    const payload = `WIFI:T:WPA;S:${this.escape(this.ssid)};P:${this.escape(this.password || '')};;`;
    this.qrUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=120x120&bgcolor=000000&color=eaf6ff&data=` +
      encodeURIComponent(payload);
  }

  private escape(value: string): string {
    return value.replace(/([\\;,:"])/g, '\\$1');
  }
}
