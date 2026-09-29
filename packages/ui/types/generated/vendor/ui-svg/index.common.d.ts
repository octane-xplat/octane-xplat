import { File, ImageAsset, Property, View } from '@nativescript/core';
export type Stretch = 'none' | 'fill' | 'aspectFill' | 'aspectFit';
export declare const srcProperty: Property<SVGView, string | ImageAsset | File>;
export declare const stretchProperty: Property<SVGView, Stretch>;
export declare class SVGView extends View {
    src: string;
}
