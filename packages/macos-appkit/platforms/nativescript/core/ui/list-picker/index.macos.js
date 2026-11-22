// macOS Core provider: ListPicker for AppKit — NSPopUpButton
// with target-action selectedIndexChange, ported from
// ui/list-picker/index.ios.js.
import { ListPickerBase, itemsProperty, selectedIndexProperty, selectedValueProperty } from '@nativescript/core/ui/list-picker/list-picker-common';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/list-picker/list-picker-common';
const ListPickerTargetImpl = NSObject.extend({
    ['selected:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner) {
            selectedIndexProperty.nativeValueChange(owner, Number(sender.indexOfSelectedItem));
        }
    },
}, {
    name: 'NSCoreMacosListPickerTarget',
    exposedMethods: { 'selected:': { returns: interop.types.void, params: [interop.types.id] } },
});
export class ListPicker extends ListPickerBase {
    nativeViewProtected;
    _target;
    _updatingItems = false;
    createNativeView() {
        return NSPopUpButton.alloc().initWithFramePullsDown(CGRectMake(0, 0, 0, 0), false);
    }
    initNativeView() {
        super.initNativeView();
        this._target = ListPickerTargetImpl.new();
        this._target._weakOwner = new WeakRef(this);
        this.nativeViewProtected.target = this._target;
        this.nativeViewProtected.action = NSSelectorFromString('selected:');
        this._updateItems();
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
    _getItemTitle(index) {
        const items = this.items;
        if (!items || index < 0 || index >= items.length)
            {return '';}
        const item = this._getItemAsString ? this._getItemAsString(index) : items[index];
        return item == null ? '' : String(item);
    }
    _updateItems() {
        const nv = this.nativeViewProtected;
        if (!nv || this._updatingItems)
            {return;}
        this._updatingItems = true;
        try {
            nv.removeAllItems();
            const items = this.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    nv.addItemWithTitle(this._getItemTitle(i));
                }
            }
            const sel = this.selectedIndex;
            if (sel >= 0 && sel < nv.numberOfItems) {
                nv.selectItemAtIndex(sel);
            }
        }
        finally {
            this._updatingItems = false;
        }
    }
    [itemsProperty.getDefault]() {
        return null;
    }
    [itemsProperty.setNative](_value) {
        this._updateItems();
    }
    [selectedValueProperty.getDefault]() {
        return null;
    }
    [selectedValueProperty.setNative](_value) {
        this._updateItems();
    }
    [selectedIndexProperty.getDefault]() {
        return -1;
    }
    [selectedIndexProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv && !this._updatingItems) {
            nv.selectItemAtIndex(value < 0 ? -1 : value);
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nv = this.nativeViewProtected;
        if (nv) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const fit = nv.fittingSize;
            this.setMeasuredDimension(width, Math.max(fit.height || 26, 22));
        }
    }
}
