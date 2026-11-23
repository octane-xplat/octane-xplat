export * from '@nativescript/core/ui/action-bar/action-bar-common';
import { ActionBarBase, ActionItemBase, flatProperty } from '@nativescript/core/ui/action-bar/action-bar-common';
import { View } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
import { registerGestureClass } from '../../../../../src/gestures';

class ActionBarHost extends NSView {
    get intrinsicContentSize() {
        const size = this._owner?.deref()?.getMasonIntrinsicSize();
        return size ? NSMakeSize(size.width, size.height) : super.intrinsicContentSize;
    }
}
registerGestureClass(ActionBarHost);

class NativeTitleView extends View {
    constructor(view) {
        super();
        this._title = view;
        this._preferredSize = view.frame.size;
    }

    createNativeView() {
        if (this._title.superview) {
            throw new Error('AppKit ActionBar titleView already belongs to another host');
        }
        return this._title;
    }

    onMeasure(widthSpec, heightSpec) {
        super.onMeasure(widthSpec, heightSpec);
        const intrinsic = this._title.intrinsicContentSize;
        const preferredWidth = intrinsic.width < 0 ? layout.toDevicePixels(this._preferredSize.width) : 0;
        const preferredHeight = intrinsic.height < 0 ? layout.toDevicePixels(this._preferredSize.height) : 0;
        this.setMeasuredDimension(
            View.resolveSizeAndState(Math.max(this.getMeasuredWidth(), preferredWidth), layout.getMeasureSpecSize(widthSpec), layout.getMeasureSpecMode(widthSpec), 0),
            View.resolveSizeAndState(Math.max(this.getMeasuredHeight(), preferredHeight), layout.getMeasureSpecSize(heightSpec), layout.getMeasureSpecMode(heightSpec), 0),
        );
    }
}

export class ActionBar extends ActionBarBase {
    get titleView() {
        return super.titleView;
    }

    set titleView(value) {
        if (value instanceof NSView) {
            const current = super.titleView;
            if (current instanceof NativeTitleView && current.nativeViewProtected === value) {
                return;
            }
            const host = this.nativeViewProtected;
            if (value === host || host?.isDescendantOf(value) || value.superview) {
                throw new Error('AppKit ActionBar titleView already belongs to a host or would create a cycle');
            }
            value = new NativeTitleView(value);
        }
        else if (value != null && !(value instanceof View)) {
            throw new TypeError('ActionBar titleView must be a NativeScript View or AppKit NSView');
        }
        super.titleView = value;
    }

    createNativeView() {
        return ActionBarHost.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
    }

    initNativeView() {
        super.initNativeView();
        this.nativeViewProtected._owner = new WeakRef(this);
        this._label = NSTextField.labelWithString('');
        this._label.alignment = 2; // NSTextAlignmentCenter
        this[flatProperty.setNative](this.flat);
        this.update();
    }

    disposeNativeView() {
        try {
            this._label?.removeFromSuperview();
        }
        finally {
            this._label = undefined;
            this.nativeViewProtected._owner = undefined;
            super.disposeNativeView();
        }
    }

    [flatProperty.setNative](flat) {
        const native = this.nativeViewProtected;
        native.wantsLayer = true;
        native.layer.shadowOpacity = flat ? 0 : 0.2;
        native.layer.shadowRadius = flat ? 0 : 1;
    }

    _onTitlePropertyChanged() {
        this.update();
    }

    update() {
        const label = this._label;
        if (!label) {
            return;
        }
        if (this.titleView) {
            label.removeFromSuperview();
        }
        else {
            label.stringValue = this.title ?? '';
            if (!label.superview) {
                this.nativeViewProtected.addSubview(label);
            }
        }
        this.nativeViewProtected.invalidateIntrinsicContentSize();
        this.requestLayout();
    }

    _addViewToNativeVisualTree(child, atIndex) {
        super._addViewToNativeVisualTree(child, atIndex);
        if (child === this.titleView && child.nativeViewProtected) {
            this.nativeViewProtected.addSubview(child.nativeViewProtected);
        }
        return true;
    }

    _removeViewFromNativeVisualTree(child) {
        super._removeViewFromNativeVisualTree(child);
        child.nativeViewProtected?.removeFromSuperview();
    }

    _measureTitle(widthSpec, heightSpec) {
        const size = this.titleView
            ? View.measureChild(this, this.titleView, widthSpec, heightSpec)
            : {
                measuredWidth: layout.toDevicePixels(this._label?.fittingSize.width ?? 0),
                measuredHeight: layout.toDevicePixels(this._label?.fittingSize.height ?? 0),
            };
        return {
            width: Math.max(this.effectiveMinWidth || 0, size.measuredWidth),
            height: Math.max(this.effectiveMinHeight || 0, size.measuredHeight, layout.toDevicePixels(44)),
        };
    }

    getMasonIntrinsicSize() {
        const { width, height } = this._measureTitle(layout.UNSPECIFIED, layout.UNSPECIFIED);
        return { width: layout.toDeviceIndependentPixels(width), height: layout.toDeviceIndependentPixels(height) };
    }

    onMeasure(widthSpec, heightSpec) {
        const { width, height } = this._measureTitle(widthSpec, heightSpec);
        this.setMeasuredDimension(
            View.resolveSizeAndState(width, layout.getMeasureSpecSize(widthSpec), layout.getMeasureSpecMode(widthSpec), 0),
            View.resolveSizeAndState(height, layout.getMeasureSpecSize(heightSpec), layout.getMeasureSpecMode(heightSpec), 0),
        );
    }

    onLayout(left, top, right, bottom) {
        const width = right - left;
        const height = bottom - top;
        if (this.titleView) {
            const title = this.titleView;
            View.layoutChild(this, title, 0, 0, width, height);
            const native = title.nativeViewProtected;
            const placement = title._cachedFrame;
            if (native && placement) {
                // Use Core's logical placement so repeated layouts never
                // expand an already adjusted AppKit frame.
                const { origin, size } = placement;
                const parentHeight = this.nativeViewProtected.bounds.size.height;
                const rect = CGRectMake(origin.x, parentHeight - origin.y - size.height, size.width, size.height);
                const frame = native.frameForAlignmentRect(rect);
                if (!CGRectEqualToRect(native.frame, frame)) {
                    native.frame = frame;
                }
            }
        }
        else if (this._label) {
            const bounds = this.nativeViewProtected.bounds.size;
            const labelHeight = Math.min(bounds.height, this._label.fittingSize.height);
            this._label.frame = CGRectMake(0, (bounds.height - labelHeight) / 2, bounds.width, labelHeight);
        }
    }
}
export class ActionItem extends ActionItemBase {
}
export class NavigationButton extends ActionItemBase {
}
