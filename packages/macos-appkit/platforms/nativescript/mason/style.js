// Mason `Style` for Core-macOS — a Core-side port of the style-dict
// translation and engine bridge in
//   packages/macos-appkit/src/mason.ts
// at octane-xplat commit 30b8c9e4c91f0890e2179ed5b044ea89949294c0.
//
// `View`/`Scroll` (./index.ts) own a Style per container node; the
// nativescript-octane driver binds one per foreign leaf via `Style.fromView`.
// Engine calls go through libxplatmason.dylib's `xplatMasonHost` shim —
// `-invoke:args:` reached via performSelectorWithObjectWithObject, the only
// dynamic-dispatch path this bridge exposes. Node pointers cross as NSValue.
import { CssProperty, _getStyleProperties, unsetValue } from '@nativescript/core/ui/core/properties';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { layout } from '@nativescript/core/utils';
let host = null;
let initFailed = false;
export function masonHost() {
    if (host || initFailed) {
        return host;
    }
    host = NSThread.mainThread.threadDictionary.objectForKey('xplatMasonHost');
    if (!host) {
        console.warn('[core-macos/mason] libxplatmason.dylib is not loaded — masonview lays out nothing. Load it with dlopen(path, 2|8) before app JS.');
        initFailed = true;
        return null;
    }
    // AppKit frames and numeric lengths are points. Mason's CSS track parser
    // applies this scale to px/dip strings, so a Retina backing scale would
    // enlarge only grid tracks — pin it to 1 and convert at the Core boundary.
    invoke('scale', [1]);
    return host;
}
export function masonAvailable() {
    return masonHost() != null;
}
export function invoke(op, args = []) {
    if (!host) {
        return null;
    }
    return host.performSelectorWithObjectWithObject('invoke:args:', op, args);
}
// ── authored value → engine style dict ─────────────────────────────────────
// Numeric dims are points; "N%" becomes a fraction. Auto-typed slots use
// [0]=auto [1]=length [2]=percent; plain length slots use [0]=length
// [1]=percent (ported encoding, see XPLMason.m XDim/XDimAuto).
function autoDim(value) {
    if (value == null || value === unsetValue || value === 'auto') {
        return undefined;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? [1, value] : undefined;
    }
    if (typeof value === 'object') {
        // Core Length {value, unit} — 'px' is physical pixels, convert to dip.
        if (typeof value.value === 'number') {
            if (value.unit === 'px') {
                return [1, layout.toDeviceIndependentPixels(value.value)];
            }
            if (value.unit === '%') {
                return [2, value.value];
            }
            return [1, value.value]; // dip / unitless
        }
        return undefined;
    }
    if (typeof value === 'string') {
        const text = value.trim();
        const percent = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%$/);
        if (percent) {
            return [2, Number(percent[1]) / 100];
        }
        const points = Number(text.replace(/px$/, ''));
        return Number.isFinite(points) ? [1, points] : undefined;
    }
    return undefined;
}
function lenDim(value) {
    const dim = autoDim(value);
    if (!dim) {
        return undefined;
    }
    return dim[0] === 2 ? [1, dim[1]] : dim[0] === 1 ? [0, dim[1]] : undefined;
}
const ENUM_STYLE_KEYS = new Set(['display', 'position', 'direction', 'flexDirection', 'flexWrap', 'overflow', 'overflowX', 'overflowY', 'alignItems', 'alignSelf', 'alignContent', 'justifyItems', 'justifySelf', 'justifyContent', 'textAlign', 'boxSizing', 'gridAutoFlow']);
const DIM_AUTO_KEYS = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'flexBasis'];
const DIM_EDGES = ['top', 'left', 'right', 'bottom'];
const MARGIN_EDGES = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
const PADDING_EDGES = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
const NUMBER_STYLE_KEYS = new Set(['flexGrow', 'flexShrink', 'aspectRatio', 'scrollbarWidth']);
const GRID_STYLE_KEYS = new Set(['gridAutoRows', 'gridAutoColumns', 'gridColumn', 'gridColumnStart', 'gridColumnEnd', 'gridRow', 'gridRowStart', 'gridRowEnd', 'gridTemplateRows', 'gridTemplateColumns', 'gridArea', 'gridTemplateAreas']);
/** Style keys the driver and cases use on mason subtrees. Every key maps to a
 *  `view.style.<key>` write channel — either a CssProperty Core already owns
 *  or one registered below. */
export const MASON_STYLE_KEYS = [
    ...ENUM_STYLE_KEYS,
    ...GRID_STYLE_KEYS,
    ...NUMBER_STYLE_KEYS,
    ...DIM_AUTO_KEYS,
    ...DIM_EDGES,
    ...MARGIN_EDGES,
    ...PADDING_EDGES,
    'gap',
    'rowGap',
    'columnGap',
    'order',
    'visibility',
];
/** A Style's authored values → the engine style dict. `isScroll`/`horizontal`
 *  add the scroll-container defaults macos-appkit's styleDict applies. */
export function engineStyleDict(authored, opts = {}) {
    const out = {};
    const value = (key) => authored.get(key);
    for (const key of ENUM_STYLE_KEYS) {
        let v = value(key);
        // Mason's align maps take 'auto' (-1 parent default); the driver writes
        // 'normal' for core's auto alignment.
        if (v === 'normal' && (key === 'alignSelf' || key === 'justifySelf')) {
            v = 'auto';
        }
        if (typeof v === 'string') {
            out[key] = v;
        }
    }
    for (const key of DIM_AUTO_KEYS) {
        const dim = autoDim(value(key));
        if (dim) {
            out[key] = dim;
        }
    }
    for (const edge of DIM_EDGES) {
        const dim = autoDim(value(edge));
        if (dim) {
            (out.inset ??= {})[edge] = dim;
        }
    }
    let edgeSet = false;
    const margin = {};
    for (const key of MARGIN_EDGES) {
        const edge = key.slice('margin'.length).toLowerCase();
        const dim = autoDim(value(key));
        if (dim) {
            edgeSet = true;
            // dimension-with-auto slots: [1]=length (0=auto would center).
            margin[edge] = [1, dim[1]];
        }
    }
    if (edgeSet) {
        out.margin = margin;
    }
    edgeSet = false;
    const padding = {};
    for (const key of PADDING_EDGES) {
        const edge = key.slice('padding'.length).toLowerCase();
        const dim = lenDim(value(key));
        if (dim) {
            edgeSet = true;
            padding[edge] = dim;
        }
    }
    if (edgeSet) {
        out.padding = padding;
    }
    const gap = lenDim(value('gap'));
    const rowGap = lenDim(value('rowGap')) ?? gap;
    const columnGap = lenDim(value('columnGap')) ?? gap;
    if (rowGap) {
        out.gapRow = rowGap;
    }
    if (columnGap) {
        out.gapColumn = columnGap;
    }
    for (const key of NUMBER_STYLE_KEYS) {
        const v = value(key);
        if (typeof v === 'number' && Number.isFinite(v)) {
            out[key] = v;
        }
    }
    for (const key of GRID_STYLE_KEYS) {
        const v = value(key);
        if (typeof v === 'string') {
            out[key] = v;
        }
    }
    // visibility:collapse drops the layout slot like display:none.
    if (opts.collapsed) {
        out.display = 'none';
    }
    // Container roots establish the containing block for absolute children.
    out.position ??= 'relative';
    if (opts.scroll) {
        out.display ??= 'flex';
        out.flexDirection ??= opts.horizontal ? 'row' : 'column';
        // A scroll container's automatic minimum size is zero along its scroll
        // axis — otherwise the leaf measure becomes the shrink floor.
        if (opts.horizontal) {
            out.minWidth ??= [1, 0];
        }
        else {
            out.minHeight ??= [1, 0];
        }
    }
    return out;
}
// ── node lifecycle accounting ──────────────────────────────────────────────
// Every `node`/`mnode` op retains engine state (mnode also retains the AppKit
// view via __bridge_retained). `free` releases both — the counter exists so
// the case runner can prove removes/destroys don't leak.
export const masonNodes = { created: 0, freed: 0 };
export function liveMasonNodes() {
    return masonNodes.created - masonNodes.freed;
}
/** A `node` op container handle, counted for live-node accounting. */
export function newMasonNode() {
    const node = invoke('node');
    if (node) {
        masonNodes.created++;
    }
    return node;
}
// ── Style ──────────────────────────────────────────────────────────────────
const leafStyles = new WeakMap();
/** Free the engine leaf bound to a Core view, if any. Idempotent — safe to
 *  call from both the dispose hook and the post-sync orphan sweep. */
export function freeLeafStyle(view) {
    const entry = leafStyles.get(view);
    if (entry) {
        entry.style.free();
        leafStyles.delete(view);
    }
}
export class Style {
    /** Engine node this Style writes to — `node` op for containers, `mnode` for foreign leaves. */
    masonNode;
    /** The Core view this leaf styles (foreign leaf binding; null on container views). */
    leafView = null;
    ownerView = null;
    _authored = new Map();
    _batching = 0;
    _pending = false;
    freed = false;
    constructor(ownerView, masonNode) {
        this.ownerView = ownerView;
        this.masonNode = masonNode;
    }
    /** Driver-facing leaf binding: one mnode per (view, nativeView) pair. The
     *  same Style is reused for prop sync and for the parent's children op. */
    static fromView(view, nativeView) {
        if (!view || !nativeView || !masonHost()) {
            return undefined;
        }
        let entry = leafStyles.get(view);
        if (entry && (entry.native !== nativeView || entry.style.freed)) {
            entry.style.free();
            leafStyles.delete(view);
            entry = undefined;
        }
        if (!entry) {
            const node = invoke('mnode', [nativeView]);
            if (!node) {
                return undefined;
            }
            masonNodes.created++;
            const style = new Style(view, node);
            style.leafView = view;
            entry = { native: nativeView, style };
            leafStyles.set(view, entry);
        }
        // Free the mnode when the view's native tree tears down — the mnode
        // retains the AppKit view, so a dispose-time free also drops that ref.
        if (!view.__masonDisposePatched) {
            view.__masonDisposePatched = true;
            const origDispose = view.disposeNativeView;
            view.disposeNativeView = function (...args) {
                freeLeafStyle(view);
                return origDispose?.apply(this, args);
            };
        }
        return entry.style;
    }
    /** Flush this node's authored dict to the engine. Called by the compute
     *  root's subtree sync, before `compute`. */
    applyStyle(dictOverride) {
        if (this.freed || !this.masonNode) {
            return;
        }
        const owner = this.ownerView ?? this.leafView;
        const collapsed = this.leafView ? this.leafView.style?.visibility === 'collapse' : owner?.style?.visibility === 'collapse';
        const dict = dictOverride ?? engineStyleDict(this._authored, {
            scroll: owner?.__isMasonScroll === true,
            horizontal: owner?.__isMasonHorizontal === true,
            collapsed,
        });
        invoke('style', [this.masonNode, dict]);
        this._pending = false;
    }
    markDirty() {
        if (!this.freed && this.masonNode) {
            invoke('dirty', [this.masonNode]);
        }
    }
    free() {
        if (!this.freed && this.masonNode && host) {
            invoke('free', [this.masonNode]);
            masonNodes.freed++;
        }
        this.freed = true;
        this.masonNode = null;
    }
    get display() {
        return this._authored.get('display');
    }
    /** Batch a set of writes; a single requestLayout is issued at the end. */
    batch(fn) {
        this._batching++;
        try {
            fn();
        }
        finally {
            this._batching--;
            if (this._batching === 0 && this._pending) {
                this.requestLayout();
            }
        }
    }
    _set(key, value) {
        if (value === undefined || value === unsetValue) {
            // Mason requires an explicit grid reset (masoncore parity).
            if (key === 'gridRow' || key === 'gridColumn') {
                this._authored.set(key, 'auto');
            }
            else {
                this._authored.delete(key);
            }
        }
        else {
            this._authored.set(key, value);
        }
        this._pending = true;
        if (this._batching === 0) {
            this.requestLayout();
        }
    }
    requestLayout() {
        const view = this.leafView ?? this.ownerView;
        view?.requestLayout?.();
    }
}
// Accessors for every mason style key — the driver's leaf sync writes via
// Reflect.set(leaf, key, value); the Views write via the _styleHelper hook.
for (const key of new Set(MASON_STYLE_KEYS)) {
    if (key === 'visibility') {
        continue; // tracked via collapsed flag, not an engine key
    }
    Object.defineProperty(Style.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
            return this._authored.get(key);
        },
        set(value) {
            this._set(key, value);
        },
    });
}
// ── CssProperty registration ───────────────────────────────────────────────
// The driver writes container layout through `view.style.<key>` and syncs
// leaves via `view.style.on('<key>Change')`. Every key needs a real
// CssProperty so object styles, `setInlineStyle` cssNames, prop removal
// (unsetValue restore) and `css:<key>` source writes all work. Keys Core
// already registers (margins, padding, gap, width/height, flexbox keys when
// flexbox-layout is imported) are left alone.
const MASON_CSS_PROPS = [
    ['display', 'display'],
    ['position', 'position'],
    ['inset', 'inset'],
    ['left', 'left'],
    ['top', 'top'],
    ['right', 'right'],
    ['bottom', 'bottom'],
    ['overflow', 'overflow'],
    ['overflowX', 'overflow-x'],
    ['overflowY', 'overflow-y'],
    ['flexBasis', 'flex-basis'],
    ['aspectRatio', 'aspect-ratio'],
    ['justifySelf', 'justify-self'],
    ['justifyItems', 'justify-items'],
    ['textAlign', 'text-align'],
    ['boxSizing', 'box-sizing'],
    ['scrollbarWidth', 'scrollbar-width'],
    ['gridRow', 'grid-row'],
    ['gridColumn', 'grid-column'],
    ['gridRowStart', 'grid-row-start'],
    ['gridRowEnd', 'grid-row-end'],
    ['gridColumnStart', 'grid-column-start'],
    ['gridColumnEnd', 'grid-column-end'],
    ['gridArea', 'grid-area'],
    ['gridTemplateRows', 'grid-template-rows'],
    ['gridTemplateColumns', 'grid-template-columns'],
    ['gridTemplateAreas', 'grid-template-areas'],
    ['gridAutoFlow', 'grid-auto-flow'],
    ['gridAutoRows', 'grid-auto-rows'],
    ['gridAutoColumns', 'grid-auto-columns'],
    ['order', 'order'],
    // Core's flexbox-layout registers these on Style, but only when that
    // module is imported — this provider's index does not import it.
    ['flexDirection', 'flex-direction'],
    ['flexWrap', 'flex-wrap'],
    ['justifyContent', 'justify-content'],
    ['alignItems', 'align-items'],
    ['alignContent', 'align-content'],
    ['alignSelf', 'align-self'],
    ['flexGrow', 'flex-grow'],
    ['flexShrink', 'flex-shrink'],
];
let registered = false;
export function ensureMasonStyleProperties() {
    if (registered) {
        return;
    }
    registered = true;
    const existing = new Set(_getStyleProperties().map((p) => p.name));
    for (const [name, cssName] of MASON_CSS_PROPS) {
        if (existing.has(name)) {
            continue;
        }
        // No defaultValue: an unset key must read as unset (auto) so the
        // engine's own default applies, and `display:block`-style writes still
        // register (mason-core makes the same choice for `display`).
        new CssProperty({
            name,
            cssName,
            affectsLayout: globalThis.__NS_CAP__?.propertyChangesRequestLayout === true,
        }).register(CoreStyle);
    }
}
ensureMasonStyleProperties();
