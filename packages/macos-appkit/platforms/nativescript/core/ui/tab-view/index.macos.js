// macOS Core provider: TabView for AppKit — NSTabView with
// top tabs; each TabViewItem's Core view becomes the tab item's view.
// Works with the driver's syncTabViewItems: it sets `items` with
// TabViewItem instances carrying .view/.title.
import { TabViewBase, TabViewItemBase, itemsProperty, selectedIndexProperty } from '@nativescript/core/ui/tab-view/tab-view-common';
import { View } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
import { nativeColor } from '../../../../../src/native-colors';
import { cancelTabIcon, IconTabItem, updateTabIcon } from '../../../../../src/tab-item-native';
export * from '@nativescript/core/ui/tab-view/tab-view-common';
const TabViewDelegateImpl = NSObject.extend({
    ['tabView:didSelectTabViewItem:'](_tabView, _item) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner && !owner._updatingItems) {
            const nv = owner.nativeViewProtected;
            selectedIndexProperty.nativeValueChange(owner, Number(nv.indexOfTabViewItem(nv.selectedTabViewItem)));
        }
    },
}, {
    name: 'NSCoreMacosTabViewDelegate',
    protocols: [NSTabViewDelegate],
    exposedMethods: {
        'tabView:didSelectTabViewItem:': { returns: interop.types.void, params: [interop.types.id, interop.types.id] },
    },
});
export class TabViewItem extends TabViewItemBase {
    canBeLoaded = true;
    _nativeItem;
    _tabOwner = null;
    _publishTarget = false;
    _disposed = false;
    get ios() {
        return undefined;
    }
    get macos() {
        return this._nativeItem ?? null;
    }
    _getNativeItem() {
        if (!this._nativeItem) {
            this._nativeItem = IconTabItem.alloc().initWithIdentifier(String(this._domId));
            const content = NSView.new();
            content.autoresizingMask = 18; // width|height sizable
            this._nativeItem.view = content;
            this._update();
        }
        return this._nativeItem;
    }
    _update() {
        const item = this._nativeItem;
        if (!item) {
            return;
        }
        item.label = this.title || '';
        updateTabIcon(item, this.iconSource, this.style, nativeColor, () => {
            const tabView = this._tabOwner?.nativeViewProtected;
            if (tabView) {
                tabView.needsDisplay = true;
            }
        });
        const tabView = this._tabOwner?.nativeViewProtected;
        if (tabView) {
            tabView.needsDisplay = true;
        }
    }
    _setTabOwner(owner) {
        if (this._tabOwner === owner) {
            return;
        }
        this._tabOwner = owner;
        // An items update can move a tab between two owners in the same commit.
        // Send only the final target so the existing Octane portal stays mounted.
        if (!this._publishTarget) {
            this._publishTarget = true;
            queueMicrotask(() => {
                this._publishTarget = false;
                this.__onContentTarget?.(this._tabOwner ? this.macos?.view ?? null : null);
            });
        }
    }
    _releaseTabItem() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        const owner = this._tabOwner;
        if (owner) {
            owner.items = owner.items.filter((item) => item !== this);
        }
        if (this._nativeItem) {
            cancelTabIcon(this._nativeItem);
            this._nativeItem.view = null;
            this._nativeItem.image = null;
        }
    }
}
export class TabView extends TabViewBase {
    nativeViewProtected;
    _delegate;
    _updatingItems = false;
    createNativeView() {
        const tv = NSTabView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        tv.tabViewType = 0 /* NSTopTabsBezelBorder */;
        return tv;
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = TabViewDelegateImpl.new();
        this._delegate._weakOwner = new WeakRef(this);
        this.nativeViewProtected.delegate = this._delegate;
        this._updateItems();
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.delegate = null;
            this._clearNativeItems(nv);
        }
        for (const item of this.items ?? []) {
            if (item._tabOwner === this) {
                item._setTabOwner(null);
            }
        }
        this._delegate = null;
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    // Item content views attach to their NSTabViewItem's container, not the
    // tab view's direct subview list.
    _addViewToNativeVisualTree(_child, _atIndex) {
        return true;
    }
    eachChild(callback) {
        for (const item of this.items ?? []) {
            if (!item.__portalContent && item.parent === this && callback(item) === false) {
                return;
            }
        }
    }
    eachChildView(callback) {
        for (const item of this.items ?? []) {
            if (item.view && callback(item.view) === false) {
                return;
            }
        }
    }
    onItemsChanged(oldItems, newItems) {
        if (newItems != null && (!Array.isArray(newItems) ||
            newItems.some((item) => !(item instanceof TabViewItem) || item._disposed))) {
            throw new TypeError('TabView items must contain live TabViewItems');
        }
        for (const item of oldItems ?? []) {
            if (item._tabOwner === this && !newItems?.includes(item)) {
                item._setTabOwner(null);
            }
        }
        for (const item of newItems ?? []) {
            const previous = item._tabOwner;
            if (previous && previous !== this) {
                previous.items = previous.items.filter((entry) => entry !== item);
            }
        }
        // Raw items still use the Core child's lifecycle. Portal items own an
        // independent content root within the same Octane tree.
        super.onItemsChanged(
            oldItems?.filter((item) => !item.__portalContent && item.parent === this),
            newItems?.filter((item) => !item.__portalContent && item.view),
        );
    }
    _updateItems() {
        const nv = this.nativeViewProtected;
        if (!nv || this._updatingItems) {
            return;
        }
        // AppKit selects the first tab as it is added. Preserve the Core
        // request until the rebuilt tab list can represent it.
        this._updatingItems = true;
        try {
            this._replaceNativeItems(nv);
            selectedIndexProperty.coerce(this);
            if (this.selectedIndex >= 0 && this.selectedIndex < nv.numberOfTabViewItems) {
                nv.selectTabViewItemAtIndex(this.selectedIndex);
            }
        } finally {
            this._updatingItems = false;
        }
    }
    _clearNativeItems(nv) {
        while (nv.numberOfTabViewItems > 0) {
            nv.removeTabViewItem(nv.tabViewItemAtIndex(0));
        }
    }
    _replaceNativeItems(nv) {
        this._clearNativeItems(nv);
        for (const item of this.items ?? []) {
            const tabItem = item._getNativeItem();
            const content = item.view?.nativeViewProtected;
            if (content && content.superview !== tabItem.view) {
                content.autoresizingMask = 18; // width|height sizable
                tabItem.view.addSubview(content);
            }
            nv.addTabViewItem(tabItem);
            item._setTabOwner(this);
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
        if (nv && !this._updatingItems && value >= 0 && value < nv.numberOfTabViewItems) {
            nv.selectTabViewItemAtIndex(value);
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        // Selected item content fills the tab view's content rect; measure the
        // visible one so height can wrap content when the parent allows.
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        let mw = widthMode === layout.UNSPECIFIED ? 0 : width;
        let mh = heightMode === layout.UNSPECIFIED ? 0 : height;
        if (widthMode !== layout.EXACTLY || heightMode !== layout.EXACTLY) {
            const items = this.items;
            const sel = this.selectedIndex >= 0 ? this.selectedIndex : 0;
            const item = items && items[sel];
            if (item && item.view) {
                const size = View.measureChild(this, item.view, layout.makeMeasureSpec(width, widthMode === layout.UNSPECIFIED ? layout.UNSPECIFIED : layout.AT_MOST), layout.makeMeasureSpec(height, heightMode === layout.UNSPECIFIED ? layout.UNSPECIFIED : layout.AT_MOST));
                mw = Math.max(mw, size.measuredWidth);
                mh = Math.max(mh, size.measuredHeight + 28 /* tab bar */);
            }
        }
        this.setMeasuredDimension(mw, mh);
    }
    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        const content = this.nativeViewProtected.contentRect.size;
        const width = Math.max(0, layout.toDevicePixels(content.width));
        const height = Math.max(0, layout.toDevicePixels(content.height));
        const widthSpec = layout.makeMeasureSpec(width, layout.EXACTLY);
        const heightSpec = layout.makeMeasureSpec(height, layout.EXACTLY);
        for (const item of this.items ?? []) {
            if (item.view) {
                View.measureChild(this, item.view, widthSpec, heightSpec);
                View.layoutChild(this, item.view, 0, 0, width, height);
            }
        }
    }
}
