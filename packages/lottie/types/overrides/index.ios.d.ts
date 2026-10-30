/**********************************************************************************
 * (c) 2017, Nathan Walker.
 * Licensed under the MIT license.
 *
 * Version 1.0.0                                           walkerrunpdx@gmail.com
 **********************************************************************************/
import { Color } from '@nativescript/core';
import { LottieViewBase, autoPlayProperty, keyPathColorsProperty, loopProperty, progressProperty, srcProperty, stretchProperty } from './index.common';
export declare class LottieView extends LottieViewBase {
    [keyPathColorsProperty.setNative]: (value: any) => void;
    [srcProperty.setNative]: (src: string) => void;
    [loopProperty.setNative]: (loop: boolean) => void;
    [autoPlayProperty.setNative]: (autoPlay: boolean) => void;
    [progressProperty.setNative]: (value: number) => void;
    [stretchProperty.setNative]: (value: "none" | "aspectFill" | "aspectFit" | "fill") => void;
    nativeViewProtected: CompatibleAnimationView;
    private _imageSourceAffectsLayout;
    createNativeView(): CompatibleAnimationView;
    initNativeView(): void;
    onLoaded(): void;
    setColor(value: Color, keyPath: string[]): void;
    setOpacity(value: number, keyPath: string[]): void;
    playAnimation(): void;
    playAnimationFromProgressToProgress(startProgress: number, endProgress: number): void;
    cancelAnimation(): void;
    pauseAnimation(): void;
    resumeAnimation(): void;
    isAnimating(): boolean;
    set speed(value: number);
    get speed(): number | undefined;
    get duration(): number | undefined;
    set contentMode(mode: any);
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    private static computeScaleFactor;
}
