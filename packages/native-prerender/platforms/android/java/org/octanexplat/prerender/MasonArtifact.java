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
        /** The logical kind a placeholder replaces at hydration; null on real hosts. */
        public final String hostKind;
        public final Map<String, Object> props;
        public final List<Integer> children;
        Node(int index, int parent, String kind, String path, String text,
             Map<String, Object> props, List<Integer> children, String hostKind) {
            this.index = index; this.parent = parent; this.kind = kind;
            this.path = path; this.text = text; this.props = props;
            this.children = Collections.unmodifiableList(new ArrayList<>(children));
            this.hostKind = hostKind;
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
        /** The bind this projection was built for; empty on flat artifacts. */
        public final Map<String, Object> bind;
        public final Map<String, Object> seed;
        public final List<Node> nodes;
        public final Map<String, List<StyleRecord>> variants;
        private final List<Artifact> trees;
        Artifact(org.octanexplat.prerender.StartupArtifact.Snapshot snapshot, Map<String, Object> bind,
                 Map<String, Object> seed, List<Node> nodes, Map<String, List<StyleRecord>> variants, List<Artifact> trees) {
            this.snapshot = snapshot; this.bind = bind; this.seed = seed;
            this.nodes = Collections.unmodifiableList(nodes);
            this.variants = Collections.unmodifiableMap(variants);
            this.trees = trees;
        }
        /** Every prerendered tree's projection; exactly one entry on flat artifacts. */
        public List<Artifact> trees() { return Collections.unmodifiableList(trees); }
        /**
         * Resolve declared launch inputs and return the matching projection.
         * Null means the resolved values match no bind — callers must fall back
         * to JavaScript boot, never pick another tree. Flat artifacts return
         * their single projection without invoking the resolver.
         */
        public Artifact select(java.util.function.Function<String, String> resolve) {
            Integer index = snapshot.selectIndex(resolve);
            return index == null ? null : trees.get(index);
        }
        public Map<String, Object> projection() {
            List<Object> projectedNodes = new ArrayList<>();
            for (Node n : nodes) {
                Map<String, Object> projected = map("index", n.index, "parent", n.parent < 0 ? null : n.parent,
                    "kind", n.kind, "path", n.path, "text", n.text, "props", n.props, "children", n.children);
                if (n.hostKind != null) projected.put("hostKind", n.hostKind);
                projectedNodes.add(projected);
            }
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
            case "display": valid = "flex".equals(value) || "block".equals(value) || "grid".equals(value); break;
            case "flexDirection": valid = "row".equals(value) || "column".equals(value); break;
            case "alignItems": valid = "center".equals(value); break;
            case "alignSelf": valid = "stretch".equals(value) || "center".equals(value); break;
            case "width": case "height": valid = nonnegative || "100%".equals(value); break;
            case "justifyContent": valid = "center".equals(value) || "space-between".equals(value); break;
            case "justifySelf": valid = "stretch".equals(value) || "center".equals(value); break;
            case "gridRow": case "gridColumn": valid = "1".equals(value); break;
            case "gridTemplateRows": case "gridTemplateColumns": valid = "1fr".equals(value); break;
            case "maxWidth": case "maxHeight": valid = "100%".equals(value); break;
            case "overflowX": case "overflowY": valid = "scroll".equals(value) || "hidden".equals(value); break;
            case "cornerShape": valid = "squircle".equals(value); break;
            case "whiteSpace": valid = "normal".equals(value) || "nowrap".equals(value); break;
            case "textOverflow": valid = "clip".equals(value) || "ellipsis".equals(value); break;
            case "userSelect": valid = "none".equals(value); break;
            case "borderWidth": valid = nonnegative; break;
            case "textAlign": valid = "center".equals(value) || "left".equals(value) || "right".equals(value); break;
            case "opacity": valid = n >= 0 && n <= 1; break;
            case "fontWeight": valid = n >= 100 && n <= 900 && n % 100 == 0; break;
            case "fontSize": valid = nonnegative && n > 0; break;
            case "fontFamily":
                valid = value instanceof String;
                if (valid) for (String family : ((String) value).split(",", -1))
                    if (family.replaceAll("^[ \\t\"']+|[ \\t\"']+$", "").isEmpty()) valid = false;
                break;
            case "color": case "backgroundColor": case "borderColor": valid = value instanceof String && validColor((String) value); break;
            case "flexGrow": case "flexShrink": case "paddingTop": case "paddingRight": case "paddingBottom":
            case "paddingLeft": case "rowGap": case "columnGap": case "minWidth": case "minHeight":
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
    private static Artifact project(org.octanexplat.prerender.StartupArtifact.Snapshot snapshot,
            org.octanexplat.prerender.StartupArtifact.Tree tree, Map<String, Object> seed, List<Artifact> trees) {
        List<Node> nodes = new ArrayList<>();
        for (Map<String, Object> row : tree.visualNodes()) {
            int index = ((Number) row.get("index")).intValue();
            Object parent = row.get("parent");
            nodes.add(new Node(index, parent == null ? -1 : ((Number) parent).intValue(),
                (String) row.get("kind"), (String) row.get("path"), (String) row.get("text"),
                (Map<String, Object>) row.get("props"), (List<Integer>) row.get("children"),
                (String) row.get("hostKind")));
        }
        Map<String, List<StyleRecord>> variants = new LinkedHashMap<>();
        // The validator keyed each layered tree's single variant by its bound
        // scheme; flat artifacts carry both. Project whatever schemes exist.
        for (Map.Entry<String, Object> schemeEntry : tree.variants.entrySet()) {
            String theme = schemeEntry.getKey();
            List<StyleRecord> rows = new ArrayList<>();
            for (Object item : (List<?>) schemeEntry.getValue()) {
                Map<String, Object> row = (Map<String, Object>) item;
                Map<String, Object> style = (Map<String, Object>) row.get("style");
                for (Map.Entry<String, Object> entry : style.entrySet()) validateStyle(entry.getKey(), entry.getValue());
                rows.add(new StyleRecord(rows.size(), style, (List<String>) row.get("cssKeys"), (List<String>) row.get("inheritedKeys")));
            }
            variants.put(theme, Collections.unmodifiableList(rows));
        }
        return new Artifact(snapshot, tree.bind, seed, nodes, variants, trees);
    }
    public static Artifact decode(byte[] data, String expectedBuildHash) {
        final org.octanexplat.prerender.StartupArtifact.Snapshot snapshot;
        try { snapshot = org.octanexplat.prerender.StartupArtifact.decode(data, expectedBuildHash, "android"); }
        catch (org.octanexplat.prerender.StartupArtifact.Invalid error) { throw new Invalid(error.getMessage()); }
        Map<String, Object> seed = (Map<String, Object>) snapshot.value.get("seed");
        // The shared list is complete after decode; nothing mutates it later.
        List<Artifact> trees = new ArrayList<>();
        for (org.octanexplat.prerender.StartupArtifact.Tree tree : snapshot.trees) {
            trees.add(project(snapshot, tree, seed, trees));
        }
        // The returned artifact is the flat-compatible single projection;
        // launch-input artifacts carry every tree's projection for select().
        Artifact first = trees.get(0);
        return new Artifact(snapshot, first.bind, seed, first.nodes, first.variants, trees);
    }
}
