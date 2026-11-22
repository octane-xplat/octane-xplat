// Borrowed from NativeScript/NativeScript PR #11089: packages/core/color/index.macos.ts
import { ColorBase } from '@nativescript/core/color/color-common';
export class Color extends ColorBase {
    _macos = undefined;
    // `ios` stays undefined — shared code branches on color.ios and would
    // treat an NSColor as a UIColor. Use `macos` for the AppKit value.
    get ios() {
        return undefined;
    }
    get macos() {
        if (!this._macos) {
            this._macos = NSColor.colorWithSRGBRedGreenBlueAlpha(this.r / 255, this.g / 255, this.b / 255, this.a / 255);
        }
        return this._macos;
    }
    static fromIosColor(value) {
        if (!value) {
            return null;
        }
        const r = Math.round((value.redComponent ?? 0) * 255);
        const g = Math.round((value.greenComponent ?? 0) * 255);
        const b = Math.round((value.blueComponent ?? 0) * 255);
        const a = Math.round((value.alphaComponent ?? 1) * 255);
        return new Color(a, r, g, b);
    }
}
