import type { NativeModifier } from './props.js';
/** Apply the matching native escape-hatch bag after the primitive's props. */
export declare function applyNativeProps(el: any, props: {
    ios?: Record<string, any>;
    android?: Record<string, any>;
    modifiers?: readonly NativeModifier[];
}): void;
