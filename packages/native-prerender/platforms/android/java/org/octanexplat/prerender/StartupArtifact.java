package org.octanexplat.prerender;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** XPI1 structural preflight. No Android, NativeScript, Mason or UI allocation. */
public final class StartupArtifact {
    public static final class Invalid extends IllegalArgumentException {
        Invalid(String reason) { super("Native startup IR: " + reason); }
    }
    public static final class Node {
        public final int index, parent;
        public final String path, kind;
        public final Map<String, Object> props;
        private final List<Integer> children = new ArrayList<>();
        private Node(int index, int parent, String path, String kind, Map<String, Object> props) {
            this.index = index; this.parent = parent; this.path = path; this.kind = kind; this.props = props;
        }
        public List<Integer> children() { return Collections.unmodifiableList(children); }
    }
    public static final class LaunchInput {
        public final String name;
        public final List<String> values;
        public final String fallback;
        private LaunchInput(String name, List<String> values, String fallback) {
            this.name = name; this.values = Collections.unmodifiableList(values); this.fallback = fallback;
        }
    }
    /** One prerendered tree for a launch-input bind; owns its logical nodes and its scheme variants (exactly the bound scheme on layered trees, both on flat artifacts). */
    public static final class Tree {
        public final Map<String, Object> bind;
        public final List<Node> nodes;
        public final Map<String, Object> variants;
        public final Map<String, Object> value;
        private Tree(Map<String, Object> bind, List<Node> nodes, Map<String, Object> variants, Map<String, Object> value) {
            this.bind = bind; this.nodes = Collections.unmodifiableList(nodes); this.variants = variants; this.value = value;
        }
        public List<Map<String, Object>> visualNodes() {
            List<VisualRecord> records = new ArrayList<>();
            int[] indices = new int[nodes.size()]; Arrays.fill(indices, -1);
            for (Node node : nodes) {
                if (node.kind.equals("#text")) {
                    records.get(indices[node.parent]).text += (String) node.props.get("value");
                    continue;
                }
                int index = records.size(), parent = node.parent < 0 ? -1 : indices[node.parent];
                VisualRecord owner = parent < 0 ? null : records.get(parent);
                String path = owner == null ? "0" : owner.path + "/" + owner.children.size();
                records.add(new VisualRecord(index, parent, path, node)); indices[node.index] = index;
                if (owner != null) owner.children.add(index);
            }
            List<Map<String, Object>> result = new ArrayList<>();
            for (VisualRecord visual : records) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("index", visual.index); row.put("logicalNode", visual.node.index); row.put("path", visual.path);
                row.put("parent", visual.parent < 0 ? null : visual.parent);
                boolean placeholder = PLACEHOLDER_PROPS.containsKey(visual.node.kind);
                row.put("kind", placeholder ? "placeholder" : visual.node.kind);
                if (placeholder) row.put("hostKind", visual.node.kind);
                row.put("props", visual.node.props); row.put("text", visual.text);
                row.put("children", Collections.unmodifiableList(new ArrayList<>(visual.children)));
                result.add(Collections.unmodifiableMap(row));
            }
            return Collections.unmodifiableList(result);
        }
        private static final class VisualRecord {
            final int index, parent;
            final String path;
            final Node node;
            final List<Integer> children = new ArrayList<>();
            String text;
            VisualRecord(int index, int parent, String path, Node node) {
                this.index = index; this.parent = parent; this.path = path; this.node = node;
                text = node.props.containsKey("text") ? (String) node.props.get("text") : "";
            }
        }
    }
    public static final class Snapshot {
        public final Map<String, Object> value;
        /** First tree's nodes — the only tree for flat artifacts. Launch-input artifacts must resolve through select(). */
        public final List<Node> nodes;
        public final List<LaunchInput> launchInputs;
        public final List<Tree> trees;
        private Snapshot(Map<String, Object> value, List<LaunchInput> launchInputs, List<Tree> trees) {
            this.value = value;
            this.launchInputs = Collections.unmodifiableList(launchInputs);
            this.trees = Collections.unmodifiableList(trees);
            this.nodes = trees.isEmpty() ? Collections.emptyList() : trees.get(0).nodes;
        }
        /**
         * Resolve declared launch inputs plus the implicit systemAppearance
         * bind and pick the matching prerendered tree index. A null resolver
         * result means the key is absent; the declared default then applies.
         * systemAppearance has no persisted store or declared default: the
         * caller answers it from the OS appearance read, and an absent or
         * out-of-domain answer selects nothing. Returns null when the
         * effective values match no bind — callers must fall back to
         * JavaScript boot, never pick another tree. Flat artifacts return
         * index 0 without resolving.
         */
        public Integer selectIndex(java.util.function.Function<String, String> resolve) {
            if (trees.size() <= 1) return trees.isEmpty() ? null : 0;
            Map<String, String> effective = new LinkedHashMap<>();
            for (LaunchInput input : launchInputs) {
                String stored = resolve.apply(input.name);
                effective.put(input.name, stored != null ? stored : input.fallback);
            }
            effective.put("systemAppearance", resolve.apply("systemAppearance"));
            for (int index = 0; index < trees.size(); index++) {
                Tree tree = trees.get(index); boolean match = true;
                for (LaunchInput input : launchInputs) {
                    Object bound = tree.bind.get(input.name); String expected = effective.get(input.name);
                    if (expected == null ? bound != null : !expected.equals(bound)) { match = false; break; }
                }
                if (match && !tree.bind.get("systemAppearance").equals(effective.get("systemAppearance"))) match = false;
                if (match) return index;
            }
            return null;
        }
        public Tree select(java.util.function.Function<String, String> resolve) {
            Integer index = selectIndex(resolve);
            return index == null ? null : trees.get(index);
        }
        public List<Map<String, Object>> visualNodes() {
            require(trees.size() == 1, "visual projection requires tree selection");
            return trees.get(0).visualNodes();
        }
        /** Inclusive bounds; false selects ordinary rendering before native allocation. */
        public boolean supports(double fontScale, double width, double height, boolean reducedMotion,
                double safeAreaTop, double safeAreaRight, double safeAreaBottom, double safeAreaLeft) {
            require(finite(fontScale) && finite(width) && finite(height) && finite(safeAreaTop) &&
                finite(safeAreaRight) && finite(safeAreaBottom) && finite(safeAreaLeft) &&
                fontScale >= 0 && width >= 0 && height >= 0 &&
                safeAreaTop >= 0 && safeAreaRight >= 0 && safeAreaBottom >= 0 && safeAreaLeft >= 0,
                "invalid environment");
            for (Object item : list(value.get("constraints"))) {
                Map<String, Object> row = object(item);
                String input = text(row.get("input"));
                if (input.equals("fontScale") && fontScale != number(row.get("equals"))) return false;
                if (input.equals("reducedMotion") && reducedMotion != (Boolean) row.get("equals")) return false;
                double inset = -1;
                if (input.equals("safeAreaTop")) inset = safeAreaTop;
                if (input.equals("safeAreaRight")) inset = safeAreaRight;
                if (input.equals("safeAreaBottom")) inset = safeAreaBottom;
                if (input.equals("safeAreaLeft")) inset = safeAreaLeft;
                if (inset >= 0 && inset != number(row.get("equals"))) return false;
                if (input.equals("width") || input.equals("height")) {
                    double actual = input.equals("width") ? width : height;
                    if (actual < number(row.get("min")) || actual > number(row.get("max"))) return false;
                }
            }
            return true;
        }
    }
    // Each placeholder kind's allowed props with their value type; cold mounts
    // an empty box, so only authored geometry reaches the startup tree anyway.
    private static final Map<String, Map<String, String>> PLACEHOLDER_PROPS = new LinkedHashMap<>();
    static {
        Map<String, String> indicator = new LinkedHashMap<>();
        indicator.put("id", "string"); indicator.put("className", "string");
        indicator.put("style", "style"); indicator.put("busy", "boolean");
        PLACEHOLDER_PROPS.put("activityindicator", Collections.unmodifiableMap(indicator));
        Map<String, String> svg = new LinkedHashMap<>();
        svg.put("id", "string"); svg.put("className", "string"); svg.put("style", "style");
        svg.put("src", "string"); svg.put("stretch", "string");
        svg.put("accessible", "boolean"); svg.put("accessibilityLabel", "string");
        PLACEHOLDER_PROPS.put("svgview", Collections.unmodifiableMap(svg));
        Map<String, String> image = new LinkedHashMap<>();
        image.put("id", "string"); image.put("className", "string");
        image.put("style", "style"); image.put("stretch", "string");
        image.put("loadMode", "string"); image.put("accessibilityLabel", "string");
        PLACEHOLDER_PROPS.put("image", Collections.unmodifiableMap(image));
    }
    private static final Set<String> STYLE_KEYS = new HashSet<>(Arrays.asList(
        "alignItems", "alignSelf", "backgroundColor", "borderRadius", "borderWidth", "color", "columnGap",
        "cornerShape", "display", "flexDirection", "flexGrow", "flexShrink", "fontFamily", "fontSize",
        "fontWeight", "gridColumn", "gridRow", "gridTemplateColumns", "gridTemplateRows", "height", "justifyContent", "justifySelf", "lineHeight", "maxHeight", "maxWidth", "minWidth", "minHeight", "opacity", "overflowX", "overflowY", "paddingBottom",
        "paddingLeft", "paddingRight", "paddingTop", "rowGap", "textOverflow", "userSelect", "whiteSpace", "width"));
    private static void require(boolean condition, String reason) { if (!condition) throw new Invalid(reason); }
    private static boolean finite(double value) { return !Double.isNaN(value) && !Double.isInfinite(value); }
    private static String text(Object value) {
        require(value instanceof String && ((String) value).length() <= 65536, "expected string");
        return (String) value;
    }
    private static double number(Object value) {
        require(value instanceof Double && finite((Double) value), "expected finite number");
        return (Double) value;
    }
    private static int integer(Object value, int min, int max) {
        double result = number(value);
        require(result >= min && result <= max && Math.floor(result) == result, "integer range");
        return (int) result;
    }
    private static List<?> list(Object value) {
        require(value instanceof List<?>, "expected array"); return (List<?>) value;
    }
    private static Map<String, Object> object(Object value) {
        require(value instanceof Map<?, ?>, "expected object");
        Map<String, Object> result = new LinkedHashMap<>();
        for (Map.Entry<?, ?> item : ((Map<?, ?>) value).entrySet()) {
            require(item.getKey() instanceof String, "object key"); result.put((String) item.getKey(), item.getValue());
        }
        return Collections.unmodifiableMap(result);
    }
    private static void keys(Map<String, Object> value, String... names) {
        require(value.keySet().equals(new HashSet<>(Arrays.asList(names))), "object fields differ");
    }
    private static void style(Object value) {
        for (Map.Entry<String, Object> item : object(value).entrySet())
            require(STYLE_KEYS.contains(item.getKey()) && (item.getValue() instanceof String ||
                item.getValue() instanceof Double && finite((Double) item.getValue())), "style property or value");
    }
    private static List<String> provenance(Object value, Map<String, Object> style) {
        List<String> result = new ArrayList<>(); Set<String> seen = new HashSet<>();
        for (Object item : list(value)) {
            String key = text(item); require(seen.add(key) && style.containsKey(key), "style provenance"); result.add(key);
        }
        require(result.size() <= STYLE_KEYS.size(), "style provenance count");
        Collections.sort(result); return Collections.unmodifiableList(result);
    }
    private static void literalBounds(Object value, int depth, int[] budget) {
        require(--budget[0] >= 0 && depth < 24, "literal complexity");
        if (value instanceof List<?>) {
            require(list(value).size() <= 1024, "literal array length");
            for (Object item : list(value)) literalBounds(item, depth + 1, budget);
        } else if (value instanceof Map<?, ?>) {
            require(object(value).size() <= 256, "literal object length");
            for (Object item : object(value).values()) literalBounds(item, depth + 1, budget);
        }
    }
    private static void props(Node node) {
        literalBounds(node.props, 0, new int[]{100000});
        if (node.kind.equals("#text")) {
            keys(node.props, "value"); text(node.props.get("value"));
            return;
        }
        Map<String, String> placeholderProps = PLACEHOLDER_PROPS.get(node.kind);
        if (placeholderProps != null) {
            for (Map.Entry<String, Object> item : node.props.entrySet()) {
                String key = item.getKey(); Object value = item.getValue();
                switch (placeholderProps.getOrDefault(key, "")) {
                    case "string": text(value); break;
                    case "boolean": require(value instanceof Boolean, "boolean host prop"); break;
                    case "style": style(value); break;
                    default: throw new Invalid("unsupported host prop " + key);
                }
            }
            return;
        }
        for (Map.Entry<String, Object> item : node.props.entrySet()) {
            String key = item.getKey(); Object value = item.getValue();
            switch (key) {
                case "id": case "className": case "text": case "testID": case "whiteSpace":
                case "accessibilityRole": case "accessibilityLabel": case "accessibilityHint":
                case "accessibilityState": case "accessibilityValue": text(value); break;
                case "accessible": case "isEnabled": case "iosIgnoreSafeArea": require(value instanceof Boolean, "boolean host prop"); break;
                case "maxLines": integer(value, 0, 1000000); break;
                case "orientation": require(node.kind.equals("scrollview") && Arrays.asList("vertical", "horizontal").contains(text(value)), "scroll orientation"); break;
                case "style": style(value); break;
                default: throw new Invalid("unsupported host prop " + key);
            }
        }
        require(node.kind.equals("label") || !node.props.containsKey("text"), "container text prop");
    }
    private static int visit(List<Node> nodes, int index, int expected) {
        require(index == expected++, "nodes must use depth-first order");
        Node node = nodes.get(index);
        require(!node.kind.equals("label") || node.children.isEmpty() || !node.props.containsKey("text"), "ambiguous label content");
        for (int child : node.children) expected = visit(nodes, child, expected);
        return expected;
    }
    private static final class NodeList {
        final List<Node> nodes;
        final List<Integer> visual;
        NodeList(List<Node> nodes, List<Integer> visual) { this.nodes = nodes; this.visual = visual; }
    }
    private static NodeList nodes(Object value) {
        List<?> records = list(value); require(records.size() >= 1 && records.size() <= 1024, "node count");
        List<Node> nodes = new ArrayList<>(); List<Integer> visual = new ArrayList<>();
        for (int index = 0; index < records.size(); index++) {
            Map<String, Object> row = object(records.get(index)); keys(row, "index", "path", "parent", "kind", "props");
            require(integer(row.get("index"), 0, 1023) == index, "node index");
            String kind = text(row.get("kind")); require(Arrays.asList("masonview", "scrollview", "label", "#text").contains(kind) || PLACEHOLDER_PROPS.containsKey(kind), "host kind");
            int parent = -1;
            if (index == 0) require(row.get("parent") == null && !kind.equals("#text"), "root parent or kind");
            else {
                parent = integer(row.get("parent"), 0, index - 1); String owner = nodes.get(parent).kind;
                require(owner.equals("masonview") || owner.equals("scrollview") ? !kind.equals("#text") : owner.equals("label") && kind.equals("#text"), "child kind");
            }
            String path = parent < 0 ? "0" : nodes.get(parent).path + "/" + nodes.get(parent).children.size();
            require(path.equals(row.get("path")) && path.split("/", -1).length <= 64, "node address or depth");
            Node node = new Node(index, parent, path, kind, object(row.get("props"))); props(node); nodes.add(node);
            if (parent >= 0) nodes.get(parent).children.add(index);
            if (!kind.equals("#text")) visual.add(index);
        }
        require(visit(nodes, 0, 0) == nodes.size(), "unreachable node");
        return new NodeList(nodes, visual);
    }
    private static List<Object> variant(Object value, List<Integer> visual, int count) {
        List<?> rows = list(value); require(rows.size() == visual.size(), "variant node count");
        List<Object> normalized = new ArrayList<>();
        for (int index = 0; index < rows.size(); index++) {
            Map<String, Object> row = object(rows.get(index)); keys(row, "node", "style", "cssKeys", "inheritedKeys");
            require(integer(row.get("node"), 0, count - 1) == visual.get(index), "style node identity");
            style(row.get("style")); Map<String, Object> style = object(row.get("style"));
            Map<String, Object> copy = new LinkedHashMap<>(row);
            copy.put("cssKeys", provenance(row.get("cssKeys"), style)); copy.put("inheritedKeys", provenance(row.get("inheritedKeys"), style));
            normalized.add(Collections.unmodifiableMap(copy));
        }
        return Collections.unmodifiableList(normalized);
    }
    private static Map<String, Object> variants(Object value, List<Integer> visual, int count) {
        Map<String, Object> variants = object(value); keys(variants, "light", "dark");
        Map<String, Object> normalizedVariants = new LinkedHashMap<>();
        normalizedVariants.put("light", variant(variants.get("light"), visual, count));
        normalizedVariants.put("dark", variant(variants.get("dark"), visual, count));
        return Collections.unmodifiableMap(normalizedVariants);
    }
    private static List<LaunchInput> launchInputs(Object value) {
        List<?> input = list(value); require(input.size() <= 8, "launch inputs");
        Set<String> seen = new HashSet<>(); List<LaunchInput> result = new ArrayList<>();
        for (Object item : input) {
            Map<String, Object> row = object(item); keys(row, "name", "source", "values", "default");
            String name = text(row.get("name"));
            require(name.length() <= 128 && name.chars().allMatch(code -> code >= 0x20 && code <= 0x7e) && seen.add(name), "launch input name");
            require(!name.equals("systemAppearance"), "launch input name collides with the implicit appearance input");
            require("appSettings.string".equals(row.get("source")), "launch input source");
            List<?> values = list(row.get("values")); require(values.size() >= 1 && values.size() <= 4, "launch input values");
            List<String> domain = new ArrayList<>();
            for (Object item2 : values) { String entry = text(item2); require(!domain.contains(entry), "duplicate launch input value"); domain.add(entry); }
            Object fallback = row.get("default");
            String effective = null;
            if (fallback instanceof String) { require(domain.contains(fallback), "launch input default"); effective = (String) fallback; }
            else require(fallback == null && row.containsKey("default"), "launch input default");
            result.add(new LaunchInput(name, domain, effective));
        }
        int product = 1;
        for (LaunchInput input2 : result) product *= input2.values.size() + (input2.fallback == null ? 1 : 0);
        // The implicit systemAppearance factor doubles the product into the
        // total tree bound.
        require(product <= 4, "launch input product");
        return result;
    }
    private static Snapshot validate(Object value, int count, String build, String platform, boolean layered) {
        Map<String, Object> root = object(value);
        boolean layeredKeys = root.containsKey("launchInputs") || root.containsKey("trees");
        require(layeredKeys == layered, "binary launch flags");
        if (layered) keys(root, "version", "platform", "hostContract", "build", "seed", "constraints", "launchInputs", "trees");
        else keys(root, "version", "platform", "hostContract", "build", "seed", "constraints", "nodes", "variants");
        require(number(root.get("version")) == 1 && "mason-label-v1".equals(root.get("hostContract")), "schema or host contract");
        require(build.equals(root.get("build")) && platform.equals(root.get("platform")), "artifact/app identity");
        object(root.get("seed")); literalBounds(root.get("seed"), 0, new int[]{100000});
        List<?> constraints = list(root.get("constraints")); require(constraints.size() <= 8, "constraint count");
        Set<String> seen = new HashSet<>();
        for (Object item : constraints) {
            Map<String, Object> row = object(item); String input = text(row.get("input")); require(seen.add(input), "duplicate constraint");
            if (input.equals("fontScale")) { keys(row, "input", "equals"); require(number(row.get("equals")) == 1, "font scale"); }
            else if (input.equals("reducedMotion")) { keys(row, "input", "equals"); require(row.get("equals") instanceof Boolean, "motion constraint"); }
            else if (input.equals("width") || input.equals("height")) {
                keys(row, "input", "min", "max");
                double min = number(row.get("min")), max = number(row.get("max")); require(min >= 0 && max >= min, "dimension interval");
            }
            else {
                require(input.equals("safeAreaTop") || input.equals("safeAreaRight") ||
                    input.equals("safeAreaBottom") || input.equals("safeAreaLeft"), "unknown launch input");
                keys(row, "input", "equals"); require(number(row.get("equals")) >= 0, "safe-area inset");
            }
        }
        require(seen.contains("fontScale"), "font scale preflight required");
        List<LaunchInput> launchInputs = new ArrayList<>(); List<Tree> trees = new ArrayList<>();
        Map<String, Object> normalizedRoot = new LinkedHashMap<>(root);
        if (layered) {
            launchInputs = launchInputs(root.get("launchInputs"));
            int product = 1;
            for (LaunchInput input : launchInputs) product *= input.values.size() + (input.fallback == null ? 1 : 0);
            require(product <= 4, "launch input product");
            // Every declared bind point crossed with the implicit
            // systemAppearance input.
            List<?> input = list(root.get("trees")); require(input.size() == product * 2, "tree count");
            Set<String> binds = new HashSet<>(); List<Object> normalizedTrees = new ArrayList<>(); int total = 0;
            for (Object item : input) {
                Map<String, Object> row = object(item); keys(row, "bind", "nodes", "variant");
                Map<String, Object> bind = object(row.get("bind"));
                List<String> names = new ArrayList<>(launchInputs.size() + 1);
                for (LaunchInput entry : launchInputs) names.add(entry.name);
                names.add("systemAppearance");
                keys(bind, names.toArray(new String[0]));
                StringBuilder canonical = new StringBuilder();
                for (LaunchInput declared : launchInputs) {
                    Object bound = bind.get(declared.name);
                    if (bound instanceof String) {
                        require(declared.values.contains(bound), "tree bind value outside declared domain");
                        canonical.append(declared.name).append("=\"").append(bound).append("\";");
                    } else {
                        require(bound == null && declared.fallback == null, "tree bind value outside declared domain");
                        canonical.append(declared.name).append("=null;");
                    }
                }
                Object appearance = bind.get("systemAppearance");
                require("light".equals(appearance) || "dark".equals(appearance), "tree bind appearance outside declared domain");
                canonical.append("systemAppearance=\"").append(appearance).append("\";");
                require(binds.add(canonical.toString()), "duplicate tree bind");
                NodeList treeNodes = nodes(row.get("nodes")); total += treeNodes.nodes.size();
                require(total <= count, "tree node count");
                List<Object> treeVariant = variant(row.get("variant"), treeNodes.visual, treeNodes.nodes.size());
                Map<String, Object> treeVariants = Collections.singletonMap((String) appearance, treeVariant);
                Map<String, Object> normalized = new LinkedHashMap<>();
                normalized.put("bind", bind); normalized.put("nodes", row.get("nodes")); normalized.put("variant", treeVariant);
                normalizedTrees.add(Collections.unmodifiableMap(normalized));
                trees.add(new Tree(bind, treeNodes.nodes, treeVariants, Collections.unmodifiableMap(normalized)));
            }
            require(total == count, "header node count");
            normalizedRoot.put("trees", Collections.unmodifiableList(normalizedTrees));
        } else {
            NodeList flat = nodes(root.get("nodes")); require(flat.nodes.size() == count, "header node count");
            Map<String, Object> flatVariants = variants(root.get("variants"), flat.visual, flat.nodes.size());
            trees.add(new Tree(Collections.emptyMap(), flat.nodes, flatVariants, Collections.emptyMap()));
            normalizedRoot.put("variants", flatVariants);
        }
        return new Snapshot(Collections.unmodifiableMap(normalizedRoot), launchInputs, trees);
    }
    private static final class Reader {
        final ByteBuffer bytes; int values;
        Reader(byte[] data) { bytes = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN); }
        void need(int count) { require(count >= 0 && count <= bytes.remaining(), "truncated binary value"); }
        int byteValue() { need(1); return bytes.get() & 255; }
        long uint() { need(4); return bytes.getInt() & 0xffffffffL; }
        byte[] take(int count) { need(count); byte[] result = new byte[count]; bytes.get(result); return result; }
        int count(int limit) { long n = uint(); require(n <= limit, "collection or string size"); return (int) n; }
        String text() {
            byte[] value = take(count(65536));
            try { return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(value)).toString(); }
            catch (CharacterCodingException error) { throw new Invalid("invalid UTF-8"); }
        }
        Object literal(int depth) {
            require(++values <= 100000 && depth < 32, "binary literal complexity");
            int tag = byteValue();
            if (tag == 0) return null;
            if (tag == 1 || tag == 2) return tag == 2;
            if (tag == 3) { need(8); double value = bytes.getDouble(); require(finite(value), "non-finite number"); return value == 0 ? 0.0 : value; }
            if (tag == 4) return text();
            require(tag == 5 || tag == 6, "unknown value tag");
            int count = count(tag == 5 ? 1024 : 256);
            if (tag == 5) {
                List<Object> result = new ArrayList<>();
                for (int i = 0; i < count; i++) result.add(literal(depth + 1));
                return Collections.unmodifiableList(result);
            }
            Map<String, Object> result = new LinkedHashMap<>(); String previous = null;
            for (int i = 0; i < count; i++) {
                String key = text(); require(previous == null || previous.compareTo(key) < 0, "duplicate or unsorted object key");
                result.put(key, literal(depth + 1)); previous = key;
            }
            return Collections.unmodifiableMap(result);
        }
    }
    private static String hex(byte[] data) {
        StringBuilder result = new StringBuilder();
        for (byte value : data) result.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
        return result.toString();
    }
    public static Snapshot decode(byte[] input, String expectedBuild, String expectedPlatform) {
        require(input != null && input.length >= 80 && input.length <= 1048576, "artifact byte length");
        require(expectedBuild != null && expectedBuild.matches("[0-9a-f]{64}") && Arrays.asList("ios", "android").contains(expectedPlatform), "expected identity");
        byte[] data = Arrays.copyOf(input, input.length); Reader reader = new Reader(data);
        require(Arrays.equals(reader.take(4), new byte[]{'X', 'P', 'I', '1'}), "binary magic");
        reader.need(2); require(reader.bytes.getShort() == 1, "binary version");
        reader.need(2); int flags = reader.bytes.getShort(); require(flags == 0 || flags == 1, "binary flags");
        require(reader.uint() == data.length, "binary length");
        int count = reader.count(1024); require(count > 0, "node count");
        require(hex(reader.take(32)).equals(expectedBuild), "binary build identity");
        byte[] checksum = reader.take(32);
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256"); sha.update(data, 80, data.length - 80);
            require(MessageDigest.isEqual(checksum, sha.digest()), "payload checksum");
        } catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
        Object value = reader.literal(0); require(!reader.bytes.hasRemaining(), "trailing bytes");
        return validate(value, count, expectedBuild, expectedPlatform, flags == 1);
    }
}
