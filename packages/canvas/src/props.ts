import type { ClassValue, CSSProperties } from 'octane/jsx-runtime'

/** Canvas context kinds; availability is per platform — 'webgpu' resolves
 *  through the plugin shim on iOS, Android, and Windows and `navigator.gpu` on web,
 *  'bitmaprenderer' availability varies by backend, and AppKit resolves no kind at all. */
export type CanvasContextKind = '2d' | 'webgl' | 'webgl2' | 'webgpu' | 'bitmaprenderer'

/** Payload passed to onReady once the canvas element exists. */
export interface CanvasReady {
  /** HTMLCanvasElement on web, the plugin's Canvas view on iOS, Android, and Windows.
   *  AppKit supplies an unavailable handle whose `getContext()` always
   *  returns null; it is not a native drawing surface. */
  canvas: any
  /** The resolved context for the `context` prop, or null when that
   *  kind is unsupported/unavailable. WebGPU still needs a device —
   *  `getGPU()` normalizes adapter/device acquisition. */
  context: any
}

/** Props for the `<Canvas>` element. */
export interface CanvasProps {
  /** clsx-style class list applied to the canvas element. */
  className?: ClassValue
  /** Inline style: CSS text or a camelCase style object. */
  style?: string | CSSProperties
  /** Element id passed through to the host element. */
  id?: string
  /** Context kind resolved before `onReady` fires. Omit to defer
   *  `getContext` to user code (only one kind per canvas — call once). */
  context?: CanvasContextKind
  /** Web: after mount. iOS, Android, and Windows: the plugin's `ready` event (earlier
   *  `getContext` calls can return null). AppKit: after the neutral frame
   *  mounts, with context null. This callback does not guarantee drawing
   *  or GPU readiness; check context or call canvas.getContext first. */
  onReady?: (ready: CanvasReady) => void
  /** Numeric values map to the element's width/height — on web that is
   *  the canvas *drawing buffer* size (pair with style for display
   *  size). On Windows, a number sets the layout width in DIP and the
   *  drawing-buffer width. Style can override the layout width. */
  width?: string | number
  /** Same contract as `width`: numbers set the drawing-buffer height on web
   *  and layout height in DIP plus drawing-buffer height on Windows. */
  height?: string | number
}
