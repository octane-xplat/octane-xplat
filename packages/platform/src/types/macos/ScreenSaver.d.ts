import type { NSWindow } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type { interop } from './objc-runtime'

import { NSBackingStoreType, NSView } from './AppKit'

import { NSUserDefaults } from './Foundation'



export declare class ScreenSaverView extends NSView {
  static backingStoreType(): interop.Enum<typeof NSBackingStoreType>;

  static performGammaFade(): boolean;

  initWithFrameIsPreview(frame: CGRect, isPreview: boolean): this;

  animationTimeInterval: number;

  startAnimation(): void;

  stopAnimation(): void;

  readonly animating: boolean;

  drawRect(dirtyRect: CGRect): void;
  drawRect(rect: CGRect): void;

  animateOneFrame(): void;

  readonly hasConfigureSheet: boolean;

  readonly configureSheet: NSWindow | null;

  readonly preview: boolean;

  isAnimating(): boolean;

  isPreview(): boolean;
}

export declare class ScreenSaverDefaults extends NSUserDefaults {
  static defaultsForModuleWithName<This extends abstract new (...args: any) => any>(this: This, inModuleName: string): InstanceType<This>;
}
