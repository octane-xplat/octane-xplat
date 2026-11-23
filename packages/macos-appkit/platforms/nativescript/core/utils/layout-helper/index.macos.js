// Borrowed from NativeScript/NativeScript PR #11089: packages/core/utils/layout-helper/index.macos.ts
import * as layoutCommon from '@nativescript/core/utils/layout-helper/layout-helper-common';
let screenClass;
let lastScreenScale = 1;
function getMainScreenScale() {
    // Global class reads enter the bridge on every lookup. Keep the class
    // handle and read the current screen and scale for each conversion.
    try {
        screenClass ??= NSScreen;
        const scale = screenClass.mainScreen?.backingScaleFactor;
        if (Number.isFinite(scale) && scale > 0) {
            lastScreenScale = scale;
        }
    } catch (error) {
        // The Intel bridge can temporarily return a stale native screen handle.
        // Retry discovery on the next conversion and keep the last known density.
        if (!String(error).includes('no native counterpart to the JavaScript object')) {
            throw error;
        }
        screenClass = undefined;
    }
    return lastScreenScale;
}
export const layout = {
    MODE_SHIFT: 30,
    MODE_MASK: 0x3 << 30,
    UNSPECIFIED: 0 << 30,
    EXACTLY: 1 << 30,
    AT_MOST: 2 << 30,
    MEASURED_HEIGHT_STATE_SHIFT: 0x00000010,
    MEASURED_STATE_TOO_SMALL: 0x01000000,
    MEASURED_STATE_MASK: 0xff000000,
    MEASURED_SIZE_MASK: 0x00ffffff,
    getMode(mode) {
        return layoutCommon.getMode(mode);
    },
    getMeasureSpecMode(spec) {
        return layoutCommon.getMeasureSpecMode(spec);
    },
    getMeasureSpecSize(spec) {
        return layoutCommon.getMeasureSpecSize(spec);
    },
    makeMeasureSpec(size, mode) {
        return (Math.round(Math.max(0, size)) & ~this.MODE_MASK) | (mode & this.MODE_MASK);
    },
    hasRtlSupport() {
        return true;
    },
    getDisplayDensity() {
        return getMainScreenScale();
    },
    toDevicePixels(value) {
        return value * getMainScreenScale();
    },
    toDeviceIndependentPixels(value) {
        return value / getMainScreenScale();
    },
    round(value) {
        return layoutCommon.round(value);
    },
    measureNativeView(nativeView, width, widthMode, height, heightMode) {
        const fittingSize = nativeView && nativeView.fittingSize;
        const intrinsic = nativeView && nativeView.intrinsicContentSize;
        const natural = fittingSize && fittingSize.width >= 0 ? fittingSize : intrinsic;
        const measuredWidth = widthMode === this.EXACTLY ? width : this.toDevicePixels(natural && natural.width >= 0 ? natural.width : 0);
        const measuredHeight = heightMode === this.EXACTLY ? height : this.toDevicePixels(natural && natural.height >= 0 ? natural.height : 0);
        return {
            width: this.round(measuredWidth),
            height: this.round(measuredHeight),
        };
    },
    measureSpecToString(measureSpec) {
        return layoutCommon.measureSpecToString(measureSpec);
    },
};
