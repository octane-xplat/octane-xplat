// Provider override: macOS (AppKit) port of ui/core/view — View/ContainerView/
// CustomLayoutView over NSView. Ported from ui/core/view/index.ios.js with
// UIKit-only features (safe area, transforms, glass, modal presentation,
// accessibility notifications) removed for the spike.
import { ViewCommon } from '@nativescript/core/ui/core/view/view-common';
import { Trace } from '@nativescript/core/trace';
import {
    backgroundInternalProperty,
    opacityProperty,
    perspectiveProperty,
    rotateProperty,
    rotateXProperty,
    rotateYProperty,
    scaleXProperty,
    scaleYProperty,
    translateXProperty,
    translateYProperty,
    visibilityProperty,
} from '@nativescript/core/ui/styling/style-properties';
import { layout, getWindow } from '@nativescript/core/utils';
import { MacOSHelper } from '@nativescript/core/ui/core/view/view-helper';
import { retireNativeScriptHostView } from '../../../../../../src/nativescript-host-services';
import { paintNativeScriptBackground, paintNativeScriptTransform, disposeNativeScriptPaint } from '../../../../../../src/nativescript-paint.macos';
import { notifyNativeScriptLayout } from '../../../../../../src/nativescript-roots.macos';
import { createNativeScriptActionView, releaseNativeScriptActionView, setNativeScriptActionRole } from '../../../../../../src/nativescript-actions.macos';
import { evalMediaQuery } from '@octane-xplat/css-engine';
import { NSWorkspace } from '@octane-xplat/platform/macos';
import {
    accessibilityHintProperty,
    accessibilityIdentifierProperty,
    accessibilityLabelProperty,
    accessibilityRoleProperty,
} from '@nativescript/core/accessibility/accessibility-properties';
export * from '@nativescript/core/ui/core/view/view-common';
export * from '@nativescript/core/ui/core/view/view-helper';
export * from '@nativescript/core/ui/core/properties';
const PFLAG_FORCE_LAYOUT = 1;
const PFLAG_MEASURED_DIMENSION_SET = 1 << 1;
const PFLAG_LAYOUT_REQUIRED = 1 << 2;
// Bridge finalizers dealloc collected wrappers inside JSC's GC sweep; a
// still-linked NSView's dealloc then cascades through removeFromSuperview →
// visibleRect → a JS isFlipped override, which must allocate and crashes
// inside Heap::sweepSynchronously. Detach every descendant eagerly so
// GC-time dealloc finds nothing to invalidate.
function detachNativeViewTree(native) {
    if (!native || typeof native.removeFromSuperview !== 'function')
        {return;}
    if (native instanceof NSScrollView) {
        // Clip view/scrollers are AppKit-owned (removeFromSuperview throws on
        // contentView); detach the wrapped document subtree and let the
        // scrollview's own dealloc take the internals with documentView nil, so
        // clip teardown never consults our JS isFlipped.
        const document = native.documentView;
        native.documentView = null;
        detachNativeViewTree(document);
        native.removeFromSuperview();
        return;
    }
    const subviews = native.subviews;
    if (subviews && subviews.count > 0) {
        for (let i = subviews.count - 1; i >= 0; i--) {
            detachNativeViewTree(subviews.objectAtIndex(i));
        }
    }
    native.removeFromSuperview();
}
function selfAlignment(value, reverse = false) {
    switch (value) {
        case 'left':
        case 'top':
            return 'start';
        case 'right':
        case 'bottom':
            return 'end';
        case 'start':
        case 'self-start':
        case 'flex-start':
            return reverse ? 'end' : 'start';
        case 'end':
        case 'self-end':
        case 'flex-end':
            return reverse ? 'start' : 'end';
        case 'center':
        case 'middle':
            return 'center';
        case 'stretch':
            return 'stretch';
    }
}

function placeInCell(start, end, marginStart, marginEnd, measuredSize, alignment, hasSize) {
    const space = Math.max(0, end - start - marginStart - marginEnd);
    const stretch = alignment === 'stretch' && !hasSize;
    const size = stretch ? space : measuredSize;
    let offset = start + marginStart;
    if (alignment === 'end') {
        offset += space - size;
    }
    else if (alignment === 'center' || (alignment === 'stretch' && hasSize)) {
        offset += (space - size) / 2;
    }
    return [Math.round(offset), Math.round(offset + size)];
}

export class View extends ViewCommon {
    static layoutChild(parent, child, left, top, right, bottom, setFrame = true) {
        const rtl = child?.direction === 'rtl';
        const justify = selfAlignment(child?.style.justifySelf, rtl);
        const align = selfAlignment(child?.style.alignSelf);
        if (!child || child.isCollapsed || (!justify && !align)) {
            super.layoutChild(parent, child, left, top, right, bottom, setFrame);
            return;
        }

        // NativeScript knows its own alignment properties; the AppKit JSX
        // contract also permits CSS self alignment inside a Core layout cell.
        const horizontal = justify ?? selfAlignment(child.horizontalAlignment, rtl) ?? 'stretch';
        const vertical = align ?? selfAlignment(child.verticalAlignment) ?? 'stretch';
        View.measureChild(
            parent,
            child,
            layout.makeMeasureSpec(right - left, horizontal === 'stretch' ? layout.EXACTLY : layout.AT_MOST),
            layout.makeMeasureSpec(bottom - top, vertical === 'stretch' ? layout.EXACTLY : layout.AT_MOST),
        );
        const [x1, x2] = placeInCell(
            left, right, child.effectiveMarginLeft, child.effectiveMarginRight,
            child.getMeasuredWidth(), horizontal, child.effectiveWidth >= 0,
        );
        const [y1, y2] = placeInCell(
            top, bottom, child.effectiveMarginTop, child.effectiveMarginBottom,
            child.getMeasuredHeight(), vertical, child.effectiveHeight >= 0,
        );
        child.layout(x1, y1, x2, y2, setFrame);
    }

    _matchesMediaQuery(query) {
        let window;
        for (let view = this; view && !window; view = view.parent) {
            window = view.nativeViewProtected?.window;
        }
        const size = window?.contentView?.bounds.size;
        if (!size) {
            return undefined;
        }
        const appearance = String(window.effectiveAppearance?.name ?? '').toLowerCase();
        return evalMediaQuery(query, {
            width: size.width,
            height: size.height,
            colorScheme: appearance.includes('dark') ? 'dark' : 'light',
            reducedMotion: NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceMotion,
        });
    }

    [accessibilityLabelProperty.getDefault]() {
        return this.nativeViewProtected.accessibilityLabel;
    }
    [accessibilityLabelProperty.setNative](label) {
        this.nativeViewProtected.accessibilityLabel = label ?? null;
    }
    [accessibilityHintProperty.getDefault]() {
        return this.nativeViewProtected.accessibilityHelp;
    }
    [accessibilityHintProperty.setNative](hint) {
        this.nativeViewProtected.accessibilityHelp = hint ?? null;
    }
    [accessibilityIdentifierProperty.getDefault]() {
        return this.nativeViewProtected.accessibilityIdentifier;
    }
    [accessibilityIdentifierProperty.setNative](identifier) {
        this.nativeViewProtected.accessibilityIdentifier = identifier ?? null;
    }
    [accessibilityRoleProperty.getDefault]() {
        return this.nativeViewProtected.accessibilityRole;
    }
    [accessibilityRoleProperty.setNative](role) {
        setNativeScriptActionRole(this.nativeViewProtected, role);
    }
    [visibilityProperty.getDefault]() {
        return this.nativeViewProtected.hidden ? 'hidden' : 'visible';
    }
    [visibilityProperty.setNative](visibility) {
        this.nativeViewProtected.hidden = visibility !== 'visible';
        this.requestLayout();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this._iosView;
    }
    disposeNativeView() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            releaseNativeScriptActionView(nativeView);
            retireNativeScriptHostView(nativeView);
            disposeNativeScriptPaint(nativeView);
            detachNativeViewTree(nativeView);
        }
        super.disposeNativeView();
    }
    get isLayoutRequired() {
        return (this._privateFlags & PFLAG_LAYOUT_REQUIRED) === PFLAG_LAYOUT_REQUIRED;
    }
    get isLayoutRequested() {
        return (this._privateFlags & PFLAG_FORCE_LAYOUT) === PFLAG_FORCE_LAYOUT;
    }
    requestLayout() {
        this._privateFlags |= PFLAG_FORCE_LAYOUT;
        if (this.parent) {
            this.parent.requestLayout();
        }
        else if (this.nativeViewProtected && !this._rootLayoutScheduled) {
            // macOS analog of iOS's setNeedsLayout: no UIKit layout cycle exists,
            // so a request reaching the root schedules one coalesced
            // measure+layout pass at the view's current bounds. A microtask (not a
            // timer) matches setNeedsLayout semantics: it defers past the current
            // synchronous mutation batch but runs before the next timer tick.
            this._rootLayoutScheduled = true;
            const native = this.nativeViewProtected;
            Promise.resolve().then(() => {
                this._rootLayoutScheduled = false;
                try {
                    // Detached roots (view torn down after the request, or never
                    // windowed) need no pass — and must not re-queue themselves.
                    if (!this.nativeViewProtected?.window) {
                        return;
                    }
                    const size = native.frame && native.frame.size;
                    const w = size ? layout.round(layout.toDevicePixels(size.width)) : 0;
                    const h = size ? layout.round(layout.toDevicePixels(size.height)) : 0;
                    if (w > 0 && h > 0) {
                        this.measure(layout.makeMeasureSpec(w, layout.EXACTLY), layout.makeMeasureSpec(h, layout.EXACTLY));
                        this.layout(0, 0, w, h);
                    }
                }
                catch (e) {
                    console.log('[requestLayout] deferred pass failed on ' + (this.constructor?.name ?? this) + ': ' + (e?.stack ?? e));
                }
            });
        }
    }
    measure(widthMeasureSpec, heightMeasureSpec) {
        const forceLayout = (this._privateFlags & PFLAG_FORCE_LAYOUT) === PFLAG_FORCE_LAYOUT;
        // Core resolves child percentages against the parent's current specs.
        const specsChanged = this._setCurrentMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
        if (forceLayout || specsChanged) {
            this._privateFlags &= ~PFLAG_MEASURED_DIMENSION_SET;
            this.onMeasure(widthMeasureSpec, heightMeasureSpec);
            this._privateFlags |= PFLAG_LAYOUT_REQUIRED;
            if ((this._privateFlags & PFLAG_MEASURED_DIMENSION_SET) !== PFLAG_MEASURED_DIMENSION_SET) {
                if (Trace.isEnabled()) {
                    Trace.write('onMeasure() did not set the measured dimension by calling setMeasuredDimension() ' + this, Trace.categories.Layout, Trace.messageType.error);
                }
            }
        }
    }
    layout(left, top, right, bottom, setFrame = true) {
        const { boundsChanged, sizeChanged } = this._setCurrentLayoutBounds(left, top, right, bottom);
        if (setFrame) {
            this.layoutNativeView(left, top, right, bottom);
        }
        // Mason assigns nested measurements directly. A requested layout
        // still has work when Core measure() did not set its layout flag and
        // the container's own frame remained unchanged.
        const needsLayout = boundsChanged || this.isLayoutRequired || this.isLayoutRequested;
        if (needsLayout) {
            this.onLayout(left, top, right, bottom);
            this._privateFlags &= ~PFLAG_LAYOUT_REQUIRED;
            this.updateBackground(sizeChanged, needsLayout);
        }
        this._privateFlags &= ~PFLAG_FORCE_LAYOUT;
        if (needsLayout) {
            notifyNativeScriptLayout(this);
        }
    }
    updateBackground(sizeChanged, needsLayout) {
        const background = this.style.backgroundInternal;
        if (sizeChanged || needsLayout || this._nativeBackgroundState === 'invalid') {
            this._redrawNativeBackground(background);
        }
    }
    setMeasuredDimension(measuredWidth, measuredHeight) {
        this._measuredWidth = measuredWidth;
        this._measuredHeight = measuredHeight;
        this._privateFlags |= PFLAG_MEASURED_DIMENSION_SET;
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const view = this.nativeViewProtected;
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        let nativeWidth = 0;
        let nativeHeight = 0;
        if (view) {
            const nativeSize = layout.measureNativeView(view, width, widthMode, height, heightMode);
            nativeWidth = nativeSize.width;
            nativeHeight = nativeSize.height;
        }
        let measureWidth = Math.max(nativeWidth, this.effectiveMinWidth);
        let measureHeight = Math.max(nativeHeight, this.effectiveMinHeight);
        measureWidth = Math.min(measureWidth, this.effectiveMaxWidth);
        measureHeight = Math.min(measureHeight, this.effectiveMaxHeight);
        const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    onLayout(left, top, right, bottom) { }
    createNativeView() {
        return createNativeScriptActionView(this, CGRectMake(0, 0, 0, 0));
    }
    _modifyNativeViewFrame(nativeView, frame) {
        // Core gives the frame with top-left origin; unflipped NSViews expect
        // bottom-left. Invert against the superview's current bounds height.
        const superview = nativeView.superview;
        const parentHeight = superview ? Number(superview.bounds.size.height) : 0;
        // Core lays out the alignment rectangle. AppKit controls add their
        // optical insets in the native frame, including outside Mason.
        const rect = CGRectMake(frame.origin.x, parentHeight - frame.origin.y - frame.size.height, frame.size.width, frame.size.height);
        const nativeFrame = nativeView.frameForAlignmentRect(rect);
        nativeView.frame = nativeFrame;
        // Keep the view anchored to the superview's top (its max-Y margin fixed)
        // so a parent resize before the next layout pass doesn't drag it down.
        nativeView.autoresizingMask = 8; // NSViewMinYMargin
        const boundsOrigin = nativeView.bounds.origin;
        nativeView.bounds = CGRectMake(boundsOrigin.x, boundsOrigin.y, nativeFrame.size.width, nativeFrame.size.height);
        if (typeof nativeView.layoutSubtreeIfNeeded === 'function') {
            nativeView.layoutSubtreeIfNeeded();
        }
    }
    _setNativeViewFrame(nativeView, frame) {
        const oldFrame = this._cachedFrame;
        if (!oldFrame || !CGRectEqualToRect(oldFrame, frame)) {
            if (Trace.isEnabled()) {
                Trace.write(this + ' :_setNativeViewFrame: ' + JSON.stringify(MacOSHelper.getPositionFromFrame(frame)), Trace.categories.Layout);
            }
            this._cachedFrame = frame;
            this._modifyNativeViewFrame(nativeView, frame);
            this._raiseLayoutChangedEvent();
            this._isLaidOut = true;
        }
        else if (!this._isLaidOut) {
            this._cachedFrame = frame;
            this._raiseLayoutChangedEvent();
            this._isLaidOut = true;
        }
    }
    get isLayoutValid() {
        if (this.nativeViewProtected) {
            return !this.isLayoutRequested;
        }
        return false;
    }
    layoutNativeView(left, top, right, bottom) {
        if (!this.nativeViewProtected) {
            return;
        }
        const nativeView = this.nativeViewProtected;
        const frame = MacOSHelper.getFrameFromPosition({ left, top, right, bottom });
        this._setNativeViewFrame(nativeView, frame);
    }
    _layoutParent() {
        if (this.nativeViewProtected) {
            const native = this.nativeViewProtected;
            const frame = native.alignmentRectForFrame(native.frame);
            const origin = frame.origin;
            const size = frame.size;
            const left = layout.toDevicePixels(origin.x);
            const superview = this.nativeViewProtected.superview;
            const parentHeight = superview ? Number(superview.bounds.size.height) : 0;
            const top = layout.toDevicePixels(parentHeight - origin.y - size.height);
            const width = layout.toDevicePixels(size.width);
            const height = layout.toDevicePixels(size.height);
            this._setLayoutFlags(left, top, width + left, height + top);
        }
        super._layoutParent();
    }
    _setLayoutFlags(left, top, right, bottom) {
        const width = right - left;
        const height = bottom - top;
        const widthSpec = layout.makeMeasureSpec(width, layout.EXACTLY);
        const heightSpec = layout.makeMeasureSpec(height, layout.EXACTLY);
        this._setCurrentMeasureSpecs(widthSpec, heightSpec);
        this._privateFlags &= ~PFLAG_FORCE_LAYOUT;
        this.setMeasuredDimension(width, height);
        const { boundsChanged, sizeChanged } = this._setCurrentLayoutBounds(left, top, right, bottom);
        this.updateBackground(sizeChanged, boundsChanged);
        this._privateFlags &= ~PFLAG_LAYOUT_REQUIRED;
    }
    // ── Modal presentation ──────────────────────────────────────────────
    // iOS presents a modal view controller; macOS presents the modal view in
    // a sheet window on the presenter's window. The modal view is set up as a
    // root view (like _setupAsRootView in the iOS path), measured/laid out at
    // the sheet's content size, and tracked via _modalSheetWindow so
    // _hideNativeModalView can end the sheet. Nested modals stack sheets
    // because parent.nativeViewProtected.window resolves to the sheet window
    // for a view already inside one.
    _showNativeModalView(parent, options) {
        const parentWindow = parent && parent.nativeViewProtected && parent.nativeViewProtected.window;
        if (!parentWindow) {
            Trace.write(`Could not find a window for ${parent} while showing modal view.`, Trace.categories.ViewHierarchy, Trace.messageType.error);
            return;
        }
        this._setupAsRootView({});
        super._showNativeModalView(parent, options);
        const modalOptions = (options && options.macos) || (options && options.ios) || {};
        const styleW = this.width !== undefined && this.width !== null ? this.width : this.style && this.style.width;
        const styleH = this.height !== undefined && this.height !== null ? this.height : this.style && this.style.height;
        const width = modalOptions.width > 0 ? modalOptions.width : styleW > 0 ? styleW : 480;
        const height = modalOptions.height > 0 ? modalOptions.height : styleH > 0 ? styleH : 360;
        const sheetWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(NSMakeRect(0, 0, width, height), (1 << 0) | (1 << 1), // NSWindowStyleMaskTitled | NSWindowStyleMaskClosable
        2, false);
        sheetWindow.contentView = this.nativeViewProtected;
        this._modalSheetWindow = sheetWindow;
        this._nativeWindow = sheetWindow;
        this.horizontalAlignment = 'stretch';
        this.verticalAlignment = 'stretch';
        this._raiseShowingModallyEvent();
        const w = layout.round(layout.toDevicePixels(width));
        const h = layout.round(layout.toDevicePixels(height));
        this.measure(layout.makeMeasureSpec(w, layout.EXACTLY), layout.makeMeasureSpec(h, layout.EXACTLY));
        this.layout(0, 0, w, h);
        this.callLoaded();
        parentWindow.beginSheetCompletionHandler(sheetWindow, null);
        this._raiseShownModallyEvent();
    }
    _hideNativeModalView(parent, whenClosedCallback) {
        const sheetWindow = this._modalSheetWindow;
        const parentWindow = (sheetWindow && sheetWindow.sheetParent) || (parent && parent.nativeViewProtected && parent.nativeViewProtected.window);
        if (parentWindow && sheetWindow) {
            parentWindow.endSheet(sheetWindow);
        }
        if (sheetWindow) {
            sheetWindow.orderOut(null);
        }
        this._modalSheetWindow = null;
        this._nativeWindow = undefined;
        whenClosedCallback();
    }
    focus() {
        return false;
    }
    applySafeAreaInsets(frame) {
        return null;
    }
    getSafeAreaInsets() {
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    getLocationInWindow() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView || !nativeView.window)
            {return null;}
        const rect = nativeView.convertRectToView(nativeView.bounds, null);
        return {
            x: layout.toDeviceIndependentPixels(rect.origin.x),
            y: layout.toDeviceIndependentPixels(rect.origin.y),
        };
    }
    getLocationOnScreen() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView || !nativeView.window)
            {return null;}
        const rectInWindow = nativeView.convertRectToView(nativeView.bounds, null);
        const rectOnScreen = nativeView.window.convertRectToScreen(rectInWindow);
        return {
            x: layout.toDeviceIndependentPixels(rectOnScreen.origin.x),
            y: layout.toDeviceIndependentPixels(rectOnScreen.origin.y),
        };
    }
    getLocationRelativeTo(otherView) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView || !otherView || !otherView.nativeViewProtected)
            {return null;}
        const rect = nativeView.convertRectToView(nativeView.bounds, otherView.nativeViewProtected);
        return {
            x: layout.toDeviceIndependentPixels(rect.origin.x),
            y: layout.toDeviceIndependentPixels(rect.origin.y),
        };
    }
    _onSizeChanged() {
        // AppKit draws itself; nothing to do for the spike.
    }
    _setNativeClipToBounds() {
        const view = this.nativeViewProtected;
        if (view && view.wantsLayer !== undefined) {
            view.wantsLayer = true;
            if (view.layer)
                {view.layer.masksToBounds = true;}
        }
    }
    [opacityProperty.getDefault]() {
        return this.nativeViewProtected.alphaValue;
    }
    [opacityProperty.setNative](opacity) {
        this.nativeViewProtected.alphaValue = opacity;
    }
    _applyNativeTransform() {
        paintNativeScriptTransform(this.nativeViewProtected, this.style);
    }
    [rotateProperty.setNative]() { this._applyNativeTransform(); }
    [rotateXProperty.setNative]() { this._applyNativeTransform(); }
    [rotateYProperty.setNative]() { this._applyNativeTransform(); }
    [scaleXProperty.setNative]() { this._applyNativeTransform(); }
    [scaleYProperty.setNative]() { this._applyNativeTransform(); }
    [translateXProperty.setNative]() { this._applyNativeTransform(); }
    [translateYProperty.setNative]() { this._applyNativeTransform(); }
    [perspectiveProperty.setNative]() { this._applyNativeTransform(); }
    [backgroundInternalProperty.setNative](background) {
        this._redrawNativeBackground(background);
    }
    _redrawNativeBackground(background) {
        paintNativeScriptBackground(this.nativeViewProtected, background);
    }
    _childIndexToNativeChildIndex(index) {
        return index;
    }
}
export class ContainerView extends View {
    constructor() {
        super();
        this.iosOverflowSafeArea = true;
    }
}
export class CustomLayoutView extends ContainerView {
    _intrinsicSize;
    createNativeView() {
        const window = getWindow && getWindow();
        const frame = window ? window.contentView.frame : CGRectMake(0, 0, 0, 0);
        return createNativeScriptActionView(this, frame, () => this._intrinsicSize);
    }
    getMasonIntrinsicSize() {
        const child = this.layoutView;
        if (!child || child === this) {
            this._intrinsicSize = undefined;
            return;
        }
        const { measuredWidth, measuredHeight } = View.measureChild(
            this, child, layout.UNSPECIFIED, layout.UNSPECIFIED,
        );
        // AppKit can ask for intrinsic size while Mason is already computing.
        // Publish the resolved size without re-entering the engine.
        this._intrinsicSize = NSMakeSize(
            layout.toDeviceIndependentPixels(measuredWidth),
            layout.toDeviceIndependentPixels(measuredHeight),
        );
        return this._intrinsicSize;
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        // Layouts override this and compute measuredDimensions themselves.
    }
    _addViewToNativeVisualTree(child, atIndex) {
        super._addViewToNativeVisualTree(child, atIndex);
        const parentNativeView = this.nativeViewProtected;
        const childNativeView = child.nativeViewProtected;
        if (parentNativeView && childNativeView) {
            MacOSHelper.insertNativeSubview(parentNativeView, childNativeView, atIndex);
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
}
