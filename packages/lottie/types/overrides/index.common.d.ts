/**********************************************************************************
 * (c) 2017, Nathan Walker.
 * Licensed under the MIT license.
 *
 * Version 1.0.0                                           walkerrunpdx@gmail.com
 **********************************************************************************/
import { CoreTypes, Property, View } from '@nativescript/core';
export interface KeyPathColors {
    [k: string]: Color | string;
}
export declare class LottieViewBase extends View {
    static compositionLoadedEvent: string;
    static loadFailedEvent: string;
    stretch: CoreTypes.ImageStretchType;
    async: boolean;
    src: string;
    loop: boolean;
    autoPlay: boolean;
    progress: number;
    keyPathColors: KeyPathColors;
    completionBlock: (animationFinished: boolean) => void;
}
export declare const srcProperty: Property<LottieViewBase, string>;
export declare const asyncProperty: Property<LottieViewBase, boolean>;
export declare const loopProperty: Property<LottieViewBase, boolean>;
export declare const autoPlayProperty: Property<LottieViewBase, boolean>;
export declare const renderModeProperty: Property<LottieViewBase, number>;
export declare const progressProperty: Property<LottieViewBase, number>;
export declare const stretchProperty: Property<LottieViewBase, CoreTypes.ImageStretchType>;
export declare const keyPathColorsProperty: Property<LottieViewBase, KeyPathColors>;
