// macOS Core provider: ScrollView for AppKit — NSScrollView
// with a plain (unflipped) document view; Core's top-down layout lands via
// _modifyNativeViewFrame's Y inversion. Modeled on
// ui/scroll-view/index.ios.js; UIScrollViewDelegate scroll tracking and iOS
// insets dropped (documented divergence).
import { ScrollViewBase, isScrollEnabledProperty, orientationProperty, scrollBarIndicatorVisibleProperty } from '@nativescript/core/ui/scroll-view/scroll-view-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { MacOSHelper } from '@nativescript/core/ui/core/view/view-helper';
import { layout } from '@nativescript/core/utils';
import { CoreTypes } from '@nativescript/core/core-types';
export * from '@nativescript/core/ui/scroll-view/scroll-view-common';
export class ScrollView extends ScrollViewBase {
    nativeViewProtected;
    _contentMeasuredWidth = 0;
    _contentMeasuredHeight = 0;
    createNativeView() {
        const scrollView = NSScrollView.alloc().init();
        scrollView.hasVerticalScroller = true;
        scrollView.hasHorizontalScroller = true;
        scrollView.drawsBackground = false;
        // No JS isFlipped subclass: bridged overrides are ffi callbacks AppKit
        // reaches during GC-sweep teardown, where the marshal crashes.
        scrollView.documentView = NSView.alloc().init();
        return scrollView;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    // Content is laid out inside the document view, not on the NSScrollView
    // itself — the CustomLayoutView attach path targets documentView here.
    _addViewToNativeVisualTree(child, atIndex) {
        const documentView = this.nativeViewProtected && this.nativeViewProtected.documentView;
        if (!documentView) {
            return false;
        }
        child._isAddedToNativeVisualTree = true;
        const childNativeView = child.nativeViewProtected;
        if (childNativeView) {
            MacOSHelper.insertNativeSubview(documentView, childNativeView, atIndex);
            return true;
        }
        return false;
    }
    _removeViewFromNativeVisualTree(child) {
        super._removeViewFromNativeVisualTree(child);
        if (child.nativeViewProtected) {
            child.nativeViewProtected.removeFromSuperview();
        }
    }
    get horizontalOffset() {
        const view = this.nativeViewProtected;
        return view ? view.contentView.bounds.origin.x : 0;
    }
    get verticalOffset() {
        const view = this.nativeViewProtected;
        if (!view || !view.documentView) {
            return 0;
        }
        // Unflipped document: clip origin.y measures up from the document's
        // bottom, so distance from the top is doc − clip − origin.
        const doc = view.documentView.frame.size.height;
        const clip = view.contentView.bounds.size.height;
        return Math.max(0, doc - clip - view.contentView.bounds.origin.y);
    }
    get scrollableWidth() {
        const view = this.nativeViewProtected;
        if (!view || this.orientation !== 'horizontal') {
            return 0;
        }
        return Math.max(0, view.documentView.frame.size.width - view.contentView.bounds.size.width);
    }
    get scrollableHeight() {
        const view = this.nativeViewProtected;
        if (!view || this.orientation !== 'vertical') {
            return 0;
        }
        return Math.max(0, view.documentView.frame.size.height - view.contentView.bounds.size.height);
    }
    [isScrollEnabledProperty.getDefault]() {
        return true;
    }
    [isScrollEnabledProperty.setNative](value) {
        const view = this.nativeViewProtected;
        if (view) {
            view.verticalScroller.hidden = this.orientation !== 'horizontal' && !value;
            view.horizontalScroller.hidden = this.orientation !== 'vertical' && !value;
        }
    }
    [scrollBarIndicatorVisibleProperty.getDefault]() {
        return true;
    }
    [scrollBarIndicatorVisibleProperty.setNative](value) {
        const view = this.nativeViewProtected;
        if (view) {
            view.hasVerticalScroller = value && this.orientation !== 'horizontal';
            view.hasHorizontalScroller = value && this.orientation !== 'vertical';
        }
    }
    scrollToVerticalOffset(value, _animated) {
        const view = this.nativeViewProtected;
        if (view && view.documentView && this.orientation === 'vertical') {
            // Unflipped document: a top-relative offset maps to a clip origin
            // measured up from the document's bottom.
            const doc = view.documentView.frame.size.height;
            const clip = view.contentView.bounds.size.height;
            const offset = Math.max(0, doc - clip - layout.toDeviceIndependentPixels(Math.max(0, value)));
            view.contentView.scrollToPoint(CGPointMake(0, offset));
            view.reflectScrolledClipView(view.contentView);
        }
    }
    scrollToHorizontalOffset(value, _animated) {
        const view = this.nativeViewProtected;
        if (view && this.orientation === 'horizontal') {
            view.contentView.scrollToPoint(CGPointMake(layout.toDeviceIndependentPixels(Math.max(0, value)), 0));
            view.reflectScrolledClipView(view.contentView);
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        const child = this.layoutView;
        this._contentMeasuredWidth = this.effectiveMinWidth;
        this._contentMeasuredHeight = this.effectiveMinHeight;
        if (child) {
            let childSize;
            if (this.orientation === 'vertical') {
                childSize = View.measureChild(this, child, widthMeasureSpec, layout.makeMeasureSpec(0, layout.UNSPECIFIED));
            }
            else {
                childSize = View.measureChild(this, child, layout.makeMeasureSpec(0, layout.UNSPECIFIED), heightMeasureSpec);
            }
            this._contentMeasuredWidth = Math.max(childSize.measuredWidth, this.effectiveMinWidth);
            this._contentMeasuredHeight = Math.max(childSize.measuredHeight, this.effectiveMinHeight);
        }
        const widthAndState = View.resolveSizeAndState(this._contentMeasuredWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(this._contentMeasuredHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    onLayout(left, top, right, bottom) {
        if (!this.nativeViewProtected || !this.layoutView) {
            return;
        }
        let scrollWidth = right - left;
        let scrollHeight = bottom - top;
        if (this.orientation === 'horizontal') {
            scrollWidth = Math.max(this._contentMeasuredWidth, scrollWidth);
        }
        else {
            scrollHeight = Math.max(this._contentMeasuredHeight, scrollHeight);
        }
        const documentView = this.nativeViewProtected.documentView;
        if (documentView) {
            documentView.frame = CGRectMake(0, 0, layout.toDeviceIndependentPixels(scrollWidth), layout.toDeviceIndependentPixels(scrollHeight));
        }
        View.layoutChild(this, this.layoutView, 0, 0, scrollWidth, scrollHeight);
    }
    _onOrientationChanged() {
        if (this.nativeViewProtected) {
            this.nativeViewProtected.hasVerticalScroller = this.orientation !== 'horizontal';
            this.nativeViewProtected.hasHorizontalScroller = this.orientation !== 'vertical';
        }
    }
}
CSSType('ScrollView')(ScrollView);
