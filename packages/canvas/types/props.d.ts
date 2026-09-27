export type CanvasContextKind = '2d' | 'webgl' | 'webgl2' | 'webgpu' | 'bitmaprenderer';
export interface CanvasReady {
    /** HTMLCanvasElement on web, the plugin's Canvas view on native —
     *  both expose `getContext()`. */
    canvas: any;
    /** The resolved context for the `context` prop, or null when that
     *  kind is unsupported/unavailable. WebGPU still needs a device —
     *  `getGPU()` normalizes adapter/device acquisition. */
    context: any;
}
export interface CanvasProps {
    className?: any;
    style?: any;
    id?: string;
    /** Context kind resolved before `onReady` fires. Omit to defer
     *  `getContext` to user code (only one kind per canvas — call once). */
    context?: CanvasContextKind;
    /** Web: after mount. Native: the plugin's `ready` event (fires when the
     *  GPU surface exists — earlier `getContext` calls can return null). */
    onReady?: (ready: CanvasReady) => void;
    /** Numeric values map to the element's width/height — on web that is
     *  the canvas *drawing buffer* size (pair with style for display
     *  size), on native dip size. */
    width?: string | number;
    height?: string | number;
}
