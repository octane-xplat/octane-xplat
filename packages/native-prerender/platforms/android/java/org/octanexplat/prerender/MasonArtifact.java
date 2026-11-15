package org.octanexplat.prerender;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** XPI1 Mason/Label backend preflight. No Android, NativeScript, UI or JS dependency. */
public final class MasonArtifact {
    public static final class Invalid extends IllegalArgumentException {
        public Invalid(String reason) { super(reason); }
    }
    public static final class Node {
        public final int index, parent;
        public final String kind, path, text;
        public final Map<String, Object> props;
        public final List<Integer> children;
        Node(int index, int parent, String kind, String path, String text,
             Map<String, Object> props, List<Integer> children) {
            this.index = index; this.parent = parent; this.kind = kind;
            this.path = path; this.text = text; this.props = props;
            this.children = Collections.unmodifiableList(new ArrayList<>(children));
        }
    }
    public static final class StyleRecord {
        public final int index;
        public final Map<String, Object> style;
        public final List<String> cssKeys, inheritedKeys;
        StyleRecord(int index, Map<String, Object> style, List<String> cssKeys, List<String> inheritedKeys) {
            this.index = index; this.style = style; this.cssKeys = cssKeys; this.inheritedKeys = inheritedKeys;
        }
    }
    public static final class Artifact {
        public final org.octanexplat.prerender.StartupArtifact.Snapshot snapshot;
        public final Map<String, Object> seed;
        public final List<Node> nodes;
        public final Map<String, List<StyleRecord>> variants;
        Artifact(org.octanexplat.prerender.StartupArtifact.Snapshot snapshot, Map<String, Object> seed, List<Node> nodes, Map<String, List<StyleRecord>> variants) {
            this.snapshot = snapshot; this.seed = seed;
            this.nodes = Collections.unmodifiableList(nodes);
            this.variants = Collections.unmodifiableMap(variants);
        }
        public Map<String, Object> projection() {
            List<Object> projectedNodes = new ArrayList<>();
            for (Node n : nodes) projectedNodes.add(map("index", n.index, "parent", n.parent < 0 ? null : n.parent,
                "kind", n.kind, "path", n.path, "text", n.text, "props", n.props, "children", n.children));
            Map<String, Object> projectedVariants = new LinkedHashMap<>();
            for (Map.Entry<String, List<StyleRecord>> variant : variants.entrySet()) {
                List<Object> rows = new ArrayList<>();
                for (StyleRecord row : variant.getValue()) rows.add(map("index", row.index,
                    "style", row.style, "cssKeys", row.cssKeys, "inheritedKeys", row.inheritedKeys));
                projectedVariants.put(variant.getKey(), rows);
            }
            return map("seed", seed, "nodes", projectedNodes, "variants", projectedVariants);
        }
    }
    private static Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }
    private static void require(boolean value, String reason) { if (!value) throw new Invalid(reason); }

    private static void validateStyle(String key, Object value) {
        double n = value instanceof Double ? (Double) value : Double.NaN;
        boolean nonnegative = n >= 0 && (!Float.isInfinite((float) n) && !Float.isNaN((float) n));
        boolean valid;
        switch (key) {
            case "display": valid = "flex".equals(value) || "block".equals(value); break;
            case "flexDirection": valid = "row".equals(value) || "column".equals(value); break;
            case "alignItems": valid = "center".equals(value); break;
            case "justifyContent": valid = "center".equals(value) || "space-between".equals(value); break;
            case "maxWidth": valid = "100%".equals(value); break;
            case "cornerShape": valid = "squircle".equals(value); break;
            case "whiteSpace": valid = "normal".equals(value) || "nowrap".equals(value); break;
            case "textOverflow": valid = "clip".equals(value) || "ellipsis".equals(value); break;
            case "userSelect": valid = "none".equals(value); break;
            case "borderWidth": valid = n == 0; break;
            case "fontWeight": valid = n >= 100 && n <= 900 && n % 100 == 0; break;
            case "fontSize": valid = nonnegative && n > 0; break;
            case "fontFamily":
                valid = value instanceof String;
                if (valid) for (String family : ((String) value).split(",", -1))
                    if (family.replaceAll("^[ \\t\"']+|[ \\t\"']+$", "").isEmpty()) valid = false;
                break;
            case "color": case "backgroundColor": valid = value instanceof String && validColor((String) value); break;
            case "flexGrow": case "flexShrink": case "paddingTop": case "paddingRight": case "paddingBottom":
            case "paddingLeft": case "rowGap": case "columnGap": case "minWidth": case "minHeight": case "height":
            case "lineHeight": case "borderRadius": valid = nonnegative; break;
            default: throw new Invalid("unsupported style property: " + key);
        }
        require(valid, "unsupported style value: " + key);
    }
    private static boolean validColor(String text) {
        if (text.startsWith("#")) return text.matches("#[0-9a-fA-F]{6}");
        if (!text.startsWith("rgba(") || !text.endsWith(")")) return false;
        String[] parts = text.substring(5, text.length() - 1).split(",", -1);
        if (parts.length != 4) return false;
        for (int i = 0; i < parts.length; i++) {
            try {
                String token = parts[i].trim();
                if (!token.matches("[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?")) return false;
                double value = Double.parseDouble(token);
                if (!(!Double.isInfinite(value) && !Double.isNaN(value)) || value < 0 || value > (i == 3 ? 1 : 255)) return false;
            } catch (NumberFormatException error) { return false; }
        }
        return true;
    }
    @SuppressWarnings("unchecked") // Snapshot ingress validates each complete record.
    public static Artifact decode(byte[] data, String expectedBuildHash) {
        final org.octanexplat.prerender.StartupArtifact.Snapshot snapshot;
        try { snapshot = org.octanexplat.prerender.StartupArtifact.decode(data, expectedBuildHash, "android"); }
        catch (org.octanexplat.prerender.StartupArtifact.Invalid error) { throw new Invalid(error.getMessage()); }
        List<Node> nodes = new ArrayList<>();
        for (Map<String, Object> row : snapshot.visualNodes()) {
            int index = ((Number) row.get("index")).intValue();
            Object parent = row.get("parent");
            nodes.add(new Node(index, parent == null ? -1 : ((Number) parent).intValue(),
                (String) row.get("kind"), (String) row.get("path"), (String) row.get("text"),
                (Map<String, Object>) row.get("props"), (List<Integer>) row.get("children")));
        }
        Map<String, List<StyleRecord>> variants = new LinkedHashMap<>();
        Map<String, Object> source = (Map<String, Object>) snapshot.value.get("variants");
        for (String theme : new String[]{"light", "dark"}) {
            List<StyleRecord> rows = new ArrayList<>();
            for (Object item : (List<?>) source.get(theme)) {
                Map<String, Object> row = (Map<String, Object>) item;
                Map<String, Object> style = (Map<String, Object>) row.get("style");
                for (Map.Entry<String, Object> entry : style.entrySet()) validateStyle(entry.getKey(), entry.getValue());
                rows.add(new StyleRecord(rows.size(), style, (List<String>) row.get("cssKeys"), (List<String>) row.get("inheritedKeys")));
            }
            variants.put(theme, Collections.unmodifiableList(rows));
        }
        return new Artifact(snapshot, (Map<String, Object>) snapshot.value.get("seed"), nodes, variants);
    }
}
