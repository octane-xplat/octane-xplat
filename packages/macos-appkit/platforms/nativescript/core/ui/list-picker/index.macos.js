// macOS Core provider: ListPicker for AppKit — NSPopUpButton
// with target-action selectedIndexChange, ported from
// ui/list-picker/index.ios.js.
import { ListPickerBase, itemsProperty, selectedIndexProperty } from '@nativescript/core/ui/list-picker/list-picker-common';
export * from '@nativescript/core/ui/list-picker/list-picker-common';
const ListPickerTargetImpl = NSObject.extend({
    ['selected:'](sender) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner?.isEnabled && sender === owner.nativeViewProtected) {
            const index = Number(sender.indexOfSelectedItem);
            owner.updateSelectedValue(index);
            selectedIndexProperty.nativeValueChange(owner, index);
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
            nv.removeAllItems();
        }
        if (this._target) {
            this._target._weakOwner = undefined;
            this._target = undefined;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
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
                    // NSPopUpButton.addItemWithTitle merges duplicate labels.
                    const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(
                        this._getItemAsString(i), null, '',
                    );
                    nv.menu.addItem(item);
                }
            }
            selectedIndexProperty.coerce(this);
            nv.selectItemAtIndex(this.selectedIndex);
            nv.invalidateIntrinsicContentSize();
            this.requestLayout();
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
    [selectedIndexProperty.getDefault]() {
        return -1;
    }
    [selectedIndexProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv && !this._updatingItems) {
            nv.selectItemAtIndex(value < 0 ? -1 : value);
        }
    }
}
