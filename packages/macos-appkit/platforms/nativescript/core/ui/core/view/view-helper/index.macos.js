// Provider override: macOS (AppKit) port of the IOSHelper surface used by
// view-common (ViewHelper) plus the frame/subview math my View needs.
import { ViewHelper } from '@nativescript/core/ui/core/view/view-helper/view-helper-common';
import { layout, Trace } from '@nativescript/core/ui/core/view/view-helper/view-helper-shared';
export * from '@nativescript/core/ui/core/view/view-helper/view-helper-common';
export const AndroidHelper = 0;
export class MacOSHelper {
    static getPositionFromFrame(frame) {
        const left = layout.round(layout.toDevicePixels(frame.origin.x));
        const top = layout.round(layout.toDevicePixels(frame.origin.y));
        const right = layout.round(layout.toDevicePixels(frame.origin.x + frame.size.width));
        const bottom = layout.round(layout.toDevicePixels(frame.origin.y + frame.size.height));
        return { left, right, top, bottom };
    }
    static getFrameFromPosition(position, insets) {
        insets = insets || { left: 0, top: 0, right: 0, bottom: 0 };
        const left = layout.toDeviceIndependentPixels(position.left + insets.left);
        const top = layout.toDeviceIndependentPixels(position.top + insets.top);
        let width = layout.toDeviceIndependentPixels(position.right - position.left - insets.left - insets.right);
        let height = layout.toDeviceIndependentPixels(position.bottom - position.top - insets.top - insets.bottom);
        if (width < 0)
            {width = 0;}
        if (height < 0)
            {height = 0;}
        return CGRectMake(left, top, width, height);
    }
    static insertNativeSubview(parentNativeView, childNativeView, atIndex) {
        // NSWindowOrderingMode: NSWindowAbove = 1, NSWindowBelow = -1 (0 is
        // NSWindowOut — invalid here, AppKit asserts and aborts on it).
        const subviews = parentNativeView.subviews;
        if (typeof atIndex !== 'number' || !subviews || atIndex >= subviews.count) {
            parentNativeView.addSubview(childNativeView);
            return;
        }
        parentNativeView.addSubviewPositionedRelativeTo(childNativeView, -1, subviews.objectAtIndex(atIndex));
    }
    // Root measure/layout for a top-level core view sized to `width`x`height` dips.
    static layoutView(owner, width, height) {
        const widthSpec = layout.makeMeasureSpec(layout.round(layout.toDevicePixels(width)), layout.EXACTLY);
        const heightSpec = layout.makeMeasureSpec(layout.round(layout.toDevicePixels(height)), layout.EXACTLY);
        ViewHelper.measureChild(null, owner, widthSpec, heightSpec);
        ViewHelper.layoutChild(null, owner, 0, 0, layout.round(layout.toDevicePixels(width)), layout.round(layout.toDevicePixels(height)));
        if (owner.parent) {
            owner.parent._layoutParent();
        }
    }
    static updateAutoAdjustScrollInsets() { }
    static updateConstraints() { }
    static initLayoutGuide() {
        return null;
    }
}
// iOS-shaped alias: keeps shared/ios call sites compiling if any slip through.
export const IOSHelper = MacOSHelper;
export { layout, Trace };
// Surface parity with view-helper/index.ios.js for iOS consumers that slip
// into the graph (list-view etc.). Inert in this spike.
export class ScrollEdgeContainers {
    constructor(owner) {
        this.owner = owner;
        this.entries = new Map();
    }
    add() { }
    remove() { }
    attach() { }
    release() { }
}
