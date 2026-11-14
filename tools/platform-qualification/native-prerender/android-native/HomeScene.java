package org.octanexplat.prerenderandroid;

import org.octanexplat.prerender.MasonArtifact;
import org.octanexplat.prerender.MasonMount;

import android.view.ViewGroup;
import org.json.JSONArray;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.Node;
import org.nativescript.mason.masonkit.View;
import org.nativescript.widgets.StyleableTextView;
import java.util.ArrayList;
import java.util.List;

/** Fixed shared Home lowerer; all records are preflighted before native allocation. */
public final class HomeScene {
    public final MasonArtifact.Artifact artifact;
    public final String theme;
    public final HomeViewport viewport;
    public final HomeViewport windowRoot;
    private final Mason mason;
    private final MasonMount mount;
    private final List<android.view.View> views;
    private final List<Node> nodes = new ArrayList<>();
    private final List<Long> handles = new ArrayList<>();
    private int additions, removals;

    private static void check(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    public HomeScene(android.app.Activity context, MasonArtifact.Artifact artifact, String theme) {
        this.artifact = artifact; this.theme = theme;
        check(artifact.nodes.size() == 19 && artifact.nodes.get(0).kind.equals("masonview"), "Expected actual nineteen-view Home");
        MasonMount.Prepared prepared = MasonMount.prepare(context, artifact, theme);
        mason = Mason.Companion.getShared();
        viewport = new HomeViewport(context, mason);
        windowRoot = viewport;
        mount = prepared.mount(viewport);
        views = mount.views();
        for (android.view.View view : views) {
            Node node = mason.nodeForView(view);
            nodes.add(node); handles.add(node.getNativePtr());
        }
        ViewGroup.OnHierarchyChangeListener observer = new ViewGroup.OnHierarchyChangeListener() {
            @Override public void onChildViewAdded(android.view.View parent, android.view.View child) { additions++; }
            @Override public void onChildViewRemoved(android.view.View parent, android.view.View child) { removals++; }
        };
        viewport.setOnHierarchyChangeListener(observer);
        for (android.view.View view : views) if (view instanceof ViewGroup) ((ViewGroup) view).setOnHierarchyChangeListener(observer);
    }
    public void restoreDefaults() { mount.restoreDefaults(); }
    public android.view.View getView(int index) { return views.get(index); }
    public Node getOriginalNode(int index) { return nodes.get(index); }
    public int count() { return views.size(); }
    public boolean laidOut() {
        for (android.view.View view : views)
            if (!view.isAttachedToWindow() || view.getWidth() <= 0 || view.getHeight() <= 0) return false;
        return viewport.getWidth() == viewport.getAvailableWidth() && viewport.getHeight() == viewport.getAvailableHeight();
    }
    public void verify() {
        verifyStructure();
        for (MasonArtifact.Node row : artifact.nodes) {
            android.view.View view = views.get(row.index);
            if (view instanceof StyleableTextView) check(((StyleableTextView) view).getText().toString().equals(row.text), "Home text changed");
        }
    }
    public void verifyStructure() {
        check(additions == 0 && removals == 0, "Home physically reattached children");
        for (MasonArtifact.Node row : artifact.nodes) {
            android.view.View view = views.get(row.index);
            check(view.getParent() == (row.parent < 0 ? viewport : views.get(row.parent)), "Home native parent changed");
            check(mason.nodeForView(view) == nodes.get(row.index) && nodes.get(row.index).getNativePtr() == handles.get(row.index), "Home Mason identity changed");
        }
    }
    public JSONArray snapshot() throws Exception { return HomeComparison.snapshot(artifact, views); }
    public void discard(boolean pristine) {
        if (pristine) verify();
        if (viewport.getParent() instanceof ViewGroup) ((ViewGroup) viewport.getParent()).removeView(viewport);
        else check(viewport.getParent() == null, "Discarded Home has an unexpected parent");
        for (int index = views.size() - 1; index >= 0; index--) {
            android.view.View view = views.get(index);
            if (view instanceof ViewGroup) ((ViewGroup) view).removeAllViews();
            if (view instanceof View) check(((View) view).getNode().getChildCount() == 0, "Discarded Home retains Mason children");
        }
        viewport.removeAllViews();
        check(viewport.getChildCount() == 0 && viewport.getNode().getChildCount() == 0, "Discarded viewport retains children");
    }
    public JSONArray snapshotReference(View reference) throws Exception {
        List<android.view.View> others = HomeComparison.collect(artifact, reference);
        for (android.view.View other : others) for (android.view.View original : views)
            check(other != original, "Ordinary reference reused an adopted native object");
        return HomeComparison.snapshot(artifact, others);
    }
}
