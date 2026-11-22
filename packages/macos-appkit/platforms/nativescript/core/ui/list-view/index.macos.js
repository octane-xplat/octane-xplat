// macOS Core provider: ListView for AppKit — NSScrollView +
// view-based NSTableView, single column, no header, no grid. Ported from
// ui/list-view/index.ios.js structure (data source + delegate, template
// cell reuse, itemLoading/itemTap/loadMoreItems, per-row height cache).
//
// GC-sweep constraint: delegate objects carry JS ObjC methods — keep the
// surface to the listed selectors and nil dataSource/delegate in
// disposeNativeView before the table can be finalized. No NSView.extend
// subclasses anywhere in this file.
import { ListViewBase, itemsProperty, itemTemplatesProperty, rowHeightProperty, separatorColorProperty, } from '@nativescript/core/ui/list-view/list-view-common';
import { View } from '@nativescript/core/ui/core/view';
import { ProxyViewContainer, StackLayout } from '@nativescript/core';
import { layout } from '@nativescript/core/utils';
import { Color } from '@nativescript/core/color';
import { isFunction } from '@nativescript/core/utils/types';
export * from '@nativescript/core/ui/list-view/list-view-common';
const ITEMLOADING = ListViewBase.itemLoadingEvent;
const ITEMTAP = ListViewBase.itemTapEvent;
const LOADMORE = ListViewBase.loadMoreItemsEvent;
const CELL_ID = 'ListViewCell';
const DEFAULT_ROW_HEIGHT = 44;
// NSObject.extend (not class + NativeClass): the bridge's ClassBuilder
// registers verbatim selectors from `exposedMethods`, and `protocols` is
// required — AppKit validates the data source's protocol conformance before
// treating the table as view-based. `objectValueForTableColumn:row:` must
// exist even for view-based tables or AppKit rejects the data source.
const ListViewDelegateImpl = NSObject.extend({
    ['tableView:objectValueForTableColumn:row:'](_table, _column, _row) {
        return null;
    },
    ['numberOfRowsInTableView:'](_table) {
        const owner = this._listView();
        return owner ? owner._rowCount() : 0;
    },
    ['tableView:viewForTableColumn:row:'](table, _column, row) {
        const owner = this._listView();
        return owner ? owner._viewForRow(table, row) : NSView.alloc().init();
    },
    ['tableView:heightOfRow:'](table, row) {
        const owner = this._listView();
        return owner ? owner._heightOfRow(table, row) : DEFAULT_ROW_HEIGHT;
    },
    ['itemClicked:'](table) {
        const owner = this._listView();
        if (!owner)
            {return;}
        const row = Number(table.clickedRow) >= 0 ? Number(table.clickedRow) : Number(table.selectedRow);
        owner._onRowSelected(row);
    },
    ['tableView:didAddRowView:forRow:'](_table, _rowView, row) {
        const owner = this._listView();
        if (owner && row >= owner._rowCount() - 1) {
            owner.notify({ eventName: LOADMORE, object: owner });
        }
    },
    _listView() {
        return this._owner ? this._owner.deref() : null;
    },
}, {
    name: 'NSCoreMacosListViewDelegate',
    protocols: [NSTableViewDataSource, NSTableViewDelegate],
    exposedMethods: {
        // NSInteger == int64 on arm64/x86_64; the bridge has no 'long'.
        'tableView:objectValueForTableColumn:row:': {
            returns: interop.types.id,
            params: [interop.types.id, interop.types.id, interop.types.int64],
        },
        'numberOfRowsInTableView:': { returns: interop.types.int64, params: [interop.types.id] },
        'tableView:viewForTableColumn:row:': {
            returns: interop.types.id,
            params: [interop.types.id, interop.types.id, interop.types.int64],
        },
        'tableView:heightOfRow:': {
            returns: interop.types.double,
            params: [interop.types.id, interop.types.int64],
        },
        'itemClicked:': { returns: interop.types.void, params: [interop.types.id] },
        'tableView:didAddRowView:forRow:': {
            returns: interop.types.void,
            params: [interop.types.id, interop.types.id, interop.types.int64],
        },
    },
});
export class ListView extends ListViewBase {
    nativeViewProtected;
    _tableView;
    _delegate;
    // native cell NSView -> bound Core view; per-row measured heights;
    // per-template measure cells so heightOfRow never binds unseen rows.
    _cellMap = new Map();
    _heightCache = new Map();
    _measureCells = new Map();
    _widthMeasureSpec = 0;
    constructor() {
        super();
        // Upstream's template gate keys on __UI_USE_EXTERNAL_RENDERER__; the
        // host defines it false, while the driver's renderItem path passes a
        // function itemTemplate — call it directly.
        const upstream = this._defaultTemplate.createView;
        this._defaultTemplate = {
            key: 'default',
            createView: () => (isFunction(this.itemTemplate) ? this.itemTemplate() : upstream.call(this)),
        };
        this._itemTemplatesInternal = [this._defaultTemplate];
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    get tableView() {
        return this._tableView;
    }
    createNativeView() {
        const scroll = NSScrollView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        scroll.hasVerticalScroller = true;
        scroll.hasHorizontalScroller = false;
        scroll.drawsBackground = false;
        scroll.autohidesScrollers = true;
        const table = NSTableView.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        table.headerView = null;
        table.rowSizeStyle = -1; /* NSTableViewRowSizeStyleCustom */
        const column = NSTableColumn.alloc().initWithIdentifier('main');
        table.addTableColumn(column);
        this._tableView = table;
        this._delegate = ListViewDelegateImpl.new();
        this._delegate._owner = new WeakRef(this);
        table.dataSource = this._delegate;
        table.delegate = this._delegate;
        // Clicks dispatch to the target/action like the macos-appkit list —
        // more direct than observing selection-change notifications.
        table.target = this._delegate;
        table.action = NSSelectorFromString('itemClicked:');
        scroll.documentView = table;
        return scroll;
    }
    disposeNativeView() {
        const table = this._tableView;
        if (table) {
            // Nil JS-backed delegate/dataSource/action before super's native
            // detach — a finalizer-time dealloc must never re-enter JS.
            table.target = null;
            table.action = null;
            table.dataSource = null;
            table.delegate = null;
        }
        this._cellMap.clear();
        this._heightCache.clear();
        this._measureCells.clear();
        super.disposeNativeView();
    }
    // Cells attach into their own row NSView, not the scrollview.
    _addViewToNativeVisualTree(_child, _atIndex) {
        return true;
    }
    _rowCount() {
        const items = this.items;
        if (!items)
            {return 0;}
        if (typeof items.length === 'number')
            {return items.length;}
        return 0;
    }
    _tableWidth() {
        const w = layout.getMeasureSpecSize(this.widthMeasureSpec || this._widthMeasureSpec);
        if (w > 0)
            {return w;}
        const clip = this._tableView?.superview; // NSClipView
        return clip ? clip.bounds.size.width : 200;
    }
    _notifyItemLoading(view, index) {
        const args = { eventName: ITEMLOADING, object: this, index, view };
        this.notify(args);
        return args.view || this._getDefaultItemContent(index);
    }
    // Creates or rebinds the Core view for a row. Returns { cell, view }.
    _prepareCell(nativeCell, index) {
        let view = this._cellMap.get(nativeCell) || null;
        if (!view) {
            view = this._getItemTemplate(index).createView();
        }
        view = this._notifyItemLoading(view, index);
        if (view instanceof ProxyViewContainer) {
            const sp = new StackLayout();
            sp.addChild(view);
            view = sp;
        }
        if (!view.parent) {
            this._addView(view);
        }
        this._prepareItem(view, index);
        view._listViewItemIndex = index;
        const bound = this._cellMap.get(nativeCell);
        if (bound !== view) {
            // Detach the stale bound view's native view from the cell.
            const boundNv = bound?.nativeViewProtected;
            if (boundNv && boundNv.superview === nativeCell)
                {boundNv.removeFromSuperview();}
            this._cellMap.set(nativeCell, view);
        }
        const nv = view.nativeViewProtected;
        if (nv && nv.superview !== nativeCell) {
            nv.removeFromSuperview();
            nv.autoresizingMask = 18; // NSViewWidthSizable | NSViewHeightSizable
            nativeCell.addSubview(nv);
        }
        return view;
    }
    // New or recycled native cell for the row.
    _viewForRow(tableView, index) {
        let nativeCell = tableView.makeViewWithIdentifierOwner(CELL_ID, this._delegate);
        if (!nativeCell) {
            nativeCell = NSView.alloc().initWithFrame(CGRectMake(0, 0, this._tableWidth(), DEFAULT_ROW_HEIGHT));
            nativeCell.identifier = CELL_ID;
        }
        const view = this._prepareCell(nativeCell, index);
        this._layoutCell(nativeCell, view, index);
        return nativeCell;
    }
    _layoutCell(nativeCell, view, index) {
        const width = this._tableWidth();
        const rowHeight = this._heightOfRow(this._tableView, index);
        nativeCell.frame = CGRectMake(0, 0, width, rowHeight);
        if (view) {
            View.layoutChild(this, view, 0, 0, width, rowHeight);
        }
    }
    // Per-row height: explicit rowHeight > measured bound cell > template
    // estimate (one driver-bound measure cell per template key).
    _heightOfRow(tableView, index) {
        const fixed = this._effectiveRowHeight;
        if (fixed > 0)
            {return fixed;}
        const cached = this._heightCache.get(index);
        if (cached !== undefined)
            {return cached;}
        const template = this._getItemTemplate(index);
        let measureView = this._measureCells.get(template.key);
        if (!measureView) {
            measureView = template.createView();
            measureView = this._notifyItemLoading(measureView, index);
            if (measureView instanceof ProxyViewContainer) {
                const sp = new StackLayout();
                sp.addChild(measureView);
                measureView = sp;
            }
            if (!measureView.parent)
                {this._addView(measureView);}
            this._measureCells.set(template.key, measureView);
        }
        this._prepareItem(measureView, index);
        const widthSpec = layout.makeMeasureSpec(this._tableWidth(), layout.AT_MOST);
        const heightSpec = layout.makeMeasureSpec(0, layout.UNSPECIFIED);
        const size = View.measureChild(this, measureView, widthSpec, heightSpec);
        const height = size.measuredHeight > 0 ? size.measuredHeight : DEFAULT_ROW_HEIGHT;
        this._heightCache.set(index, height);
        return height;
    }
    _onRowSelected(row) {
        if (row < 0)
            {return;}
        const cellView = this._tableView.viewAtColumnRowMakeIfNecessary(0, row, false);
        const view = cellView ? this._cellMap.get(cellView) : undefined;
        this.notify({ eventName: ITEMTAP, object: this, index: row, view });
    }
    scrollToIndex(index, animated = true) {
        this._tableView?.scrollRowToVisible(index);
    }
    scrollToIndexAnimated(index) {
        this.scrollToIndex(index, true);
    }
    isItemAtIndexVisible(index) {
        const table = this._tableView;
        if (!table)
            {return false;}
        const range = table.rowsInRect(table.visibleRect);
        return index >= range.location && index < range.location + range.length;
    }
    refresh() {
        this._heightCache.clear();
        this._tableView?.reloadData();
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        this._widthMeasureSpec = widthMeasureSpec;
        this.widthMeasureSpec = widthMeasureSpec;
        this.setMeasuredDimension(layout.getMeasureSpecSize(widthMeasureSpec), layout.getMeasureSpecMode(heightMeasureSpec) === layout.UNSPECIFIED
            ? DEFAULT_ROW_HEIGHT * Math.min(this._rowCount(), 8)
            : layout.getMeasureSpecSize(heightMeasureSpec));
    }
    [itemsProperty.setNative](value) {
        this.refresh();
    }
    [itemTemplatesProperty.setNative](value) {
        if (value) {
            this._itemTemplatesInternal = new Array(value.length + 1);
            this._itemTemplatesInternal[0] = this._defaultTemplate;
            for (let i = 0; i < value.length; i++) {
                this._itemTemplatesInternal[i + 1] = value[i];
            }
        }
        this.refresh();
    }
    [rowHeightProperty.setNative](value) {
        this._heightCache.clear();
        this._tableView?.noteHeightOfRowsWithIndexesChanged(NSIndexSet.indexSetWithIndexesInRange({ location: 0, length: this._rowCount() }));
    }
    [separatorColorProperty.setNative](value) {
        const table = this._tableView;
        if (!table)
            {return;}
        if (value instanceof Color) {
            table.gridColor = value.macos;
            table.gridStyleMask = 1; /* NSTableViewSolidHorizontalGridLineMask */
        }
        else {
            table.gridStyleMask = 0;
        }
    }
}
