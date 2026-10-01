export interface LayoutChildProps {
    row?: number;
    col?: number;
    rowSpan?: number;
    colSpan?: number;
    dock?: 'left' | 'top' | 'right' | 'bottom';
    left?: number;
    top?: number;
    flexGrow?: number;
    flexShrink?: number;
    alignSelf?: string;
    order?: number;
}
/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
 *  to the host flexboxlayout natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only. */
export interface FlexContainerProps {
    justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
}
export type Role = 'button' | 'link' | 'search' | 'image' | 'heading' | 'adjustable' | 'summary' | 'text' | 'none' | 'progressbar' | 'checkbox' | 'switch' | 'radio' | 'spinbutton' | 'tab';
export interface AccessibilityProps {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: Role;
    accessibilityHint?: string;
    accessibilityValue?: string;
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean;
    };
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
}
export type LottieFit = 'contain' | 'cover' | 'fill';
export interface LottieEvent {
    /** Animation duration in milliseconds once loaded (0 before then). */
    duration?: number;
    /** Failure description. */
    message?: string;
}
export interface LottieHandle {
    play(): void;
    pause(): void;
    /** Stop and reset the playhead to the start. */
    stop(): void;
    /** Seek to a normalized position, 0..1. */
    seekTo(progress: number): void;
    /** Playback speed multiplier (1 = normal). */
    setSpeed(n: number): void;
    /** Current playhead position, 0..1. */
    progress(): number;
    /** Animation duration in milliseconds (0 before load). */
    duration(): number;
    isPlaying(): boolean;
    /** The platform surface (lottie-web AnimationItem / plugin LottieView). */
    native: any;
}
/** Lottie animation — lottie-web (svg renderer) on web, vendored
 *  ui-lottie (`src/vendor/ui-lottie`, fork `xplat-fixes`) on native.
 *  Progress is always normalized 0..1 and durations are milliseconds on
 *  every platform (the native plugin reports seconds on iOS). */
export interface LottieProps extends LayoutChildProps, AccessibilityProps {
    className?: any;
    style?: any;
    id?: string;
    /** Remote URL; native also accepts `~/` bundle paths, absolute file
     *  paths, `res://` names, `.lottie`/`.zip` containers, and raw JSON
     *  strings starting with `{`. */
    src?: string;
    /** Inline animation object — wins over `src` when both are given. */
    data?: object;
    /** Start playing as soon as the composition loads. Default true —
     *  matches lottie-web; the native plugin's own default is false. */
    autoPlay?: boolean;
    /** Repeat forever. Default false — a finite play is the least
     *  surprising shared contract (lottie-web's own default is true). */
    loop?: boolean;
    /** Controlled playback — leave unset for uncontrolled play. */
    playing?: boolean;
    /** Controlled playhead position, 0..1. */
    progress?: number;
    /** Playback speed multiplier (1 = normal). */
    speed?: number;
    /** Content fitting inside the frame: `contain` (letterbox, default),
     *  `cover` (crop to fill), `fill` (stretch). */
    fit?: LottieFit;
    /** Composition parsed and ready — `e.duration` is the length in ms. */
    onLoaded?: (e: LottieEvent) => void;
    /** Reached the end; does not fire per loop iteration. */
    onEnded?: () => void;
    /** Load or parse failure. */
    onError?: (e: LottieEvent) => void;
    /** Imperative handle — play/pause/seek plus `native` for anything the
     *  shared props don't cover. */
    bind?: (h: LottieHandle) => void;
    /** Platform escape hatches, applied after the shared props. */
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
