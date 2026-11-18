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
        check(row.kind.equals("label") ? view instanceof StyleableTextView : row.kind.equals("scrollview") ? view instanceof org.nativescript.mason.masonkit.Scroll : view instanceof View, "Reference native class differs");
        views.add(view);
        if (container(view)) {
            ViewGroup parent = (ViewGroup) view;
            check(parent.getChildCount() == row.children.size(), "Reference child count differs");
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
            check(node.getChildCount() == row.children.size(), "Home Mason child count differs");
            if (container(view)) for (int child = 0; child < row.children.size(); child++) {
                android.view.View expected = views.get(row.children.get(child));
                check(((ViewGroup) view).getChildAt(child) == expected && node.getChildAt(child) == mason.nodeForView(expected), "Home native/Mason child order differs");
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
