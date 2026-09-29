import type { AnimatedImageProps } from './props.js';
/**  AnimatedImage — GIF/animated-webp decode + autoplay via ui-image. `src`
 *  takes the Img grammar: remote URL, res://name, ~/bundle path, file path.
 *  There is intentionally no play/pause prop — <img> can't pause on web, so
 *  the shared contract is always-playing. */
export declare function AnimatedImage(props: AnimatedImageProps): unknown;
