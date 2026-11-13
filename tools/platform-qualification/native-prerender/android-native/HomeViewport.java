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
    private android.view.ViewTreeObserver observedTree;
    private final android.view.ViewTreeObserver.OnPreDrawListener safeArea = this::fitSafeArea;
    private final android.graphics.Rect safe = new android.graphics.Rect();
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
        if (observedTree != null && observedTree.isAlive()) observedTree.removeOnPreDrawListener(safeArea);
        observedTree = null; windowDetachments++; super.onDetachedFromWindow();
    }
    // Match the system-bar-safe content area, whether the framework has already
    // inset its content frame or still exposes the complete window. The content
    // parent belongs to this native host; never apply the same inset twice.
    private boolean fitSafeArea() {
        if (!(getParent() instanceof android.view.ViewGroup)) return true;
        android.view.ViewGroup parent = (android.view.ViewGroup) getParent();
        if (parent.getId() != android.R.id.content || parent.getWidth() <= 0 || parent.getHeight() <= 0) return true;
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            android.view.WindowInsets insets = getRootWindowInsets();
            if (insets == null) { requestApplyInsets(); return false; }
            android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
            safe.set(activity.getWindowManager().getCurrentWindowMetrics().getBounds());
            safe.inset(bars.left, bars.top, bars.right, bars.bottom);
        } else getWindowVisibleDisplayFrame(safe);
        parent.getLocationOnScreen(parentLocation);
        int left = Math.max(0, safe.left - parentLocation[0]);
        int top = Math.max(0, safe.top - parentLocation[1]);
        int right = Math.max(0, parentLocation[0] + parent.getWidth() - safe.right);
        int bottom = Math.max(0, parentLocation[1] + parent.getHeight() - safe.bottom);
        if (parent.getPaddingLeft() != left || parent.getPaddingTop() != top || parent.getPaddingRight() != right || parent.getPaddingBottom() != bottom) {
            parent.setPadding(left, top, right, bottom); return false;
        }
        if (getLeft() != left || getTop() != top || getWidth() != parent.getWidth() - left - right || getHeight() != parent.getHeight() - top - bottom) {
            parent.requestLayout(); return false;
        }
        return true;
    }
    @Override protected void dispatchDraw(android.graphics.Canvas canvas) { super.dispatchDraw(canvas); draws++; }
    public int getDraws() { return draws; }
    public int getAvailableWidth() { return availableWidth; }
    public int getAvailableHeight() { return availableHeight; }
    public int getWindowAttachments() { return windowAttachments; }
    public int getWindowDetachments() { return windowDetachments; }
}
