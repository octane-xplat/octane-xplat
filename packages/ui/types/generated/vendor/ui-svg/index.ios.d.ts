import { File, ImageAsset } from '@nativescript/core';
import { SVGView as SVGViewBase, srcProperty, stretchProperty } from './index.common.js';
export declare function getSVGKImage(src: string | ImageAsset | File): SVGKImage | null;
export declare class SVGView extends SVGViewBase {
    [srcProperty.setNative]: (value: any) => void;
    [stretchProperty.setNative]: (value: "none" | "aspectFill" | "aspectFit" | "fill") => void;
    aspectRatio: number;
    _imageSourceAffectsLayout: boolean;
    createNativeView(): SVGKFastImageView;
    _setNativeClipToBounds(): void;
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    handleSrc(src: any): Promise<void>;
}
