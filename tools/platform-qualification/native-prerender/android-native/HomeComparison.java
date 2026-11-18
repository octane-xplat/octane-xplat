package org.octanexplat.prerenderandroid;

import org.octanexplat.prerender.MasonArtifact;

import android.view.ViewGroup;
import org.json.JSONArray;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.Style;
import org.nativescript.mason.masonkit.Point;
import org.nativescript.mason.masonkit.LengthPercentage;
import org.nativescript.mason.masonkit.View;
import org.nativescript.widgets.StyleableTextView;
import java.util.ArrayList;
import java.util.List;

/** Native observations for the fixed Home; no rendering or style substitution. */
final class HomeComparison {
    private static void check(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    private static boolean container(android.view.View view) {
        return view instanceof View || view instanceof org.nativescript.mason.masonkit.Scroll;
    }
    // A placeholder slot holds the cold Mason box before hydration and the
    // live host's native after; the hydration check pins the live class.
    private static boolean expectedKind(MasonArtifact.Artifact artifact, int index, android.view.View view) {
        MasonArtifact.Node row = artifact.nodes.get(index);
        String kind = row.kind;
        if (kind.equals("label")) return view instanceof StyleableTextView;
        if (kind.equals("scrollview")) return view instanceof org.nativescript.mason.masonkit.Scroll;
        if (kind.equals("placeholder")) return view instanceof View || liveReplacement(row.hostKind, view);
        return view instanceof View;
    }
    // The live host native each placeholder kind produces after hydration:
    // activityindicator -> Core's android.widget.ProgressBar; svgview -> the
    // vendored ui-svg MySVGViewCtor, a runtime-generated
    // android.view.View.extend subclass, not a named androidsvg widget. The
    // runtime names generated classes after the base class plus the extend
    // call site (android.view.View_<file>_<line>_<col>_, older runtimes use
    // com.tns.gen.android.view.View_*); only the prefix is stable.
    private static boolean liveReplacement(String hostKind, android.view.View view) {
        if (hostKind == null) return false;
        if (hostKind.equals("activityindicator")) return view instanceof android.widget.ProgressBar;
        if (hostKind.equals("svgview")) {
            String name = view.getClass().getName();
            return name.startsWith("android.view.View_") || name.startsWith("com.tns.gen.android.view.View");
        }
        return false;
    }
    // A Screen attaches its overlay RootLayout after hydration, outside the
    // startup artifact; it follows every artifact child.
    private static int foreignChildren(MasonArtifact.Artifact artifact, ViewGroup parent, MasonArtifact.Node row) {
        int count = 0;
        for (int index = 0; index < parent.getChildCount(); index++) {
            android.view.View child = parent.getChildAt(index);
            if (index >= row.children.size() || !expectedKind(artifact, row.children.get(index), child)) count++;
        }
        return count;
    }
    static List<android.view.View> collect(MasonArtifact.Artifact artifact, View viewport) {
        check(viewport.getChildCount() == 1, "Reference viewport root count differs");
        List<android.view.View> views = new ArrayList<>();
        collect(artifact, viewport.getChildAt(0), 0, views);
        check(views.size() == artifact.nodes.size(), "Reference visual count differs");
        return views;
    }
    private static void collect(MasonArtifact.Artifact artifact, android.view.View view, int index, List<android.view.View> views) {
        MasonArtifact.Node row = artifact.nodes.get(index);
        check(index == views.size(), "Reference visual order differs");
        check(expectedKind(artifact, index, view), "Reference native class differs");
        views.add(view);
        if (container(view)) {
            ViewGroup parent = (ViewGroup) view;
            check(parent.getChildCount() - foreignChildren(artifact, parent, row) == row.children.size(), "Reference child count differs");
            for (int child = 0; child < row.children.size(); child++) collect(artifact, parent.getChildAt(child), row.children.get(child), views);
        }
    }
    private static void radius(JSONObject item, String key, Point<LengthPercentage> point) throws Exception {
        item.put(key + "X", point.getX().getCssValue()).put(key + "Y", point.getY().getCssValue());
    }
    private static Object computed(float value, boolean laidOut) {
        return !laidOut || Float.isNaN(value) || Float.isInfinite(value) ? JSONObject.NULL : value;
    }
    static JSONArray snapshot(MasonArtifact.Artifact artifact, List<android.view.View> views) throws Exception {
        Mason mason = Mason.Companion.getShared();
        JSONArray result = new JSONArray();
        for (MasonArtifact.Node row : artifact.nodes) {
            android.view.View view = views.get(row.index);
            if (row.kind.equals("placeholder")) {
                // The placeholder slot may hold the detached cold box or the
                // live replacement; never ask Mason for the foreign child's
                // style and never touch the removed node's layout.
                result.put(new JSONObject().put("index", row.index).put("kind", row.kind).put("parent", row.parent)
                    .put("left", view.getLeft()).put("top", view.getTop()).put("width", view.getWidth()).put("height", view.getHeight())
                    .put("attached", view.isAttachedToWindow()).put("alpha", (double) view.getAlpha())
                    .put("class", view.getClass().getName()));
                continue;
            }
            Style style = mason.styleForView(view);
            org.nativescript.mason.masonkit.Node node = mason.nodeForView(view);
            boolean laidOut = view.getWidth() > 0 && view.getHeight() > 0;
            JSONObject item = new JSONObject().put("index", row.index).put("kind", row.kind).put("parent", row.parent)
                .put("left", view.getLeft()).put("top", view.getTop()).put("width", view.getWidth()).put("height", view.getHeight())
                .put("attached", view.isAttachedToWindow()).put("alpha", (double) view.getAlpha())
                .put("overflowX", style.getOverflowX().toString()).put("overflowY", style.getOverflowY().toString())
                .put("scrollX", view.getScrollX()).put("scrollY", view.getScrollY())
                .put("computedX", computed(laidOut ? node.getComputedX() : 0, laidOut)).put("computedY", computed(laidOut ? node.getComputedY() : 0, laidOut))
                .put("computedWidth", computed(laidOut ? node.getComputedWidth() : 0, laidOut)).put("computedHeight", computed(laidOut ? node.getComputedHeight() : 0, laidOut))
                .put("display", style.getDisplay().toString()).put("direction", style.getFlexDirection().toString())
                .put("grow", style.getFlexGrow()).put("shrink", style.getFlexShrink())
                .put("align", style.getAlignItems().toString()).put("justify", style.getJustifyContent().toString())
                .put("alignSelf", style.getAlignSelf().toString()).put("justifySelf", style.getJustifySelf().toString())
                .put("gridRow", style.getGridRow()).put("gridColumn", style.getGridColumn())
                .put("gridTemplateRows", style.getGridTemplateRows()).put("gridTemplateColumns", style.getGridTemplateColumns())
                .put("background", style.getBackgroundColor()).put("cornerShape", style.getCornerShape())
                .put("padding", style.getPaddingCss())
                .put("gapWidth", style.getGap().getWidth().getCssValue()).put("gapHeight", style.getGap().getHeight().getCssValue())
                .put("styleWidth", style.getSize().getWidth().getCssValue()).put("styleHeight", style.getSize().getHeight().getCssValue())
                .put("minWidth", style.getMinWidth().getCssValue()).put("maxWidth", style.getMaxWidth().getCssValue())
                .put("borderTop", style.getBorderTopWidth().getCssValue()).put("borderRight", style.getBorderRightWidth().getCssValue())
                .put("borderBottom", style.getBorderBottomWidth().getCssValue()).put("borderLeft", style.getBorderLeftWidth().getCssValue());
            // The shorthand getter is only the last assigned string. Live CSS
            // writes corners directly, so compare the actual corner values.
            radius(item, "radiusTopLeft", style.getBorderTopLeftRadius());
            radius(item, "radiusTopRight", style.getBorderTopRightRadius());
            radius(item, "radiusBottomRight", style.getBorderBottomRightRadius());
            radius(item, "radiusBottomLeft", style.getBorderBottomLeftRadius());
            int foreign = view instanceof ViewGroup && !(view instanceof StyleableTextView) ? foreignChildren(artifact, (ViewGroup) view, row) : 0;
            check(node.getChildCount() - foreign == row.children.size(), "Home Mason child count differs at index " + row.index + " (" + row.kind + "/" + row.hostKind + "): mason=" + node.getChildCount() + " foreign=" + foreign + " children=" + row.children.size());
            if (container(view)) for (int child = 0; child < row.children.size(); child++) {
                android.view.View actual = ((ViewGroup) view).getChildAt(child);
                // After hydration the placeholder slot holds the live
                // replacement, not the retained cold box in `views`.
                MasonArtifact.Node childRow = artifact.nodes.get(row.children.get(child));
                boolean placeholder = childRow.kind.equals("placeholder");
                check((actual == views.get(row.children.get(child)) || placeholder && liveReplacement(childRow.hostKind, actual)) && node.getChildAt(child) == mason.nodeForView(actual), "Home native/Mason child order differs at index " + row.index + " slot " + child);
            }
            if (view instanceof StyleableTextView) {
                StyleableTextView text = (StyleableTextView) view;
                item.put("text", text.getText().toString()).put("fontPixels", text.getTextSize()).put("fontWeight", text.getTypeface().getWeight())
                    .put("fontStyle", text.getTypeface().getStyle()).put("fakeBold", text.getPaint().isFakeBoldText()).put("color", text.getCurrentTextColor())
                    .put("fontPadding", text.getIncludeFontPadding()).put("maxLines", text.getMaxLines())
                    .put("lineExtra", text.getLineSpacingExtra()).put("lineMultiplier", text.getLineSpacingMultiplier())
                    .put("ellipsis", text.getEllipsize() == null ? "none" : text.getEllipsize().toString());
            }
            result.put(item);
        }
        return result;
    }
}
