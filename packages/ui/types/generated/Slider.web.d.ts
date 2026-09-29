import type { SliderProps } from './props.js';
/**  Self-drawn slider — track + fill + thumb in a relative host, identical
 *  pixels across targets. Drag anywhere on the widget adjusts value by
 *  delta (no jump-to-tap v1). The platform widget (UISlider/SeekBar)
 *  lives in `ui/ios` + `ui/android`. */
export declare function Slider(props: SliderProps): import("octane/jsx-runtime").JSX.Element;
