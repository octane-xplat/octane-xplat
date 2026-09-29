import type { NativeModifier, NativeModifierValue } from './props.js';
type StyleValues = Extract<NativeModifier, {
    type: 'style';
}>['values'];
/** Serializable modifier factories for the platform-authentic UI subpaths. */
export declare const modifier: {
    background: (color: string) => NativeModifier;
    cornerRadius: (radius: number) => NativeModifier;
    opacity: (value: number) => NativeModifier;
    padding: (value: number | string) => NativeModifier;
    frame: (width: number | string, height: number | string) => NativeModifier;
    style: (values: StyleValues) => NativeModifier;
    nativeProperty: (name: string, value: NativeModifierValue) => NativeModifier;
};
export {};
