package org.octanexplat.prerenderandroid;

import android.app.Activity;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.Display;
import org.nativescript.mason.masonkit.enums.FlexDirection;

/** Native full-content viewport, also claimable as the ordinary Core root. */
public final class HomeViewport extends View {
    private int availableWidth = -1, availableHeight = -1;
    private int windowAttachments, windowDetachments, draws;
    private int drawnLeft = -1, drawnTop = -1, drawnWidth = -1, drawnHeight = -1;
    private volatile long firstCommittedFrameNanos;
    private boolean commitRequested;
    private final Runnable frameCommitted = () -> firstCommittedFrameNanos = android.os.SystemClock.elapsedRealtimeNanos();
    private android.view.ViewTreeObserver observedTree;
    private final android.view.ViewTreeObserver.OnPreDrawListener safeArea = this::fitSafeArea;
    private final android.graphics.Rect safe = new android.graphics.Rect();
    private final android.graphics.Rect safePadding = new android.graphics.Rect();
    private final int[] parentLocation = new int[2];
    private final Activity activity;
    public HomeViewport(Activity activity, Mason mason) {
        super(activity, mason);
        // Mason wraps getContext() in ThemelessContext; retain the actual host.
        this.activity = activity;
        getStyle().setDisplay(Display.Flex);
        setFlexDirection(FlexDirection.Column);
    }
    @Override protected void onMeasure(int widthSpec, int heightSpec) {
        int width = android.view.View.MeasureSpec.getSize(widthSpec);
        int height = android.view.View.MeasureSpec.getSize(heightSpec);
        if (width != availableWidth || height != availableHeight) {
            availableWidth = width; availableHeight = height;
            getStyle().setSizePoints(width, height);
        }
        super.onMeasure(widthSpec, heightSpec);
    }
    @Override protected void onAttachedToWindow() {
        windowAttachments++; super.onAttachedToWindow();
        observedTree = getViewTreeObserver(); observedTree.addOnPreDrawListener(safeArea);
    }
    @Override protected void onDetachedFromWindow() {
        if (observedTree != null && observedTree.isAlive()) {
            observedTree.removeOnPreDrawListener(safeArea);
            if (android.os.Build.VERSION.SDK_INT >= 29 && commitRequested)
                observedTree.unregisterFrameCommitCallback(frameCommitted);
        }
        observedTree = null; windowDetachments++; super.onDetachedFromWindow();
    }
    // Match the system-bar-safe content area, whether the framework has already
    // inset its content frame or still exposes the complete window. The content
    // parent belongs to this native host; never apply the same inset twice.
    private boolean fitSafeArea() {
        if (!(getParent() instanceof android.view.ViewGroup)) return true;
        android.view.ViewGroup parent = (android.view.ViewGroup) getParent();
        if (parent.getId() != android.R.id.content || parent.getWidth() <= 0 || parent.getHeight() <= 0) return true;
        readSafePadding(parent);
        if (!hasCurrentPadding(parent)) {
            parent.setPadding(safePadding.left, safePadding.top, safePadding.right, safePadding.bottom); return false;
        }
        if (getLeft() != safePadding.left || getTop() != safePadding.top ||
            getWidth() != parent.getWidth() - safePadding.left - safePadding.right ||
            getHeight() != parent.getHeight() - safePadding.top - safePadding.bottom) {
            parent.requestLayout(); return false;
        }
        if (!commitRequested && android.os.Build.VERSION.SDK_INT >= 29 && isHardwareAccelerated()) {
            // Submission to the swap chain, not evidence of display presentation.
            getViewTreeObserver().registerFrameCommitCallback(frameCommitted); commitRequested = true;
        }
        return true;
    }
    private void readSafePadding(android.view.ViewGroup parent) {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            // Bounds and insets must come from the same window-metrics snapshot.
            // View-level root insets can still omit a cutout during attachment.
            android.view.WindowMetrics metrics = activity.getWindowManager().getCurrentWindowMetrics();
            android.graphics.Insets bars = metrics.getWindowInsets().getInsets(
                android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
            safe.set(metrics.getBounds()); safe.inset(bars.left, bars.top, bars.right, bars.bottom);
        } else getWindowVisibleDisplayFrame(safe);
        parent.getLocationOnScreen(parentLocation);
        safePadding.set(Math.max(0, safe.left - parentLocation[0]),
            Math.max(0, safe.top - parentLocation[1]),
            Math.max(0, parentLocation[0] + parent.getWidth() - safe.right),
            Math.max(0, parentLocation[1] + parent.getHeight() - safe.bottom));
    }
    private boolean hasCurrentPadding(android.view.ViewGroup parent) {
        return parent.getPaddingLeft() == safePadding.left && parent.getPaddingTop() == safePadding.top &&
            parent.getPaddingRight() == safePadding.right && parent.getPaddingBottom() == safePadding.bottom;
    }
    @Override protected void dispatchDraw(android.graphics.Canvas canvas) {
        android.os.Trace.beginSection("XplatHomeDraw");
        try {
            super.dispatchDraw(canvas); draws++;
            drawnLeft = getLeft(); drawnTop = getTop(); drawnWidth = getWidth(); drawnHeight = getHeight();
        }
        finally { android.os.Trace.endSection(); }
    }
    public int getDraws() { return draws; }
    public boolean hasDrawnSafeBounds() {
        if (!(getParent() instanceof android.view.ViewGroup)) return false;
        android.view.ViewGroup parent = (android.view.ViewGroup) getParent();
        if (parent.getId() != android.R.id.content || parent.getWidth() <= 0 || parent.getHeight() <= 0) return false;
        readSafePadding(parent);
        return hasCurrentPadding(parent) && !isLayoutRequested() && !parent.isLayoutRequested() &&
            getLeft() == parent.getPaddingLeft() && getTop() == parent.getPaddingTop() &&
            getWidth() == parent.getWidth() - parent.getPaddingLeft() - parent.getPaddingRight() &&
            getHeight() == parent.getHeight() - parent.getPaddingTop() - parent.getPaddingBottom() &&
            drawnLeft == getLeft() && drawnTop == getTop() && drawnWidth == getWidth() && drawnHeight == getHeight();
    }
    public long getFirstCommittedFrameNanos() { return firstCommittedFrameNanos; }
    private android.view.WindowInsets safeAreaRootInsets() {
        android.view.WindowInsets value = getRootWindowInsets();
        if (!HomeBuild.STALE_ROOT_INSETS || com.tns.Runtime.isInitialized() || value == null || android.os.Build.VERSION.SDK_INT < 30) return value;
        // Controlled reproduction of the observed 24dp bar before cutout data
        // arrives. The platform metrics and physical window remain unchanged.
        android.graphics.Insets bars = value.getInsets(android.view.WindowInsets.Type.statusBars());
        int top = Math.min(bars.top, Math.round(24 * activity.getResources().getDisplayMetrics().density));
        return new android.view.WindowInsets.Builder(value)
            .setInsets(android.view.WindowInsets.Type.statusBars(), android.graphics.Insets.of(bars.left, top, bars.right, bars.bottom))
            .setDisplayCutout(null).setInsets(android.view.WindowInsets.Type.displayCutout(), android.graphics.Insets.NONE).build();
    }
    // Qualification only: preserve the inputs behind a cold/live size change.
    // A frozen cold snapshot cannot explain whether system insets changed later.
    public String snapshotViewport() {
        try {
            android.content.res.Configuration config = activity.getResources().getConfiguration();
            org.json.JSONObject value = new org.json.JSONObject()
                .put("left", getLeft()).put("top", getTop()).put("width", getWidth()).put("height", getHeight())
                .put("availableWidth", availableWidth).put("availableHeight", availableHeight)
                .put("drawnLeft", drawnLeft).put("drawnTop", drawnTop)
                .put("drawnWidth", drawnWidth).put("drawnHeight", drawnHeight)
                .put("draws", draws).put("safeBoundsDrawn", hasDrawnSafeBounds())
                .put("screenWidthDp", config.screenWidthDp).put("screenHeightDp", config.screenHeightDp)
                .put("orientation", config.orientation).put("densityDpi", config.densityDpi);
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.view.WindowMetrics metrics = activity.getWindowManager().getCurrentWindowMetrics();
                android.graphics.Rect bounds = metrics.getBounds();
                value.put("windowLeft", bounds.left).put("windowTop", bounds.top)
                    .put("windowWidth", bounds.width()).put("windowHeight", bounds.height())
                    .put("staleRootInsetsInjected", HomeBuild.STALE_ROOT_INSETS && !com.tns.Runtime.isInitialized())
                    .put("rootInsets", snapshotInsets(safeAreaRootInsets()))
                    .put("platformRootInsets", snapshotInsets(getRootWindowInsets()))
                    .put("metricsInsets", snapshotInsets(metrics.getWindowInsets()));
            }
            if (getParent() instanceof android.view.View) {
                android.view.View parent = (android.view.View) getParent();
                int[] location = new int[2]; parent.getLocationOnScreen(location);
                value.put("parentScreenLeft", location[0]).put("parentScreenTop", location[1])
                    .put("parentWidth", parent.getWidth()).put("parentHeight", parent.getHeight())
                    .put("parentPaddingLeft", parent.getPaddingLeft()).put("parentPaddingTop", parent.getPaddingTop())
                    .put("parentPaddingRight", parent.getPaddingRight()).put("parentPaddingBottom", parent.getPaddingBottom());
            }
            return value.toString();
        } catch (org.json.JSONException error) { throw new RuntimeException(error); }
    }
    private static org.json.JSONObject snapshotInsets(android.view.WindowInsets value) throws org.json.JSONException {
        org.json.JSONObject result = new org.json.JSONObject().put("available", value != null);
        if (value == null || android.os.Build.VERSION.SDK_INT < 30) return result;
        android.graphics.Insets bars = value.getInsets(android.view.WindowInsets.Type.systemBars());
        android.graphics.Insets cutout = value.getInsets(android.view.WindowInsets.Type.displayCutout());
        return result.put("barsLeft", bars.left).put("barsTop", bars.top).put("barsRight", bars.right).put("barsBottom", bars.bottom)
            .put("cutoutLeft", cutout.left).put("cutoutTop", cutout.top).put("cutoutRight", cutout.right).put("cutoutBottom", cutout.bottom)
            .put("hasCutout", value.getDisplayCutout() != null);
    }
    public int getAvailableWidth() { return availableWidth; }
    public int getAvailableHeight() { return availableHeight; }
    public int getWindowAttachments() { return windowAttachments; }
    public int getWindowDetachments() { return windowDetachments; }
}
