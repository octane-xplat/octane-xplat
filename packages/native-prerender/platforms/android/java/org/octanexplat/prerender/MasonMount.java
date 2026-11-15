package org.octanexplat.prerender;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.Style;
import org.nativescript.mason.masonkit.Point;
import org.nativescript.mason.masonkit.LengthPercentage;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.AlignItems;
import org.nativescript.mason.masonkit.enums.Display;
import org.nativescript.mason.masonkit.enums.FlexDirection;
import org.nativescript.mason.masonkit.enums.JustifyContent;
import org.nativescript.widgets.StyleableTextView;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;
import java.util.Map;

/** Native Mason/Label lowering. The caller owns the viewport and final lifecycle. */
public final class MasonMount {
    public static final class UnsupportedEnvironment extends IllegalArgumentException {
        public UnsupportedEnvironment(String reason) { super(reason); }
    }
    public static void validateEnvironment(Context context) {
        if (android.os.Build.VERSION.SDK_INT < 28)
            throw new UnsupportedEnvironment("Mason/Label font lowering requires Android28+");
        float density = context.getResources().getDisplayMetrics().density;
        float scale = context.getResources().getConfiguration().fontScale;
        if (!Float.isFinite(density) || density <= 0 || scale != 1f)
            throw new UnsupportedEnvironment("Native Mason/Label mount requires finite density>0 and fontScale1; density=" + density + " fontScale=" + scale);
    }
    private static final String SYSTEM_FAMILY = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif";
    private final Mason mason;
    private final float density;
    private final List<android.view.View> views = new ArrayList<>();
    private final List<Typeface> defaultFonts = new ArrayList<>();
    private final List<android.content.res.ColorStateList> defaultColors = new ArrayList<>();
    private final List<Float> defaultFontSizes = new ArrayList<>();
    private final List<String> defaultRadii = new ArrayList<>();
    private final List<List<Point<LengthPercentage>>> defaultCorners = new ArrayList<>();
    private boolean defaultsRestored;
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
    private static Point<LengthPercentage> copyRadius(Point<LengthPercentage> point) {
        return new Point<>(LengthPercentage.from(point.getX()), LengthPercentage.from(point.getY()));
    }
    private static void supported(boolean value, String reason) {
        if (!value) throw new UnsupportedEnvironment(reason);
    }
    public static final class Prepared {
        private final Context context;
        private final MasonArtifact.Artifact artifact;
        private final String theme;
        private final float density;
        private Prepared(Context context, MasonArtifact.Artifact artifact, String theme, float density) {
            this.context = context; this.artifact = artifact; this.theme = theme; this.density = density;
        }
        /** Mount synchronously after preflight, into an empty caller-owned Mason viewport. */
        public MasonMount mount(View viewport) { return new MasonMount(this, viewport); }
    }
    /** Check both variants and device conversion before allocating artifact views. */
    public static Prepared prepare(Context context, MasonArtifact.Artifact artifact, String theme) {
        validateEnvironment(context);
        float density = context.getResources().getDisplayMetrics().density;
        supported(artifact.variants.containsKey(theme), "Unsupported Mason/Label theme");
        // Check both variants, including the currently unused one, before views.
        for (List<MasonArtifact.StyleRecord> variant : artifact.variants.values()) {
            for (MasonArtifact.StyleRecord row : variant) {
                Object family = row.style.get("fontFamily");
                supported(family == null || SYSTEM_FAMILY.equals(family), "Unsupported Mason/Label font family stack");
                for (Map.Entry<String, Object> entry : row.style.entrySet()) {
                    if (entry.getValue() instanceof Double) {
                        double value = (Double) entry.getValue();
                        supported(value * density <= 0x00ffffff, "Mason/Label scalar exceeds Android pixel range: " + entry.getKey());
                    }
                }
            }
        }
        return new Prepared(context, artifact, theme, density);
    }
    private MasonMount(Prepared prepared, View viewport) {
        check(viewport.getChildCount() == 0 && viewport.getNode().getChildCount() == 0, "Mount viewport is not empty");
        Context context = prepared.context;
        MasonArtifact.Artifact artifact = prepared.artifact;
        density = prepared.density;
        mason = Mason.Companion.getShared();
        mason.setDeviceScale(density);
        List<MasonArtifact.StyleRecord> styles = artifact.variants.get(prepared.theme);
        for (MasonArtifact.Node row : artifact.nodes) {
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
            // Ordinary raw Mason views start as Block; only authored/resolved
            // display:flex selects Flex. The viewport is explicitly Flex.
            if (view instanceof View) style.setDisplay(Display.Block);
            defaultRadii.add(style.getBorderRadius());
            defaultCorners.add(java.util.Arrays.asList(copyRadius(style.getBorderTopLeftRadius()),
                copyRadius(style.getBorderTopRightRadius()), copyRadius(style.getBorderBottomRightRadius()),
                copyRadius(style.getBorderBottomLeftRadius())));
            StyleableTextView label = view instanceof StyleableTextView ? (StyleableTextView) view : null;
            defaultFonts.add(label == null ? null : label.getTypeface());
            defaultColors.add(label == null ? null : label.getTextColors());
            defaultFontSizes.add(label == null ? 0 : label.getTextSize());
            apply(view, style, styles.get(row.index).style);
            if (row.parent < 0) viewport.addView(view);
            else ((View) views.get(row.parent)).addView(view);
        }
    }
    private void apply(android.view.View view, Style style, Map<String, Object> values) {
        style.setInBatch(true);
        if (values.containsKey("display")) { supported("flex".equals(values.get("display")) || "block".equals(values.get("display")), "Unsupported display"); style.setDisplay("flex".equals(values.get("display")) ? Display.Flex : Display.Block); }
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
        if (values.containsKey("minHeight")) style.setMinSizeHeight(number(values, "minHeight", 0) * density, (byte) 1);
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
        check(!defaultsRestored, "Mason/Label defaults restored twice"); defaultsRestored = true;
        for (int index = 0; index < views.size(); index++) {
            android.view.View view = views.get(index);
            Style style = mason.styleForView(view);
            style.setInBatch(true);
            style.setBorderRadius(defaultRadii.get(index));
            List<Point<LengthPercentage>> corners = defaultCorners.get(index);
            style.setBorderTopLeftRadius(copyRadius(corners.get(0)));
            style.setBorderTopRightRadius(copyRadius(corners.get(1)));
            style.setBorderBottomRightRadius(copyRadius(corners.get(2)));
            style.setBorderBottomLeftRadius(copyRadius(corners.get(3)));
            style.setInBatch(false);
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
    public List<android.view.View> views() { return Collections.unmodifiableList(views); }
}
