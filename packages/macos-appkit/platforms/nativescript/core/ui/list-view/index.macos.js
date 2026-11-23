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
import { Builder } from '@nativescript/core/ui/builder';
import * as coreUI from '@nativescript/core';
import { ProxyViewContainer, StackLayout } from '@nativescript/core';
import { layout } from '@nativescript/core/utils';
import { Color } from '@nativescript/core/color';
import { isFunction } from '@nativescript/core/utils/types';
import { View as MasonView } from '../../../mason/index';
import { FailureCollector } from '../../../../../src/failures';
import { unmountAppKitContentRoot } from '../../../../../src/nativescript-content-ownership';
export * from '@nativescript/core/ui/list-view/list-view-common';
const ITEMLOADING = ListViewBase.itemLoadingEvent;
const ITEMTAP = ListViewBase.itemTapEvent;
const LOADMORE = ListViewBase.loadMoreItemsEvent;
const CELL_ID = 'ListViewCell';
const DEFAULT_ROW_HEIGHT = 44;
let builderRegistered = false;
let nextPortalCellId = 0;

function registerBuilderElements() {
    if (!builderRegistered) {
        // The standalone JSC bundle has no NativeScript Vite module table.
        // Keep XML templates on the same Core classes as the JSX driver.
        globalThis.registerModule('@nativescript/core/ui', () => ({ ...coreUI, MasonView }));
        builderRegistered = true;
    }
}
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
        if (owner && row >= 0 && row === owner._rowCount() - 1) {
            owner.notify({ eventName: LOADMORE, object: owner });
        }
    },
    ['tableView:didRemoveRowView:forRow:'](_table, rowView, row) {
        this._listView()?._scheduleCellRetirement(rowView.viewAtColumn(0), row);
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
        'tableView:didRemoveRowView:forRow:': {
            returns: interop.types.void,
            params: [interop.types.id, interop.types.id, interop.types.int64],
        },
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
    _defaultGridColor;
    _defaultGridStyle;
    _refreshTable;
    _measuringRow = false;
    // native cell NSView -> bound Core view; per-row measured heights;
    // per-template measure cells so heightOfRow never binds unseen rows.
    _cellMap = new Map();
    _visibleCells = new Map();
    _factoryCells = new Map();
    _portalCells = new Map();
    _notifyPortal;
    _heightCache = new Map();
    _measureCells = new Map();
    _widthMeasureSpec = 0;
    _preparedTemplate;
    constructor() {
        super();
        // The JSX driver supplies a function, while Core Builder uses XML.
        this._defaultTemplate = {
            key: 'default',
            createView: () => {
                const template = this.itemTemplate;
                if (isFunction(template)) {
                    return template();
                }
                if (template) {
                    const prepared = this._preparedTemplate;
                    this._preparedTemplate = undefined;
                    return prepared ?? Builder.parse(template, this);
                }
            },
        };
        this._itemTemplatesInternal = [this._defaultTemplate];
    }
    get __onCellTarget() {
        return this._notifyPortal;
    }
    set __onCellTarget(notify) {
        if (this._notifyPortal !== notify) {
            this._notifyPortal = notify;
            for (const cell of this._portalCells.keys()) {
                this._releasePortal(cell);
            }
            this.refresh();
        }
    }
    get itemTemplate() {
        return super.itemTemplate;
    }
    set itemTemplate(template) {
        if (template === super.itemTemplate) {
            return;
        }
        let prepared;
        if (typeof template === 'string' && template) {
            registerBuilderElements();
            try {
                // Reject malformed templates while setting the property,
                // before AppKit can call into JS to ask for a row's height.
                prepared = Builder.parse(template, this);
            } catch (error) {
                throw new TypeError('Invalid AppKit ListView itemTemplate', { cause: error });
            }
        }
        this._preparedTemplate = prepared;
        super.itemTemplate = template;
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
        this._defaultGridColor = table.gridColor;
        this._defaultGridStyle = table.gridStyleMask;
        scroll.documentView = table;
        return scroll;
    }
    initNativeView() {
        super.initNativeView();
        const table = this.nativeViewProtected.documentView;
        this._tableView = table;
        this._delegate = ListViewDelegateImpl.new();
        this._delegate._owner = new WeakRef(this);
        table.dataSource = this._delegate;
        table.delegate = this._delegate;
        // Clicks dispatch to the target/action like the macos-appkit list —
        // more direct than observing selection-change notifications.
        table.target = this._delegate;
        table.action = NSSelectorFromString('itemClicked:');
    }
    disposeNativeView() {
        const table = this._tableView;
        this._tableView = undefined;
        this._refreshTable = undefined;
        if (table) {
            // Nil JS-backed delegate/dataSource/action before super's native
            // detach — a finalizer-time dealloc must never re-enter JS.
            table.target = null;
            table.action = null;
            table.dataSource = null;
            table.delegate = null;
        }
        if (this._delegate) {
            this._delegate._owner = undefined;
            this._delegate = undefined;
        }
        for (const cell of this._portalCells.keys()) {
            this._releasePortal(cell);
        }
        for (const cell of this._factoryCells.keys()) {
            this._releaseFactoryCell(cell);
        }
        for (const cell of this._cellMap.keys()) {
            this._releaseCoreCell(cell);
            cell.bindingContext = undefined;
        }
        this._visibleCells.clear();
        if (this.nativeViewProtected) {
            this.nativeViewProtected.documentView = null;
        }
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
        const clipWidth = Number(this._tableView?.superview?.bounds?.size?.width);
        return clipWidth > 0 ? clipWidth : 200;
    }
    _notifyItemLoading(view, index, nativeCell) {
        const args = { eventName: ITEMLOADING, object: this, index, view, appKitCell: nativeCell };
        this.notify(args);
        return args.view || this._getDefaultItemContent(index);
    }
    _releasePortal(cell) {
        const binding = this._portalCells.get(cell);
        if (binding) {
            this._portalCells.delete(cell);
            cell.bindingContext = undefined;
            const { notify, id, generation } = binding;
            queueMicrotask(() => notify({ type: 'release', id, generation }));
        }
    }
    _bindPortal(cell, index, item) {
        const existing = this._portalCells.get(cell);
        if (existing?.index === index && Object.is(existing.item, item)) {
            return;
        }
        const id = existing?.id ?? ++nextPortalCellId;
        const generation = (existing?.generation ?? 0) + 1;
        const notify = this._notifyPortal;
        const binding = { id, generation, notify, index, item };
        this._portalCells.set(cell, binding);
        cell.bindingContext = item;
        queueMicrotask(() => {
            if (this._portalCells.get(cell) === binding) {
                notify({ type: 'bind', id, generation, index, item, target: cell });
            }
        });
    }
    _releaseFactoryCell(cell) {
        const entry = this._factoryCells.get(cell);
        if (entry) {
            this._factoryCells.delete(cell);
            const failures = new FailureCollector();
            failures.run('list factory root', () => unmountAppKitContentRoot(entry.view));
            failures.run('list factory binding', () => { entry.view.bindingContext = undefined; });
            failures.run('list factory detach', () => entry.view.removeFromSuperview());
            failures.throwIfFailed();
        }
    }
    _releaseCoreCell(cell) {
        const entry = this._cellMap.get(cell);
        if (entry) {
            this._cellMap.delete(cell);
            const view = entry.view;
            if (view.parent === this) {
                this._removeView(view);
            } else if (view.nativeViewProtected?.superview === cell) {
                view.nativeViewProtected.removeFromSuperview();
            }
        }
    }
    _prepareCell(nativeCell, index) {
        const item = this._getDataItem(index);
        if (this._notifyPortal) {
            this._releaseCoreCell(nativeCell);
            this._releaseFactoryCell(nativeCell);
            this._bindPortal(nativeCell, index, item);
            this.notify({ eventName: ITEMLOADING, object: this, index, appKitCell: nativeCell });
            return null;
        }
        const template = this._getItemTemplate(index);
        const templateInput = template === this._defaultTemplate ? this.itemTemplate : template;
        const factory = this._factoryCells.get(nativeCell);
        if (factory && factory.templateInput === templateInput && Object.is(factory.item, item)) {
            return null;
        }
        this._releaseFactoryCell(nativeCell);
        const previous = this._cellMap.get(nativeCell);
        if (previous && previous.templateInput !== templateInput) {
            this._releaseCoreCell(nativeCell);
        }
        let view = this._cellMap.get(nativeCell)?.view ?? template.createView();
        if (view instanceof NSView) {
            this._factoryCells.set(nativeCell, {
                view, templateInput, item, index, height: Number(view.frame.size.height),
            });
            nativeCell.bindingContext = view.bindingContext = item;
            view.autoresizingMask = 18;
            nativeCell.addSubview(view);
            return null;
        }
        view = this._notifyItemLoading(view, index, nativeCell);
        if (view instanceof ProxyViewContainer) {
            const sp = new StackLayout();
            sp.addChild(view);
            view = sp;
        }
        if (!view.parent) {
            this._addView(view);
        }
        this._prepareItem(view, index);
        nativeCell.bindingContext = view.bindingContext;
        view._listViewItemIndex = index;
        const bound = this._cellMap.get(nativeCell)?.view;
        if (bound !== view) {
            this._releaseCoreCell(nativeCell);
            this._cellMap.set(nativeCell, { view, templateInput });
        }
        const nv = view.nativeViewProtected;
        if (nv && nv.superview !== nativeCell) {
            nv.removeFromSuperview();
            nv.autoresizingMask = 18; // NSViewWidthSizable | NSViewHeightSizable
            nativeCell.addSubview(nv);
        }
        return view;
    }
    _scheduleCellRetirement(cell, index) {
        if (!cell) {
            return;
        }
        const table = this._tableView;
        queueMicrotask(() => {
            if (this._tableView === table && Number(table.rowForView(cell)) !== index) {
                this._retireCell(cell, index);
            }
        });
    }
    _retireCell(cell, index) {
        if (cell && this._visibleCells.get(index) === cell) {
            this._visibleCells.delete(index);
            this._releasePortal(cell);
            this._releaseFactoryCell(cell);
            cell.bindingContext = undefined;
        }
    }
    // Keep the native host while a visible row changes data. AppKit can
    // recycle the host for another index after it removes the row.
    _viewForRow(tableView, index) {
        if (index < 0 || index >= this._rowCount()) {
            return NSView.new();
        }
        let cell = this._visibleCells.get(index);
        if (!cell) {
            cell = tableView.makeViewWithIdentifierOwner(CELL_ID, this._delegate);
            if (!cell) {
                cell = NSView.alloc().initWithFrame(CGRectMake(0, 0, this._tableWidth(), DEFAULT_ROW_HEIGHT));
                cell.identifier = CELL_ID;
            }
            this._visibleCells.set(index, cell);
            const view = this._prepareCell(cell, index);
            this._layoutCell(cell, view, index);
        }
        return cell;
    }
    _layoutCell(nativeCell, view, index) {
        const width = this._tableWidth();
        const rowHeight = this._heightOfRow(this._tableView, index);
        nativeCell.frame = CGRectMake(0, 0, width, rowHeight);
        if (view) {
            View.layoutChild(this, view, 0, 0, width, rowHeight);
        } else {
            const factory = this._factoryCells.get(nativeCell);
            if (factory) {
                factory.view.frame = CGRectMake(0, 0, width, rowHeight);
            }
        }
    }
    // Per-row height: explicit rowHeight > measured bound cell > template
    // estimate (one driver-bound measure cell per template key).
    _heightOfRow(tableView, index) {
        if (tableView !== this._tableView || index < 0 || index >= this._rowCount()) {
            return DEFAULT_ROW_HEIGHT;
        }
        const fixed = this._effectiveRowHeight;
        if (fixed > 0)
            {return fixed;}
        const cached = this._heightCache.get(index);
        if (cached !== undefined)
            {return cached;}
        if (this._notifyPortal) {
            return DEFAULT_ROW_HEIGHT;
        }
        // Binding a template can request layout and reenter AppKit's height
        // delegate before this row is cached. Let the outer measurement finish.
        if (this._measuringRow) {
            return DEFAULT_ROW_HEIGHT;
        }
        this._measuringRow = true;
        try {
            return this._measureRow(index);
        } finally {
            this._measuringRow = false;
        }
    }
    _measureRow(index) {
        const template = this._getItemTemplate(index);
        for (const factory of this._factoryCells.values()) {
            if (factory.index === index) {
                return factory.height || DEFAULT_ROW_HEIGHT;
            }
        }
        // External AppKit factory views have separate Octane roots. Create them
        // when AppKit actually asks for the row.
        if (template !== this._defaultTemplate) {
            return DEFAULT_ROW_HEIGHT;
        }
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
        const view = cellView ? this._cellMap.get(cellView)?.view : undefined;
        this.notify({ eventName: ITEMTAP, object: this, index: row, view, appKitCell: cellView });
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
        const table = this._tableView;
        if (!table || this._refreshTable === table) {
            return;
        }
        // AppKit can request row views and heights during reloadData. Wait
        // until the current Core batch or delegate callback finishes.
        this._refreshTable = table;
        queueMicrotask(() => {
            if (this._refreshTable === table) {
                this._refreshTable = undefined;
                const count = this._rowCount();
                for (const [index, cell] of this._visibleCells) {
                    if (index >= count) {
                        this._retireCell(cell, index);
                    } else {
                        const view = this._prepareCell(cell, index);
                        this._layoutCell(cell, view, index);
                    }
                }
                if (count !== Number(table.numberOfRows)) {
                    table.reloadData();
                }
            }
        });
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
        const templates = value ?? [];
        const selectedDefault = templates.find((template) => template.key === 'default') ?? this._defaultTemplate;
        this._itemTemplatesInternal = [selectedDefault, ...templates.filter((template) => template.key !== 'default')];
        this.refresh();
    }
    [rowHeightProperty.setNative](value) {
        this._heightCache.clear();
        this._tableView?.noteHeightOfRowsWithIndexesChanged(NSIndexSet.indexSetWithIndexesInRange({ location: 0, length: this._rowCount() }));
    }
    [separatorColorProperty.getDefault]() {
        return this._defaultGridColor;
    }
    [separatorColorProperty.setNative](value) {
        const table = this._tableView ?? this.nativeViewProtected?.documentView;
        if (!table)
            {return;}
        if (value instanceof Color) {
            table.gridColor = value.macos;
            table.gridStyleMask = 1; /* NSTableViewSolidHorizontalGridLineMask */
        } else {
            table.gridColor = this._defaultGridColor;
            table.gridStyleMask = this._defaultGridStyle;
        }
    }
}
