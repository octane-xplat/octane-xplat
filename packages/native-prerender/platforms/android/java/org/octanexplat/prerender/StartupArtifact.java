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
    public static final class Snapshot {
        public final Map<String, Object> value;
        public final List<Node> nodes;
        private Snapshot(Map<String, Object> value, List<Node> nodes) {
            this.value = value; this.nodes = Collections.unmodifiableList(nodes);
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
                row.put("parent", visual.parent < 0 ? null : visual.parent); row.put("kind", visual.node.kind);
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
        /** Inclusive bounds; false selects ordinary rendering before native allocation. */
        public boolean supports(double fontScale, double width, double height, boolean reducedMotion) {
            require(finite(fontScale) && finite(width) && finite(height) && fontScale >= 0 && width >= 0 && height >= 0, "invalid environment");
            for (Object item : list(value.get("constraints"))) {
                Map<String, Object> row = object(item);
                String input = text(row.get("input"));
                if (input.equals("fontScale") && fontScale != number(row.get("equals"))) return false;
                if (input.equals("reducedMotion") && reducedMotion != (Boolean) row.get("equals")) return false;
                if (input.equals("width") || input.equals("height")) {
                    double actual = input.equals("width") ? width : height;
                    if (actual < number(row.get("min")) || actual > number(row.get("max"))) return false;
                }
            }
            return true;
        }
    }
    private static final Set<String> STYLE_KEYS = new HashSet<>(Arrays.asList(
        "alignItems", "backgroundColor", "borderRadius", "borderWidth", "color", "columnGap",
        "cornerShape", "display", "flexDirection", "flexGrow", "flexShrink", "fontFamily", "fontSize",
        "fontWeight", "height", "justifyContent", "lineHeight", "maxWidth", "minWidth", "paddingBottom",
        "paddingLeft", "paddingRight", "paddingTop", "rowGap", "textOverflow", "userSelect", "whiteSpace"));
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
        for (Map.Entry<String, Object> item : node.props.entrySet()) {
            String key = item.getKey(); Object value = item.getValue();
            switch (key) {
                case "id": case "className": case "text": case "testID": case "whiteSpace":
                case "accessibilityRole": case "accessibilityLabel": case "accessibilityHint": text(value); break;
                case "accessible": case "isEnabled": require(value instanceof Boolean, "boolean host prop"); break;
                case "maxLines": integer(value, 0, 1000000); break;
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
    private static Snapshot validate(Object value, int count, String build, String platform) {
        Map<String, Object> root = object(value);
        keys(root, "version", "platform", "hostContract", "build", "seed", "constraints", "nodes", "variants");
        require(number(root.get("version")) == 1 && "mason-label-v1".equals(root.get("hostContract")), "schema or host contract");
        require(build.equals(root.get("build")) && platform.equals(root.get("platform")), "artifact/app identity");
        object(root.get("seed")); literalBounds(root.get("seed"), 0, new int[]{100000});
        List<?> records = list(root.get("nodes")); require(records.size() == count, "header node count");
        List<Node> nodes = new ArrayList<>(); List<Integer> visual = new ArrayList<>();
        for (int index = 0; index < records.size(); index++) {
            Map<String, Object> row = object(records.get(index)); keys(row, "index", "path", "parent", "kind", "props");
            require(integer(row.get("index"), 0, 1023) == index, "node index");
            String kind = text(row.get("kind")); require(Arrays.asList("masonview", "label", "#text").contains(kind), "host kind");
            int parent = -1;
            if (index == 0) require(row.get("parent") == null && !kind.equals("#text"), "root parent or kind");
            else {
                parent = integer(row.get("parent"), 0, index - 1); String owner = nodes.get(parent).kind;
                require(owner.equals("masonview") ? !kind.equals("#text") : owner.equals("label") && kind.equals("#text"), "child kind");
            }
            String path = parent < 0 ? "0" : nodes.get(parent).path + "/" + nodes.get(parent).children.size();
            require(path.equals(row.get("path")) && path.split("/", -1).length <= 64, "node address or depth");
            Node node = new Node(index, parent, path, kind, object(row.get("props"))); props(node); nodes.add(node);
            if (parent >= 0) nodes.get(parent).children.add(index);
            if (!kind.equals("#text")) visual.add(index);
        }
        require(visit(nodes, 0, 0) == nodes.size(), "unreachable node");
        List<?> constraints = list(root.get("constraints")); require(constraints.size() <= 4, "constraint count");
        Set<String> seen = new HashSet<>();
        for (Object item : constraints) {
            Map<String, Object> row = object(item); String input = text(row.get("input")); require(seen.add(input), "duplicate constraint");
            if (input.equals("fontScale")) { keys(row, "input", "equals"); require(number(row.get("equals")) == 1, "font scale"); }
            else if (input.equals("reducedMotion")) { keys(row, "input", "equals"); require(row.get("equals") instanceof Boolean, "motion constraint"); }
            else {
                require(input.equals("width") || input.equals("height"), "unknown launch input"); keys(row, "input", "min", "max");
                double min = number(row.get("min")), max = number(row.get("max")); require(min >= 0 && max >= min, "dimension interval");
            }
        }
        require(seen.contains("fontScale"), "font scale preflight required");
        Map<String, Object> variants = object(root.get("variants")); keys(variants, "light", "dark");
        Map<String, Object> normalizedVariants = new LinkedHashMap<>();
        for (String theme : new String[]{"light", "dark"}) {
            List<?> rows = list(variants.get(theme)); require(rows.size() == visual.size(), "variant node count");
            List<Object> normalized = new ArrayList<>();
            for (int index = 0; index < rows.size(); index++) {
                Map<String, Object> row = object(rows.get(index)); keys(row, "node", "style", "cssKeys", "inheritedKeys");
                require(integer(row.get("node"), 0, count - 1) == visual.get(index), "style node identity");
                style(row.get("style")); Map<String, Object> style = object(row.get("style"));
                Map<String, Object> copy = new LinkedHashMap<>(row);
                copy.put("cssKeys", provenance(row.get("cssKeys"), style)); copy.put("inheritedKeys", provenance(row.get("inheritedKeys"), style));
                normalized.add(Collections.unmodifiableMap(copy));
            }
            normalizedVariants.put(theme, Collections.unmodifiableList(normalized));
        }
        Map<String, Object> normalizedRoot = new LinkedHashMap<>(root);
        normalizedRoot.put("variants", Collections.unmodifiableMap(normalizedVariants));
        return new Snapshot(Collections.unmodifiableMap(normalizedRoot), nodes);
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
        reader.need(4); require(reader.bytes.getShort() == 1 && reader.bytes.getShort() == 0 && reader.uint() == data.length, "binary version, flags or length");
        int count = reader.count(1024); require(count > 0, "node count");
        require(hex(reader.take(32)).equals(expectedBuild), "binary build identity");
        byte[] checksum = reader.take(32);
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256"); sha.update(data, 80, data.length - 80);
            require(MessageDigest.isEqual(checksum, sha.digest()), "payload checksum");
        } catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
        Object value = reader.literal(0); require(!reader.bytes.hasRemaining(), "trailing bytes");
        return validate(value, count, expectedBuild, expectedPlatform);
    }
}
