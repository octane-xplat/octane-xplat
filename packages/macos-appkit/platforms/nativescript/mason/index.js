// Mason `View`/`Scroll` for Core-macOS — a Core-side port of the subtree
// sync, flat-record walk and scroll sizing in
//   packages/macos-appkit/src/mason.ts  (syncMasonTree, applyRecords,
//   layoutMasonChildren) and packages/macos-appkit/src/scroll-view.ts
//   (scrollAxes) at octane-xplat commit
//   30b8c9e4c91f0890e2179ed5b044ea89949294c0.
//
// Layout model: a mason View whose parent isn't a mason View is the compute
// root. Its onMeasure flushes every descendant's style + child list to
// libxplatmason.dylib, runs `compute` on the (px→dip) specs, then walks the
// flat preorder `layout` records to give each direct child an EXACTLY spec
// and each masonry child its parent-relative frame. Nested masonry views
// never recompute — they read the boxes the root's last compute assigned.
// Parity caveat vs iOS MasonKit: foreign leaves measure through the AppKit
// view's own fitting size (mnode), not through Core's measure.
import { LayoutBase } from '@nativescript/core/ui/layouts/layout-base';
import { ScrollView } from '@nativescript/core/ui/scroll-view';
import { View as CoreView } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
import { MASON_STYLE_KEYS, Style, engineStyleDict, freeLeafStyle, invoke, masonHost, masonNodes, newMasonNode, liveMasonNodes } from './style';
export { Style, invoke, masonHost, liveMasonNodes, masonNodes };
const RECORD = 22;
const MAX_CONTENT = -2; // mason's "compute at max-content" sentinel
const px = (dip) => layout.toDevicePixels(dip);
const dip = (pxv) => layout.toDeviceIndependentPixels(pxv);
function recordAt(flat, offset) {
    return {
        x: Number(flat.objectAtIndex(offset + 1)) || 0,
        y: Number(flat.objectAtIndex(offset + 2)) || 0,
        w: Number(flat.objectAtIndex(offset + 3)) || 0,
        h: Number(flat.objectAtIndex(offset + 4)) || 0,
        childCount: Number(flat.objectAtIndex(offset + 21)) || 0,
    };
}
const isMasonry = (view) => view != null && view.__isMasonContainer === true;
function masonryChildren(view) {
    const out = [];
    view.eachLayoutChild?.((child) => out.push(child));
    return out;
}
/** Syncs `view`'s subtree into the engine — styles every node, rebuilds
 *  children arrays, marks leaves dirty so the engine re-measures them each
 *  pass. Dropped children are collected into `dropped` for the root's
 *  post-sync free sweep. Ported from syncMasonTree/syncMasonNode. */
function syncMasonTree(view, dropped) {
    const helper = view._styleHelper;
    if (!helper || !helper.masonNode) {
        return null;
    }
    const isScroll = view.__isMasonScroll === true;
    // A scrollview as the compute root strips authored dims (content must not
    // be capped by the chrome box); as a nested child it keeps them — the
    // parent compute sizes the chrome, then computeScrollContent re-styles
    // and re-computes the content. Same authored↔content oscillation as
    // macos-appkit's applyMasonStyle.
    helper.applyStyle(isScroll && isMasonry(view.parent) ? chromeDict(view, helper) : isScroll ? scrollContentDict(view, helper) : rootDict(view, helper));
    const order = [];
    const handles = [];
    for (const child of masonryChildren(view)) {
        let handle;
        if (isMasonry(child)) {
            handle = syncMasonTree(child, dropped);
        }
        else {
            const leaf = child.nativeViewProtected ? Style.fromView(child, child.nativeViewProtected) : undefined;
            handle = leaf?.masonNode;
            if (handle) {
                leaf.applyStyle();
                invoke('dirty', [handle]); // re-measure every pass
            }
        }
        if (handle) {
            handles.push(handle);
            order.push(child);
        }
    }
    const previous = view.__masonOrder ?? [];
    if (previous.length !== order.length || order.some((c, i) => previous[i] !== c)) {
        invoke('children', [helper.masonNode, handles]);
        for (const child of previous) {
            if (!order.includes(child)) {
                dropped.push(child);
            }
        }
    }
    view.__masonOrder = order;
    return helper.masonNode;
}
/** Free the engine nodes of a view subtree that left every mason parent.
 *  `child.parent === view` identifies children still inside this subtree —
 *  a reparented child points at its new container and survives. */
function freeOrphanedSubtree(view) {
    if (isMasonry(view)) {
        for (const child of view.__masonOrder ?? []) {
            if (child.parent === view) {
                freeOrphanedSubtree(child);
            }
        }
        view.__masonOrder = [];
        view._styleHelper?.free();
    }
    else {
        freeLeafStyle(view);
    }
}
function sweepDropped(dropped) {
    for (const view of dropped) {
        if (!isMasonry(view?.parent)) {
            freeOrphanedSubtree(view);
        }
    }
}
/** Style dict for a container — injects the measure spec as explicit dims
 *  when nothing authored a dimension, so children stretch against it. */
function rootDict(view, helper) {
    const dict = engineStyleDict(helper._authored, {
        scroll: false,
        horizontal: view.__isMasonHorizontal === true,
        collapsed: view.style?.visibility === 'collapse',
    });
    const spec = view.__masonSpec;
    if (spec) {
        if (dict.width == null && spec.widthMode !== layout.UNSPECIFIED) {
            dict.width = [1, dip(spec.width)];
        }
        if (dict.height == null && spec.heightMode !== layout.UNSPECIFIED) {
            dict.height = [1, dip(spec.height)];
        }
    }
    return dict;
}
/** Scroll chrome dict for a scrollview nested in a mason parent — authored
 *  dims kept, so the parent compute sizes the NSScrollView box. The content
 *  pass re-styles with scrollContentDict before computing. */
function chromeDict(view, helper) {
    return engineStyleDict(helper._authored, {
        scroll: true,
        horizontal: view.__isMasonHorizontal === true,
        collapsed: view.style?.visibility === 'collapse',
    });
}
/** Scroll content compute: authored dims size the chrome in the parent and
 *  must not cap content — strip them (ported from layoutMasonChildren). */
function scrollContentDict(view, helper) {
    const dict = engineStyleDict(helper._authored, {
        scroll: true,
        horizontal: view.__isMasonHorizontal === true,
        collapsed: view.style?.visibility === 'collapse',
    });
    delete dict.width;
    delete dict.height;
    delete dict.minHeight;
    delete dict.maxHeight;
    delete dict.minWidth;
    delete dict.maxWidth;
    return dict;
}
/** Content compute for a scrollview nested inside a computed parent: the
 *  parent pass sized its chrome (authored dims); this re-styles the node
 *  with dims stripped and recomputes content at max-content along the
 *  scroll axis. Ported from the isScroll branch of layoutMasonChildren. */
function computeScrollContent(view) {
    const helper = view._styleHelper;
    if (!helper?.masonNode || !view.__masonOrder?.length) {
        return;
    }
    helper.applyStyle(scrollContentDict(view, helper));
    const clip = view._ownBox;
    const horizontal = view.__isMasonHorizontal === true;
    invoke('compute', [helper.masonNode, horizontal ? MAX_CONTENT : clip?.w ?? MAX_CONTENT, horizontal ? clip?.h ?? MAX_CONTENT : MAX_CONTENT]);
    const flat = invoke('layout', [helper.masonNode]);
    if (Number(flat?.count ?? 0) >= RECORD) {
        assignRecords(flat, RECORD, view);
    }
}
function runScrollContentPasses(view) {
    for (const child of view.__masonOrder ?? []) {
        if (!isMasonry(child)) {
            continue;
        }
        if (child.__isMasonScroll === true) {
            computeScrollContent(child);
        }
        runScrollContentPasses(child);
    }
}
/** Assigns each direct child its box (parent-relative points) and recurses
 *  into masonry children. Ported from applyRecords/skipSubtree. */
function assignRecords(flat, offset, view) {
    let next = offset;
    const boxes = new Map();
    for (const child of view.__masonOrder ?? []) {
        const rec = recordAt(flat, next);
        boxes.set(child, rec);
        child._ownBox = rec;
        next += RECORD;
        if (isMasonry(child)) {
            next = assignRecords(flat, next, child);
        }
        else {
            for (let i = 0; i < rec.childCount; i++) {
                next = skipSubtree(flat, next);
            }
        }
    }
    view._childBoxes = boxes;
    return next;
}
function skipSubtree(flat, offset) {
    const count = Number(flat.objectAtIndex(offset + 21)) || 0;
    let next = offset + RECORD;
    for (let i = 0; i < count; i++) {
        next = skipSubtree(flat, next);
    }
    return next;
}
function hookMasonStyles(view) {
    for (const key of MASON_STYLE_KEYS) {
        view.style.on?.(key + 'Change', () => {
            view._styleHelper[key] = view.style[key];
        });
    }
}
/** onMeasure/onLayout shared by View and Scroll. */
function masonOnMeasure(view, widthSpec, heightSpec) {
    const widthMode = layout.getMeasureSpecMode(widthSpec);
    const heightMode = layout.getMeasureSpecMode(heightSpec);
    const width = layout.getMeasureSpecSize(widthSpec);
    const height = layout.getMeasureSpecSize(heightSpec);
    const isRoot = !isMasonry(view.parent);
    if (!isRoot || !masonHost() || view._styleHelper.freed) {
        // Nested masonry child: read the box the root's last compute assigned.
        const box = view._ownBox;
        if (box) {
            view.setMeasuredDimension(px(box.w), px(box.h));
        }
        else {
            view.setMeasuredDimension(widthMode === layout.UNSPECIFIED ? 0 : width, heightMode === layout.UNSPECIFIED ? 0 : height);
        }
        masonMeasureChildren(view);
        return;
    }
    view.__masonSpec = { width, widthMode, height, heightMode };
    const helper = view._styleHelper;
    const dropped = [];
    const root = syncMasonTree(view, dropped);
    // Post-sync: children arrays are updated, so freeing dropped nodes here
    // cannot leave a dangling handle in any engine child list.
    sweepDropped(dropped);
    if (!root) {
        view.setMeasuredDimension(width, height);
        return;
    }
    const horizontal = view.__isMasonHorizontal === true;
    if (view.__isMasonScroll) {
        invoke('compute', [root, horizontal ? MAX_CONTENT : dip(width), horizontal ? dip(height) : MAX_CONTENT]);
    }
    else {
        invoke('compute', [root, widthMode === layout.UNSPECIFIED ? MAX_CONTENT : dip(width), heightMode === layout.UNSPECIFIED ? MAX_CONTENT : dip(height)]);
    }
    const flat = invoke('layout', [root]);
    if (Number(flat?.count ?? 0) >= RECORD) {
        const rec = recordAt(flat, 0);
        view._ownBox = rec;
        assignRecords(flat, RECORD, view);
        view.setMeasuredDimension(CoreView.resolveSizeAndState(px(rec.w), width, widthMode, 0), CoreView.resolveSizeAndState(px(rec.h), height, heightMode, 0));
    }
    else {
        view.setMeasuredDimension(widthMode === layout.UNSPECIFIED ? 0 : width, heightMode === layout.UNSPECIFIED ? 0 : height);
    }
    // Scroll children nested in this subtree recompute content against their
    // chrome box (parent compute only sizes the chrome).
    runScrollContentPasses(view);
    masonMeasureChildren(view);
}
function masonMeasureChildren(view) {
    for (const child of view.__masonOrder) {
        const box = view._childBoxes.get(child);
        if (box) {
            const width = px(box.w);
            const height = px(box.h);
            if (!isMasonry(child) && child._childrenCount > 0) {
                // Core containers need to measure their own children. Mason
                // owns the container's box and delegates what is inside it.
                child.measure(
                    layout.makeMeasureSpec(width, layout.EXACTLY),
                    layout.makeMeasureSpec(height, layout.EXACTLY),
                );
            }
            else {
                // Simple native leaves already measured through AppKit. A Core
                // measure would change native wrapping and poison the next
                // intrinsicContentSize read.
                child.setMeasuredDimension(width, height);
            }
        }
        if (isMasonry(child) && child.__masonOrder?.length) {
            // Boxes cascade down the subtree — measured dims should too.
            masonMeasureChildren(child);
        }
    }
}
function masonOnLayout(view) {
    if (view.__isMasonScroll && view.nativeViewProtected?.documentView) {
        // Document grows along the scroll axis to the content extents; the
        // pinned axis keeps the clip size (ported scroll sizing).
        let contentW = 0;
        let contentH = 0;
        for (const child of view.__masonOrder) {
            const box = view._childBoxes.get(child);
            if (box) {
                contentW = Math.max(contentW, box.x + box.w);
                contentH = Math.max(contentH, box.y + box.h);
            }
        }
        const clip = view._ownBox;
        const w = view.__isMasonHorizontal ? contentW : Math.max(contentW, clip?.w ?? 0);
        const h = view.__isMasonHorizontal ? Math.max(contentH, clip?.h ?? 0) : contentH;
        view.nativeViewProtected.documentView.frame = CGRectMake(0, 0, w, h);
    }
    for (const child of view.__masonOrder) {
        const box = view._childBoxes.get(child);
        if (box) {
            const nv = child.nativeViewProtected;
            // display:none (or visibility:collapse, which maps to it in the
            // engine dict) removes the child from rendering. The engine still
            // emits stale subtree records under it, and NSViews do not clip —
            // hide the subtree instead of laying it out at stale boxes.
            if (child.style?.display === 'none' || child.style?.visibility === 'collapse') {
                if (nv) {
                    nv.hidden = true;
                    child.__masonHidden = true;
                }
                continue;
            }
            if (child.__masonHidden) {
                child.__masonHidden = false;
                if (nv) {
                    nv.hidden = child.style?.visibility === 'hidden';
                }
            }
            // The mason box is the alignment rect — controls whose NSView frame
            // is padded (NSTextField labels carry ±2pt focus-ring insets) get
            // the expanded frame, matching xplat-macos constraint pinning.
            const frame = nv?.frameForAlignmentRect
                ? nv.frameForAlignmentRect(CGRectMake(box.x, box.y, box.w, box.h))
                : { origin: { x: box.x, y: box.y }, size: { width: box.w, height: box.h } };
            const fx = Number(frame.origin.x);
            const fy = Number(frame.origin.y);
            // child.layout directly — layoutChild re-derives position from
            // measured size + Core alignment/margins, which mason already owns.
            child.layout(px(fx), px(fy), px(fx + Number(frame.size.width)), px(fy + Number(frame.size.height)));
        }
    }
}
// ── View ───────────────────────────────────────────────────────────────────
export class View extends LayoutBase {
    __isMasonContainer = true;
    _styleHelper;
    _childBoxes = new Map();
    _ownBox = null;
    __masonOrder = [];
    constructor() {
        super();
        this._styleHelper = new Style(this, masonHost() ? newMasonNode() : null);
        hookMasonStyles(this);
    }
    get __isMasonHorizontal() {
        return false;
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        masonOnMeasure(this, widthMeasureSpec, heightMeasureSpec);
    }
    onLayout(left, top, right, bottom) {
        masonOnLayout(this);
    }
    disposeNativeView() {
        this._styleHelper?.free();
        super.disposeNativeView();
    }
}
// ── Scroll ─────────────────────────────────────────────────────────────────
export class Scroll extends ScrollView {
    __isMasonContainer = true;
    __isMasonScroll = true;
    _styleHelper;
    _childBoxes = new Map();
    _ownBox = null;
    __masonOrder = [];
    _boundsObserver;
    constructor() {
        super();
        this._styleHelper = new Style(this, masonHost() ? newMasonNode() : null);
        hookMasonStyles(this);
    }
    get __isMasonHorizontal() {
        return this.orientation === 'horizontal' || this.horizontal === true;
    }
    initNativeView() {
        super.initNativeView();
        const clip = this.nativeViewProtected.contentView;
        clip.postsBoundsChangedNotifications = true;
        let scrollX = this.scrollLeft;
        let scrollY = this.scrollTop;
        this._boundsObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
            'NSViewBoundsDidChangeNotification',
            clip,
            null,
            () => {
                const nextX = this.scrollLeft;
                const nextY = this.scrollTop;
                if (nextX === scrollX && nextY === scrollY) {
                    return;
                }
                scrollX = nextX;
                scrollY = nextY;
                this.notify({ eventName: 'scroll', object: this, scrollX, scrollY });
            },
        );
    }
    get clientWidth() {
        return this.nativeViewProtected?.contentView.bounds.size.width ?? 0;
    }
    get clientHeight() {
        return this.nativeViewProtected?.contentView.bounds.size.height ?? 0;
    }
    get scrollWidth() {
        return this.nativeViewProtected?.documentView?.frame.size.width ?? 0;
    }
    get scrollHeight() {
        return this.nativeViewProtected?.documentView?.frame.size.height ?? 0;
    }
    get scrollLeft() {
        return this.horizontalOffset;
    }
    get scrollTop() {
        return this.verticalOffset;
    }
    scrollTo(options, top) {
        const scroll = this.nativeViewProtected;
        const clip = scroll?.contentView;
        if (!clip || !scroll.documentView) {
            return;
        }
        const { left, top: targetTop, behavior } = typeof options === 'number'
            ? { left: options, top }
            : options ?? {};
        const maxX = Math.max(0, this.scrollWidth - this.clientWidth);
        const maxY = Math.max(0, this.scrollHeight - this.clientHeight);
        const clamp = (value, max) => Math.max(0, Math.min(value, max));
        const x = Number.isFinite(left) ? clamp(left, maxX) : clip.bounds.origin.x;
        const y = Number.isFinite(targetTop) ? maxY - clamp(targetTop, maxY) : clip.bounds.origin.y;
        const proxy = behavior === 'smooth' ? clip.animator?.() : undefined;
        (proxy ?? clip).scrollToPoint(CGPointMake(x, y));
        scroll.reflectScrolledClipView(clip);
    }
    // The driver capability-checks insertChild/removeChild (isMasonContainer);
    // ScrollViewBase's single-child model adapts them to `content`.
    insertChild(child, _atIndex) {
        this.content = child;
        return true;
    }
    removeChild(child) {
        if (this.layoutView === child) {
            this.content = null;
        }
        else {
            this._removeView?.(child);
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        masonOnMeasure(this, widthMeasureSpec, heightMeasureSpec);
    }
    onLayout(left, top, right, bottom) {
        masonOnLayout(this);
    }
    eachLayoutChild(callback) {
        const child = this.layoutView;
        if (child) {
            callback(child, true);
        }
    }
    disposeNativeView() {
        const observer = this._boundsObserver;
        this._boundsObserver = undefined;
        if (observer) {
            NSNotificationCenter.defaultCenter.removeObserver(observer);
        }
        this._styleHelper?.free();
        super.disposeNativeView();
    }
}
// Elements.ts also imports LiquidGlass's base from this package on some
// targets — not implemented on macOS; throw only when actually constructed.
export class LiquidGlass extends LayoutBase {
    constructor() {
        super();
        throw new Error('macOS Mason: LiquidGlass is not supported on macOS');
    }
}
