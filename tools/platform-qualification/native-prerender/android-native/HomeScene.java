package org.octanexplat.prerenderandroid;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.Node;
import org.nativescript.mason.masonkit.Style;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.AlignItems;
import org.nativescript.mason.masonkit.enums.Display;
import org.nativescript.mason.masonkit.enums.FlexDirection;
import org.nativescript.mason.masonkit.enums.JustifyContent;
import org.nativescript.widgets.StyleableTextView;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Fixed shared Home lowerer; all records are preflighted before native allocation. */
public final class HomeScene {
    private static final String SYSTEM_FAMILY = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif";
    public final HomeArtifact.Artifact artifact;
    public final String theme;
    public final View viewport;
    public final FrameLayout windowRoot;
    private final Mason mason;
    private final float density;
    private final List<android.view.View> views = new ArrayList<>();
    private final List<Node> nodes = new ArrayList<>();
    private final List<Long> handles = new ArrayList<>();
    private final List<Typeface> defaultFonts = new ArrayList<>();
    private final List<android.content.res.ColorStateList> defaultColors = new ArrayList<>();
    private final List<Float> defaultFontSizes = new ArrayList<>();
    private final List<String> defaultRadii = new ArrayList<>();
    private boolean defaultsRestored;
    private int additions, removals;

    private static void check(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    private static float number(Map<String, Object> values, String key, float fallback) {
        Object value = values.get(key);
        return value == null ? fallback : ((Double) value).floatValue();
    }
    private static int color(String value) {
        if (value.startsWith("#")) return Color.parseColor(value);
        String[] parts = value.substring(5, value.length() - 1).split(",", -1);
        return Color.argb(Math.round(Float.parseFloat(parts[3].trim()) * 255),
            Math.round(Float.parseFloat(parts[0].trim())), Math.round(Float.parseFloat(parts[1].trim())),
            Math.round(Float.parseFloat(parts[2].trim())));
    }
    public HomeScene(Context context, HomeArtifact.Artifact artifact, String theme) {
        this.artifact = artifact; this.theme = theme;
        density = context.getResources().getDisplayMetrics().density;
        check(android.os.Build.VERSION.SDK_INT >= 28, "Home font lowering requires Android28+");
        check(artifact.nodes.size() == 19 && artifact.nodes.get(0).kind.equals("masonview"), "Expected actual nineteen-view Home");
        check(Float.isFinite(density) && density > 0 && context.getResources().getConfiguration().fontScale == 1f,
            "This fixed Home qualification requires density>0 and fontScale1");
        // Check both variants, including the currently unused one, before views.
        for (List<HomeArtifact.StyleRecord> variant : artifact.variants.values()) {
            for (HomeArtifact.StyleRecord row : variant) {
                Object family = row.style.get("fontFamily");
                check(family == null || SYSTEM_FAMILY.equals(family), "Unsupported Home font family stack");
                for (Map.Entry<String, Object> entry : row.style.entrySet()) {
                    if (entry.getValue() instanceof Double) {
                        double value = (Double) entry.getValue();
                        check(value * density <= 0x00ffffff, "Home scalar exceeds Android pixel range: " + entry.getKey());
                    }
                }
            }
        }
        mason = Mason.Companion.getShared();
        mason.setDeviceScale(density);
        viewport = View.createFlexView(mason, context);
        viewport.setFlexDirection(FlexDirection.Column);
        windowRoot = new FrameLayout(context) {
            private int measuredWidth = -1, measuredHeight = -1;
            @Override protected void onMeasure(int widthSpec, int heightSpec) {
                int width = android.view.View.MeasureSpec.getSize(widthSpec);
                int height = android.view.View.MeasureSpec.getSize(heightSpec);
                if (width != measuredWidth || height != measuredHeight) {
                    measuredWidth = width; measuredHeight = height;
                    viewport.getStyle().setSizePoints(width, height);
                }
                super.onMeasure(widthSpec, heightSpec);
            }
        };
        windowRoot.addView(viewport, new FrameLayout.LayoutParams(-1, -1));
        List<HomeArtifact.StyleRecord> styles = artifact.variants.get(theme);
        check(styles != null, "Unsupported Home theme");
        for (HomeArtifact.Node row : artifact.nodes) {
            android.view.View view;
            if (row.kind.equals("label")) {
                StyleableTextView text = new StyleableTextView(context);
                text.setIncludeFontPadding(false);
                text.setGravity(android.view.Gravity.CENTER_VERTICAL);
                text.setText(row.text);
                view = text;
            } else view = View.createFlexView(mason, context);
            views.add(view);
            Style style = mason.styleForView(view);
            // The live foreign-child adapter supplies this Text default.
            if (view instanceof StyleableTextView) style.setMinSizeWidth(0, (byte) 1);
            defaultRadii.add(style.getBorderRadius());
            StyleableTextView label = view instanceof StyleableTextView ? (StyleableTextView) view : null;
            defaultFonts.add(label == null ? null : label.getTypeface());
            defaultColors.add(label == null ? null : label.getTextColors());
            defaultFontSizes.add(label == null ? 0 : label.getTextSize());
            apply(view, style, styles.get(row.index).style);
            if (row.parent < 0) viewport.addView(view);
            else ((View) views.get(row.parent)).addView(view);
            nodes.add(mason.nodeForView(view));
            handles.add(nodes.get(row.index).getNativePtr());
        }
        ViewGroup.OnHierarchyChangeListener observer = new ViewGroup.OnHierarchyChangeListener() {
            @Override public void onChildViewAdded(android.view.View parent, android.view.View child) { additions++; }
            @Override public void onChildViewRemoved(android.view.View parent, android.view.View child) { removals++; }
        };
        viewport.setOnHierarchyChangeListener(observer);
        for (android.view.View view : views) if (view instanceof ViewGroup) ((ViewGroup) view).setOnHierarchyChangeListener(observer);
    }
    private void apply(android.view.View view, Style style, Map<String, Object> values) {
        style.setInBatch(true);
        if (values.containsKey("display")) style.setDisplay(Display.Flex);
        if (values.containsKey("flexDirection")) style.setFlexDirection(values.get("flexDirection").equals("column") ? FlexDirection.Column : FlexDirection.Row);
        if (values.containsKey("flexGrow")) style.setFlexGrow(number(values, "flexGrow", 0));
        if (values.containsKey("flexShrink")) style.setFlexShrink(number(values, "flexShrink", 0));
        if (values.containsKey("paddingTop")) style.setPaddingTop(number(values, "paddingTop", 0) * density, (byte) 0);
        if (values.containsKey("paddingRight")) style.setPaddingRight(number(values, "paddingRight", 0) * density, (byte) 0);
        if (values.containsKey("paddingBottom")) style.setPaddingBottom(number(values, "paddingBottom", 0) * density, (byte) 0);
        if (values.containsKey("paddingLeft")) style.setPaddingLeft(number(values, "paddingLeft", 0) * density, (byte) 0);
        if (values.containsKey("rowGap")) style.setGapRow(number(values, "rowGap", 0) * density, (byte) 0);
        if (values.containsKey("columnGap")) style.setGapColumn(number(values, "columnGap", 0) * density, (byte) 0);
        if (values.containsKey("minWidth")) style.setMinSizeWidth(number(values, "minWidth", 0) * density, (byte) 1);
        if (values.containsKey("maxWidth")) style.setMaxSizeWidth(1, (byte) 2);
        if (values.containsKey("height")) style.setSizeHeight(number(values, "height", 0) * density, (byte) 1);
        if (values.containsKey("alignItems")) style.setAlignItems(AlignItems.Center);
        if (values.containsKey("justifyContent")) style.setJustifyContent(values.get("justifyContent").equals("center") ? JustifyContent.Center : JustifyContent.SpaceBetween);
        if (values.containsKey("backgroundColor")) style.setBackgroundColor(color((String) values.get("backgroundColor")));
        if (values.containsKey("borderRadius")) style.setBorderRadius(Float.toString(number(values, "borderRadius", 0)) + "px");
        if (values.containsKey("cornerShape")) style.setCornerShape((String) values.get("cornerShape"));
        if (values.containsKey("borderWidth")) {
            style.setBorderLeftWidth(0, (byte) 0); style.setBorderRightWidth(0, (byte) 0);
            style.setBorderTopWidth(0, (byte) 0); style.setBorderBottomWidth(0, (byte) 0);
        }
        style.setInBatch(false);
        if (view instanceof StyleableTextView) {
            StyleableTextView text = (StyleableTextView) view;
            text.setTypeface(Typeface.create(Typeface.SANS_SERIF, (int) number(values, "fontWeight", 400), false));
            text.setTextSize(TypedValue.COMPLEX_UNIT_SP, number(values, "fontSize", 14));
            if (values.containsKey("color")) text.setTextColor(color((String) values.get("color")));
            boolean nowrap = "nowrap".equals(values.get("whiteSpace"));
            text.setSingleLine(nowrap);
            text.setMaxLines(nowrap ? 1 : Integer.MAX_VALUE);
            text.setEllipsize("ellipsis".equals(values.get("textOverflow")) ? android.text.TextUtils.TruncateAt.END : null);
            // Core9.1.3 defines lineHeight as extra Android line spacing.
            text.setLineSpacing(number(values, "lineHeight", 0) * density, 1);
            text.setTextIsSelectable(false);
        }
    }
    // Restore before the live wrappers capture native defaults. This bounded
    // journal covers font/color/radius and canonical Core Label text defaults;
    // full live style removal and geometry parity remain separate checks.
    public void restoreDefaults() {
        check(!defaultsRestored, "Home defaults restored twice"); defaultsRestored = true;
        for (int index = 0; index < views.size(); index++) {
            android.view.View view = views.get(index);
            mason.styleForView(view).setBorderRadius(defaultRadii.get(index));
            if (view instanceof StyleableTextView) {
                StyleableTextView text = (StyleableTextView) view;
                text.setTypeface(defaultFonts.get(index));
                text.setTextSize(TypedValue.COMPLEX_UNIT_PX, defaultFontSizes.get(index));
                text.setTextColor(defaultColors.get(index));
                text.setLineSpacing(0, 1);
                text.setSingleLine(true); text.setMaxLines(1);
                text.setEllipsize(android.text.TextUtils.TruncateAt.END);
            }
        }
    }
    public android.view.View getView(int index) { return views.get(index); }
    public int count() { return views.size(); }
    public boolean laidOut() {
        for (android.view.View view : views)
            if (!view.isAttachedToWindow() || view.getWidth() <= 0 || view.getHeight() <= 0) return false;
        return viewport.getWidth() == windowRoot.getWidth() && viewport.getHeight() == windowRoot.getHeight();
    }
    public void verify() {
        check(additions == 0 && removals == 0, "Home physically reattached children");
        for (HomeArtifact.Node row : artifact.nodes) {
            android.view.View view = views.get(row.index);
            check(view.getParent() == (row.parent < 0 ? viewport : views.get(row.parent)), "Home native parent changed");
            check(mason.nodeForView(view) == nodes.get(row.index) && nodes.get(row.index).getNativePtr() == handles.get(row.index), "Home Mason identity changed");
            if (view instanceof StyleableTextView) check(((StyleableTextView) view).getText().toString().equals(row.text), "Home text changed");
        }
    }
    public JSONArray snapshot() throws Exception {
        JSONArray result = new JSONArray();
        for (HomeArtifact.Node row : artifact.nodes) {
            android.view.View view = views.get(row.index);
            JSONObject item = new JSONObject().put("index", row.index).put("kind", row.kind)
                .put("left", view.getLeft()).put("top", view.getTop()).put("width", view.getWidth()).put("height", view.getHeight())
                .put("parent", row.parent).put("attached", view.isAttachedToWindow());
            if (view instanceof StyleableTextView) {
                StyleableTextView text = (StyleableTextView) view;
                item.put("text", text.getText().toString()).put("fontPixels", text.getTextSize())
                    .put("fontWeight", text.getTypeface().getWeight()).put("color", text.getCurrentTextColor());
            }
            result.put(item);
        }
        return result;
    }
}
