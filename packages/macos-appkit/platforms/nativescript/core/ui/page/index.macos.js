// macOS Core provider: Page for AppKit — a flipped container
// NSView that lays out its content at full size. Ported from
// ui/page/index.ios.js minus the UIViewController (its view IS the page's
// native view on macOS). The ActionBar is non-rendering: it is never
// inserted into the native tree and onMeasure reserves no space for it
// (frame._getNavBarVisible is always false) — actionBarHidden is inert.
export * from '@nativescript/core/ui/page/page-common';
import { PageBase } from '@nativescript/core/ui/page/page-common';
import { View } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export class Page extends PageBase {
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    updateWithWillAppear(_animated) {
        // Plugin hook parity with iOS — no controller lifecycle here.
    }
    updateWithWillDisappear(_animated) {
        // Plugin hook parity with iOS — no controller lifecycle here.
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        const result = View.measureChild(this, this.layoutView, widthMeasureSpec, heightMeasureSpec);
        const measureWidth = Math.max(result.measuredWidth, this.effectiveMinWidth);
        const measureHeight = Math.max(result.measuredHeight, this.effectiveMinHeight);
        const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    onLayout(left, top, right, bottom) {
        const insets = this.getSafeAreaInsets();
        const childLeft = left + insets.left;
        const childTop = top + insets.top;
        const childRight = right - insets.right;
        const childBottom = bottom - insets.bottom;
        View.layoutChild(this, this.layoutView, childLeft, childTop, childRight, childBottom);
    }
    _addViewToNativeVisualTree(child, atIndex) {
        // ActionBar is non-rendering on macOS — mark it added without a
        // native attachment so _setupUI doesn't retry.
        if (this.hasActionBar && child === this.actionBar) {
            return true;
        }
        return super._addViewToNativeVisualTree(child, atIndex);
    }
}
