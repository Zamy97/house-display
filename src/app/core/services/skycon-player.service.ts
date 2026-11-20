import { Injectable } from '@angular/core';

/** One shared Skycons loop, matching the Magic Mirror module. */
@Injectable({ providedIn: 'root' })
export class SkyconPlayer {
  private skycons?: Skycons;

  private engine(): Skycons {
    if (!this.skycons) {
      this.skycons = new Skycons({
        monochrome: false,
        colors: {
          main: '#FFFFFF',
          moon: '#FFFDC2',
          fog: '#FFFFFF',
          fogbank: '#FFFFFF',
          cloud: '#BEBEBE',
          snow: '#FFFFFF',
          leaf: '#98D24D',
          rain: '#7CD5FF',
          sun: '#FFD550',
        },
      });
      this.skycons.play();
    }
    return this.skycons;
  }

  mount(canvas: HTMLCanvasElement, icon: string): void {
    this.engine().add(canvas, icon);
  }

  update(canvas: HTMLCanvasElement, icon: string): void {
    this.engine().set(canvas, icon);
  }

  unmount(canvas: HTMLCanvasElement): void {
    this.skycons?.remove(canvas);
  }
}
