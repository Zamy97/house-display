declare class Skycons {
  constructor(options?: {
    monochrome?: boolean;
    color?: string;
    resizeClear?: boolean;
    colors?: Record<string, string>;
  });
  add(element: HTMLCanvasElement | string, icon: string): void;
  set(element: HTMLCanvasElement | string, icon: string): void;
  remove(element: HTMLCanvasElement | string): void;
  play(): void;
  pause(): void;
}
