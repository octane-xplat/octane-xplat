import type { SliderProps } from './props.js';
/**  Self-drawn slider — grid host with track + fill + thumb, identical
 *  pixels across targets. Drag anywhere on the widget adjusts value by
 *  delta (no jump-to-tap v1). The platform widget (UISlider/SeekBar)
 *  lives in `ui/ios` + `ui/android`. */
export declare function Slider(props: SliderProps): unknown;
