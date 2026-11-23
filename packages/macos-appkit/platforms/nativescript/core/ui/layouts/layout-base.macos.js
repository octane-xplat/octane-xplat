// macOS Core provider: LayoutBase for AppKit — extends the iOS
// implementation (resolved through the provider `reuse` map) and swaps the
// UIKit-only native calls for AppKit equivalents. See provider rule 2:
// reuse + smallest-method override.
import { isPassThroughParentEnabledProperty } from '@nativescript/core/ui/layouts/layout-base-common';
import { LayoutBase as AppleLayoutBase } from '@nativescript/core/ui/layouts/layout-base';
export * from '@nativescript/core/ui/layouts/layout-base-common';
export class LayoutBase extends AppleLayoutBase {
    moveChildInPlace(child, index) {
        const previous = this.getChildIndex(child);
        if (previous < 0) {
            throw new Error('Cannot move an AppKit child owned by another layout');
        }
        if (previous === index) {
            return;
        }

        // An ordinary remove/insert tears down a Core child's AppKit view.
        this._subViews.splice(previous, 1);
        this._subViews.splice(index, 0, child);
        this._reorderNativeChildren(child);
        this._invalidateSiblingCssState(Math.min(previous, index), Math.max(previous, index) + 2);
        this.requestLayout();
    }
    _reorderNativeChildren(child) {
        // Viewless proxy descendants share the first concrete layout's host.
        let layout = this;
        while (!layout.nativeViewProtected && layout.parent instanceof LayoutBase) {
            layout = layout.parent;
        }
        const host = layout.nativeViewProtected;
        if (!host) {
            return;
        }

        const order = [];
        const moved = [];
        layout.eachLayoutChild((view) => {
            const native = view.nativeViewProtected;
            if (native?.superview === host) {
                order.push(native);
            }
        });
        child._eachLayoutView((view) => {
            const native = view.nativeViewProtected;
            if (native?.superview === host) {
                moved.push(native);
            }
        });
        const first = order.indexOf(moved[0]);
        if (first < 0) {
            return;
        }
        const next = order[first + moved.length];
        let previous = order[first - 1] ?? null;
        for (const native of moved) {
            // AppKit orders relative to the neighboring owned subview.
            host.addSubviewPositionedRelativeTo(native, next ? -1 : 1, next ?? previous);
            previous = native;
        }
    }
    _setNativeClipToBounds() {
        const view = this.nativeViewProtected;
        if (view && this.clipToBounds) {
            view.wantsLayer = true;
            if (view.layer) {
                view.layer.masksToBounds = true;
            }
        }
    }
    [isPassThroughParentEnabledProperty.setNative](value) {
        // NSView has no setPassThroughParent category (an {N} iOS runtime
        // extension); apply only when the method exists.
        if (typeof this.nativeViewProtected?.setPassThroughParent === 'function') {
            this.nativeViewProtected.setPassThroughParent(value);
        }
    }
}
