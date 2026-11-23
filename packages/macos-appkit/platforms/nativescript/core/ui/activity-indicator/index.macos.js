// macOS Core provider: ActivityIndicator for AppKit —
// NSProgressIndicator in spinning style, ported from
// ui/activity-indicator/index.ios.js. `displayedWhenStopped=false` is the
// AppKit `hidesWhenStopped` analogue. The iOS-only
// iosIndicatorViewStyle/style tint has no equivalent — color is a gap.
import { ActivityIndicatorBase, busyProperty } from '@nativescript/core/ui/activity-indicator/activity-indicator-common';
import { layout } from '@nativescript/core/utils';
import { colorProperty, opacityProperty } from '@nativescript/core/ui/styling/style-properties';
import { View, CSSType } from '@nativescript/core/ui/core/view';
export * from '@nativescript/core/ui/activity-indicator/activity-indicator-common';
export class ActivityIndicator extends ActivityIndicatorBase {
    nativeViewProtected;
    createNativeView() {
        const view = NSProgressIndicator.alloc().init();
        view.style = 1; // NSProgressIndicatorStyleSpinning
        view.displayedWhenStopped = false;
        view.indeterminate = true;
        view.alphaValue = 0;
        return view;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [busyProperty.getDefault]() {
        return false;
    }
    [busyProperty.setNative](value) {
        const nativeView = this.nativeViewProtected;
        if (value) {
            nativeView.startAnimation(null);
        }
        else {
            nativeView.stopAnimation(null);
        }
        // Keep the view's layout slot and combine visibility with authored opacity.
        nativeView.alphaValue = value ? this.style.opacity : 0;
    }
    [opacityProperty.getDefault]() {
        return 1;
    }
    [opacityProperty.setNative](value) {
        this.nativeViewProtected.alphaValue = this.busy ? value : 0;
    }
    disposeNativeView() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            nativeView.stopAnimation(null);
            nativeView.alphaValue = 0;
            nativeView.hidden = true;
        }
        super.disposeNativeView();
    }
    // Color gap: NSProgressIndicator has no tint API.
    [colorProperty.getDefault]() {
        return null;
    }
    [colorProperty.setNative](_value) { }
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
            const fallbackW = layout.toDevicePixels(32);
            const nativeWidth = widthMode === layout.EXACTLY ? width : intrinsicW > 0 ? intrinsicW : widthMode === layout.AT_MOST ? Math.min(width, fallbackW) : fallbackW;
            const nativeHeight = heightMode === layout.EXACTLY ? height : intrinsicH > 0 ? intrinsicH : layout.toDevicePixels(32);
            const widthAndState = View.resolveSizeAndState(layout.round(nativeWidth), width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(layout.round(nativeHeight), height, heightMode, 0);
            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
}
CSSType('ActivityIndicator')(ActivityIndicator);
