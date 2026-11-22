// macOS Core provider: SegmentedBar for AppKit —
// NSSegmentedControl with target-action selectedIndexChanged, ported from
// ui/segmented-bar/index.ios.js. Per-segment colors/fonts have no direct
// NSSegmentedControl API — gap.
import { SegmentedBarBase, SegmentedBarItemBase, itemsProperty, selectedIndexProperty } from '@nativescript/core/ui/segmented-bar/segmented-bar-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/segmented-bar/segmented-bar-common';
const SegmentedBarTargetImpl = NSObject.extend({
    ['selected:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner) {
            selectedIndexProperty.nativeValueChange(owner, Number(sender.selectedSegment));
        }
    },
}, {
    name: 'NSCoreMacosSegmentedBarTarget',
    exposedMethods: { 'selected:': { returns: interop.types.void, params: [interop.types.id] } },
});
export class SegmentedBarItem extends SegmentedBarItemBase {
    _update() {
        const parent = this.parent;
        if (parent && parent._updateSegments) {
            parent._updateSegments();
        }
    }
}
export class SegmentedBar extends SegmentedBarBase {
    nativeViewProtected;
    _target;
    get items() {
        return super.items;
    }
    set items(items) {
        super.items = Array.isArray(items) ? items.map((item) => {
            if (item instanceof SegmentedBarItemBase) {
                return item;
            }
            const segment = new SegmentedBarItem();
            segment.title = item?.title;
            return segment;
        }) : items;
        selectedIndexProperty.coerce(this);
    }
    getChildrenCount() {
        return this.items?.length ?? 0;
    }
    insertChild(item, index) {
        if (!(item instanceof SegmentedBarItemBase)) {
            throw new TypeError('AppKit segmentedbar can only host segmentedbaritem children');
        }
        const items = [...(this.items ?? [])];
        items.splice(index, 0, item);
        this.items = items;
    }
    removeChild(item) {
        this.items = (this.items ?? []).filter((child) => child !== item);
    }
    createNativeView() {
        const control = NSSegmentedControl.segmentedControlWithLabelsTrackingModeTargetAction([], 0 /* NSSegmentSwitchTrackingSelectOne */, null, null);
        return control;
    }
    initNativeView() {
        super.initNativeView();
        this._target = SegmentedBarTargetImpl.new();
        this._target._weakOwner = new WeakRef(this);
        this.nativeViewProtected.target = this._target;
        this.nativeViewProtected.action = NSSelectorFromString('selected:');
        this._updateSegments();
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.target = null;
            nv.action = null;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    _updateSegments() {
        const nv = this.nativeViewProtected;
        if (!nv)
            {return;}
        const items = this.items;
        const count = items ? items.length : 0;
        nv.segmentCount = count;
        for (let i = 0; i < count; i++) {
            nv.setLabelForSegment(items[i].title || '', i);
        }
        if (this.selectedIndex >= 0 && this.selectedIndex < count) {
            nv.selectedSegment = this.selectedIndex;
        }
        this.requestLayout();
    }
    [itemsProperty.getDefault]() {
        return null;
    }
    [itemsProperty.setNative](_value) {
        this._updateSegments();
    }
    [selectedIndexProperty.getDefault]() {
        return -1;
    }
    [selectedIndexProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv && value >= 0 && value < nv.segmentCount) {
            nv.selectedSegment = value;
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nv = this.nativeViewProtected;
        if (nv) {
            const fit = nv.fittingSize;
            const width = View.resolveSizeAndState(layout.toDevicePixels(fit.width), layout.getMeasureSpecSize(widthMeasureSpec), layout.getMeasureSpecMode(widthMeasureSpec), 0);
            const height = View.resolveSizeAndState(layout.toDevicePixels(Math.max(fit.height || 22, 22)), layout.getMeasureSpecSize(heightMeasureSpec), layout.getMeasureSpecMode(heightMeasureSpec), 0);
            this.setMeasuredDimension(width, height);
        }
    }
}
