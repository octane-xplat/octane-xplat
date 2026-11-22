// macOS Core provider: Frame for AppKit — a flipped container
// NSView showing only the current page's native view. Navigation is instant
// (no transitions): _navigateCore/_goBackCore mirror the
// UIViewControllerImpl.viewWillAppear/viewDidAppear pair in
// ui/frame/index.ios.js — attach+load the page, then setCurrent — with the
// UINavigationController stack replaced by Core's own _backStack bookkeeping.
// Animated navigation and custom transitions are ignored (gap).
export * from '@nativescript/core/ui/frame/frame-common';
import { FrameBase, NavigationType } from '@nativescript/core/ui/frame/frame-common';
import { View } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export class Frame extends FrameBase {
    createNativeView() {
        // iOS re-pushes into the frame stack here (disposeNativeView pops it).
        if (this._currentEntry) {
            this._pushInFrameStack();
        }
        return super.createNativeView();
    }
    disposeNativeView() {
        const current = this._currentEntry;
        const executingEntry = this._executingContext ? this._executingContext.entry : null;
        if (executingEntry) {
            this._disposeBackstackEntry(executingEntry);
        }
        this.backStack.forEach((entry) => {
            if (entry !== executingEntry) {
                this._disposeBackstackEntry(entry);
            }
        });
        if (current) {
            this._disposeBackstackEntry(current);
        }
        this._removeFromFrameStack();
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    // viewWillAppear equivalent: attach the page to the frame and load it.
    _showPage(page) {
        this._resolvedPage = page;
        if (page.parent === this) {
            this._inheritStyles(page);
        }
        else if (!page.parent) {
            this._addView(page);
        }
        else {
            throw new Error('Page is already shown on another frame.');
        }
        if (!page.isLoaded) {
            page.callLoaded();
        }
    }
    _navigateCore(backstackEntry) {
        super._navigateCore(backstackEntry);
        const navigationType = (this._executingContext && this._executingContext.navigationType) || NavigationType.forward;
        this._showPage(backstackEntry.resolvedPage);
        this.setCurrent(backstackEntry, navigationType);
    }
    _goBackCore(backstackEntry) {
        super._goBackCore(backstackEntry);
        this._showPage(backstackEntry.resolvedPage);
        this.setCurrent(backstackEntry, NavigationType.back);
    }
    setCurrent(entry, navigationType) {
        const current = this._currentEntry;
        const currentEntryChanged = current !== entry;
        if (entry && entry.resolvedPage && currentEntryChanged) {
            this._updateBackstack(entry, navigationType);
            super.setCurrent(entry, navigationType);
        }
        this._syncVisiblePage();
        if (entry && entry.resolvedPage) {
            this._processNavigationQueue(entry.resolvedPage);
        }
    }
    // Only the current page's native view may be a subview of the container.
    // FrameCommon's eachChildView yields just _resolvedPage, so stale pages
    // are found by walking the container's actual subviews instead.
    _syncVisiblePage() {
        const native = this.nativeViewProtected;
        if (!native) {
            return;
        }
        const currentNative = this.currentPage && this.currentPage.nativeViewProtected;
        const subviews = native.subviews;
        if (subviews) {
            for (let i = subviews.count - 1; i >= 0; i--) {
                const sub = subviews.objectAtIndex(i);
                if (sub !== currentNative) {
                    sub.removeFromSuperview();
                }
            }
        }
        if (currentNative && currentNative.superview !== native) {
            native.addSubview(currentNative);
        }
    }
    // frame-common's _removeViewFromNativeVisualTree only clears the added
    // flag — also detach the page's NSView so popped/cleared pages leave the
    // container's subview list.
    _removeViewFromNativeVisualTree(child) {
        super._removeViewFromNativeVisualTree(child);
        if (child.nativeViewProtected) {
            child.nativeViewProtected.removeFromSuperview();
        }
    }
    // ActionBar is non-rendering on macOS: the page never reserves space for
    // it regardless of actionBarHidden. Gap: no toolbar/menu-bar equivalent.
    _getNavBarVisible(_page) {
        return false;
    }
    _updateActionBar(_page, _disableNavBarAnimation) { }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        // iOS leaves the page unmeasured — UINavigationController sizes it.
        // On macOS the Frame is the sizing authority: the page subtree only
        // sees a measure pass if we run it here (mason compute roots hang off
        // onMeasure), so measure every child the layout pass will lay out.
        let measuredWidth = this.effectiveMinWidth;
        let measuredHeight = this.effectiveMinHeight;
        this.eachChildView((child) => {
            const result = View.measureChild(this, child, widthMeasureSpec, heightMeasureSpec);
            measuredWidth = Math.max(measuredWidth, result.measuredWidth);
            measuredHeight = Math.max(measuredHeight, result.measuredHeight);
            return true;
        });
        const widthAndState = View.resolveSizeAndState(measuredWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(measuredHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    onLayout(left, top, right, bottom) {
        // iOS lets UINavigationController size the page's controller view —
        // the page fills the frame unconditionally (no margins/alignment).
        this.eachChildView((child) => {
            child.layout(0, 0, right - left, bottom - top);
            return true;
        });
    }
}
