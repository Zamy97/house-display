import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { SkyconPlayer } from '../../core/services/skycon-player.service';

/** OpenWeather icon ids → Skycon names. Storms use the rain drawing; Skycons has no lightning. */
const SKYCON_NAMES: Record<string, string> = {
  '01d': 'clear-day',
  '01n': 'clear-night',
  '02d': 'partly-cloudy-day',
  '02n': 'partly-cloudy-night',
  '03d': 'cloudy',
  '03n': 'cloudy',
  '04d': 'cloudy',
  '04n': 'cloudy',
  '09d': 'rain',
  '09n': 'rain',
  '10d': 'rain',
  '10n': 'rain',
  '11d': 'rain',
  '11n': 'rain',
  '13d': 'snow',
  '13n': 'snow',
  '50d': 'fog',
  '50n': 'fog',
};

@Component({
  selector: 'app-skycon',
  standalone: true,
  template: `
    <canvas #canvas role="img" [attr.aria-label]="label"></canvas>
  `,
  styles: `
    :host {
      display: block;
      line-height: 0;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class SkyconComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() code = '01d';
  @Input() label = '';
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private mounted = false;
  private resize?: ResizeObserver;

  constructor(private readonly player: SkyconPlayer) {}

  ngAfterViewInit(): void {
    this.fit();
    this.player.mount(this.canvas, this.name());
    this.mounted = true;
    const host = this.canvas.parentElement;
    if (host && typeof ResizeObserver !== 'undefined') {
      this.resize = new ResizeObserver(() => this.fit());
      this.resize.observe(host);
    }
  }

  ngOnChanges(): void {
    if (!this.mounted) return;
    this.player.update(this.canvas, this.name());
  }

  ngOnDestroy(): void {
    this.resize?.disconnect();
    if (this.mounted) this.player.unmount(this.canvas);
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private name(): string {
    return SKYCON_NAMES[this.code] ?? 'cloudy';
  }

  private fit(): void {
    const canvas = this.canvas;
    const host = canvas.parentElement;
    const css = host?.clientWidth || host?.clientHeight || 0;
    if (!css) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(1, Math.round(css * dpr));
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
  }
}
