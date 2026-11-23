// macOS Core provider: Progress for AppKit —
// NSProgressIndicator in bar style, ported from ui/progress/index.ios.js.
// value is reported in Core units (0..maxValue) while the native control
// tracks minValue..maxValue directly. Tints are a gap.
import { ProgressBase, valueProperty, maxValueProperty } from '@nativescript/core/ui/progress/progress-common';
import { layout } from '@nativescript/core/utils';
import { colorProperty, backgroundColorProperty, backgroundInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { View, CSSType } from '@nativescript/core/ui/core/view';
export * from '@nativescript/core/ui/progress/progress-common';
export class Progress extends ProgressBase {
    nativeViewProtected;
    createNativeView() {
        const view = NSProgressIndicator.alloc().init();
        view.style = 0; // NSProgressIndicatorStyleBar
        view.indeterminate = false;
        view.minValue = 0;
        view.maxValue = 100;
        view.doubleValue = 0;
        return view;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [valueProperty.getDefault]() {
        return 0;
    }
    [valueProperty.setNative]() {
        this._syncRange();
    }
    [maxValueProperty.getDefault]() {
        return 100;
    }
    [maxValueProperty.setNative]() {
        this._syncRange();
    }
    _syncRange() {
        const view = this.nativeViewProtected;
        const maximum = this.maxValue;
        // Core re-coerces value before the native max setter runs. Set the
        // range and value together so AppKit never clamps a new value to the old max.
        view.maxValue = maximum > 0 ? maximum : 100;
        view.doubleValue = maximum > 0 ? Math.max(0, Math.min(this.value, maximum)) : 0;
    }
    // Color gaps: NSProgressIndicator has no tint API.
    [colorProperty.getDefault]() {
        return null;
    }
    [colorProperty.setNative](_value) { }
    [backgroundColorProperty.getDefault]() {
        return null;
    }
    [backgroundColorProperty.setNative](_value) { }
    [backgroundInternalProperty.getDefault]() {
        return null;
    }
    [backgroundInternalProperty.setNative](_value) { }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
            const fitting = nativeView.intrinsicContentSize;
            const intrinsicW = fitting && fitting.width >= 0 ? layout.toDevicePixels(fitting.width) : 0;
            const intrinsicH = fitting && fitting.height >= 0 ? layout.toDevicePixels(fitting.height) : 0;
            // Controls with indefinite intrinsic width (bar progress/slider)
            // fill the proposed width; a sane default keeps UNSPECIFIED sane.
            const fallbackW = layout.toDevicePixels(160);
            const nativeWidth = widthMode === layout.EXACTLY ? width : intrinsicW > 0 ? intrinsicW : widthMode === layout.AT_MOST ? Math.min(width, fallbackW) : fallbackW;
            const nativeHeight = heightMode === layout.EXACTLY ? height : intrinsicH > 0 ? intrinsicH : layout.toDevicePixels(5);
            const widthAndState = View.resolveSizeAndState(layout.round(nativeWidth), width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(layout.round(nativeHeight), height, heightMode, 0);
            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
}
CSSType('Progress')(Progress);
