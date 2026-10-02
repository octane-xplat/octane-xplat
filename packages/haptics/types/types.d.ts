export type HapticPreset = 'selection' | 'impact-light' | 'impact-medium' | 'impact-heavy' | 'success' | 'warning' | 'error';
export type HapticPoint = {
    at: number;
    intensity: number;
    sharpness?: number;
};
export type HapticPattern = {
    duration: number;
    points: readonly HapticPoint[];
};
export type HapticsCapabilities = {
    supported: boolean;
    presets: boolean;
    patterns: boolean;
    realtime: boolean;
    reason?: string;
};
export type HapticSession = {
    update(intensity: number, sharpness?: number): void;
    stop(): void;
};
export interface Haptics {
    capabilities(): HapticsCapabilities;
    play(preset: HapticPreset): boolean;
    playPattern(pattern: HapticPattern): boolean;
    startRealtime(intensity?: number, sharpness?: number): HapticSession;
    stop(): void;
    dispose(): void;
}
export declare function createHaptics(): Haptics;
/** Optional capability — never throws for absence (docs/platform/platform-services.md). */
export interface Capability<T> {
    supported: boolean;
    ensure(): Promise<'granted' | 'denied' | 'unsupported'>;
    /** usable iff supported && ensured */
    impl: T | null;
}
export interface HapticsImpl {
    impact(style?: 'light' | 'medium' | 'heavy'): void;
    notification(kind: 'success' | 'warning' | 'error'): void;
    selection(): void;
}
export declare const haptics: Capability<HapticsImpl>;
