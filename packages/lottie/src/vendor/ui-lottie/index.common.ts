/**********************************************************************************
 * (c) 2017, Nathan Walker.
 * Licensed under the MIT license.
 *
 * Version 1.0.0                                           walkerrunpdx@gmail.com
 **********************************************************************************/

// Vendored from @nativescript-community/ui-lottie (MIT), fork branch
// xplat-fixes on octane-xplat/ui-lottie — device-probed fixes for dead
// sync-src, missing events/pause-resume, URL/.lottie sources, async
// autoPlay, completion dedupe, opacity scale, Podfile pin.
// @ts-nocheck — vendored upstream code, not strict-clean. Kept
// close to the fork so fix branches stay PR-able; divergences are
// commented inline.
import { CoreTypes, Property, View, booleanConverter } from '@nativescript/core';
// KeyPathColors lives here — upstream's `from '.'` self-import
// doesn't resolve in a vendored layout.
export interface KeyPathColors {
    [k: string]: Color | string;
}

export class LottieViewBase extends View {
    public static compositionLoadedEvent = 'compositionLoaded';
    public static loadFailedEvent = 'loadFailed';
    // `declare`, not plain fields — under useDefineForClassFields (esbuild/
    // rolldown, es2022+) plain declarations emit instance fields that shadow
    // the Property accessors register() installs, silently breaking every
    // property set. Upstream's tsc emit never hit this; vendored fork fix.
    public declare stretch: CoreTypes.ImageStretchType;
    public declare async: boolean;
    public declare src: string;
    public declare loop: boolean;
    public declare autoPlay: boolean;
    public declare progress: number;
    public declare keyPathColors: KeyPathColors;
    public declare completionBlock: (animationFinished: boolean) => void;
}

export const srcProperty = new Property<LottieViewBase, string>({
    name: 'src'
});
srcProperty.register(LottieViewBase);

export const asyncProperty = new Property<LottieViewBase, boolean>({
    name: 'async',
    defaultValue: false,
    valueConverter: booleanConverter
});
asyncProperty.register(LottieViewBase);
export const loopProperty = new Property<LottieViewBase, boolean>({
    name: 'loop',
    defaultValue: false,
    valueConverter: booleanConverter
});
loopProperty.register(LottieViewBase);

export const autoPlayProperty = new Property<LottieViewBase, boolean>({
    name: 'autoPlay',
    defaultValue: false,
    valueConverter: booleanConverter
});
autoPlayProperty.register(LottieViewBase);

export const renderModeProperty = new Property<LottieViewBase, number>({
    name: 'renderMode'
});
renderModeProperty.register(LottieViewBase);

export const progressProperty = new Property<LottieViewBase, number>({
    name: 'progress'
});
progressProperty.register(LottieViewBase);

export const stretchProperty = new Property<LottieViewBase, CoreTypes.ImageStretchType>({
    name: 'stretch',
    defaultValue: 'aspectFit',
    affectsLayout: global.isIOS
});
stretchProperty.register(LottieViewBase);

export const keyPathColorsProperty = new Property<LottieViewBase, KeyPathColors>({
    name: 'keyPathColors'
});
keyPathColorsProperty.register(LottieViewBase);
