// Borrowed from NativeScript/NativeScript PR #11089: packages/core/ui/styling/font.macos.ts
import { Font as FontBase, FontStyle, FontVariationSettings, FontWeight, parseFont } from '@nativescript/core/ui/styling/font-common';
export { FontStyle, FontVariationSettings, FontWeight, parseFont };
export class Font extends FontBase {
    static default = new Font(undefined, undefined);
    constructor(family, size, style, weight, scale, variationSettings) {
        super(family, size, style, weight, scale, variationSettings);
    }
    withFontFamily(family) {
        return new Font(family, this.fontSize, this.fontStyle, this.fontWeight, this.fontScale, this.fontVariationSettings);
    }
    withFontStyle(style) {
        return new Font(this.fontFamily, this.fontSize, style, this.fontWeight, this.fontScale, this.fontVariationSettings);
    }
    withFontWeight(weight) {
        return new Font(this.fontFamily, this.fontSize, this.fontStyle, weight, this.fontScale, this.fontVariationSettings);
    }
    withFontSize(size) {
        return new Font(this.fontFamily, size, this.fontStyle, this.fontWeight, this.fontScale, this.fontVariationSettings);
    }
    withFontScale(scale) {
        return new Font(this.fontFamily, this.fontSize, this.fontStyle, this.fontWeight, scale, this.fontVariationSettings);
    }
    withFontVariationSettings(variationSettings) {
        return new Font(this.fontFamily, this.fontSize, this.fontStyle, this.fontWeight, this.fontScale, variationSettings);
    }
    getUIFont(defaultFont) {
        return defaultFont;
    }
    getAndroidTypeface() {
        return undefined;
    }
}
export const ios = {
    registerFont(_fontFile) { },
};
