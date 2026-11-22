// macOS Core provider: TabView for AppKit — NSTabView with
// top tabs; each TabViewItem's Core view becomes the tab item's view.
// Works with the driver's syncTabViewItems: it sets `items` with
// TabViewItem instances carrying .view/.title.
import { TabViewBase, TabViewItemBase, itemsProperty, selectedIndexProperty } from '@nativescript/core/ui/tab-view/tab-view-common';
import { View, CSSType } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
export * from '@nativescript/core/ui/tab-view/tab-view-common';
const TabViewDelegateImpl = NSObject.extend({
    ['tabView:didSelectTabViewItem:'](_tabView, _item) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner) {
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
    get ios() {
        return undefined;
    }
    get macos() {
        return null;
    }
    _update() {
        const parent = this.parent;
        if (parent && parent._updateItemLabel) {
            parent._updateItemLabel(this);
        }
    }
}
export class TabView extends TabViewBase {
    nativeViewProtected;
    _delegate;
    _itemViews = new Map();
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
        }
        this._itemViews.clear();
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
    _updateItemLabel(item) {
        const nv = this.nativeViewProtected;
        const index = this.items ? this.items.indexOf(item) : -1;
        if (nv && index >= 0 && index < nv.numberOfTabViewItems) {
            nv.tabViewItemAtIndex(index).label = item.title || '';
        }
    }
    _updateItems() {
        const nv = this.nativeViewProtected;
        if (!nv)
            {return;}
        while (nv.numberOfTabViewItems > 0) {
            nv.removeTabViewItem(nv.tabViewItemAtIndex(0));
        }
        this._itemViews.clear();
        const items = this.items;
        if (!items)
            {return;}
        for (const item of items) {
            const tabItem = NSTabViewItem.alloc().initWithIdentifier(item.title || '');
            tabItem.label = item.title || '';
            const itemView = NSView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
            if (item.view) {
                if (!item.view.parent) {
                    this._addView(item.view);
                }
                const nv2 = item.view.nativeViewProtected;
                if (nv2) {
                    nv2.autoresizingMask = 18; // width|height sizable
                    itemView.addSubview(nv2);
                    this._itemViews.set(item, nv2);
                }
            }
            tabItem.view = itemView;
            nv.addTabViewItem(tabItem);
        }
        const sel = this.selectedIndex;
        if (sel >= 0 && sel < nv.numberOfTabViewItems) {
            nv.selectTabViewItemAtIndex(sel);
        }
        else if (nv.numberOfTabViewItems > 0) {
            nv.selectTabViewItemAtIndex(0);
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
        if (nv && value >= 0 && value < nv.numberOfTabViewItems) {
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
        const items = this.items;
        if (!items)
            {return;}
        const width = right - left;
        const height = bottom - top;
        for (const item of items) {
            if (item.view) {
                View.layoutChild(this, item.view, 0, 0, width, height);
            }
        }
    }
}
