package org.octanexplat.prerenderandroid;

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

/** XPH1 packaged Home preflight. No Android, NativeScript, UI or JS dependency. */
public final class HomeArtifact {
    public static final class Invalid extends IllegalArgumentException {
        Invalid(String reason) { super(reason); }
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
        public final String scope;
        public final Map<String, Object> seed;
        public final List<Node> nodes;
        public final Map<String, List<StyleRecord>> variants;
        Artifact(String scope, Map<String, Object> seed, List<Node> nodes, Map<String, List<StyleRecord>> variants) {
            this.scope = scope; this.seed = seed;
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
            return map("scope", scope, "seed", seed, "nodes", projectedNodes, "variants", projectedVariants);
        }
    }
    private static Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }
    private static void require(boolean value, String reason) { if (!value) throw new Invalid(reason); }

    private static final class Reader {
        final ByteBuffer bytes;
        int values;
        Reader(byte[] data) { bytes = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN); }
        void need(int count) { require(count >= 0 && count <= bytes.remaining(), "truncated record"); }
        int u8() { need(1); return bytes.get() & 255; }
        long u32() { need(4); return bytes.getInt() & 0xffffffffL; }
        byte[] take(int count) { need(count); byte[] result = new byte[count]; bytes.get(result); return result; }
        int count(int limit, String reason) {
            long count = u32(); require(count <= limit, reason); return (int) count;
        }
        String string() {
            byte[] data = take(count(65536, "string byte limit"));
            try {
                return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(data)).toString();
            } catch (CharacterCodingException error) { throw new Invalid("invalid string"); }
        }
        Object literal(int depth) {
            require(++values <= 100000 && depth < 16, "literal complexity limit");
            int tag = u8();
            switch (tag) {
                case 0: return null;
                case 1: return false;
                case 2: return true;
                case 3:
                    need(8); double value = bytes.getDouble();
                    require((!Double.isInfinite(value) && !Double.isNaN(value)), "non-finite number"); return value;
                case 4: return string();
                case 5:
                    int length = count(1024, "array limit");
                    List<Object> items = new ArrayList<>();
                    for (int i = 0; i < length; i++) items.add(literal(depth + 1));
                    return Collections.unmodifiableList(items);
                case 6: return objectContents(depth);
                default: throw new Invalid("unknown literal tag");
            }
        }
        Map<String, Object> object() {
            require(++values <= 100000, "literal complexity limit");
            require(u8() == 6, "expected object");
            return objectContents(0);
        }
        Map<String, Object> objectContents(int depth) {
            int length = count(256, "object limit");
            Map<String, Object> result = new LinkedHashMap<>();
            for (int i = 0; i < length; i++) {
                String key = string();
                require(!result.containsKey(key), "duplicate object key");
                result.put(key, literal(depth + 1));
            }
            return Collections.unmodifiableMap(result);
        }
        List<String> keys(Map<String, Object> style) {
            Object value = literal(0);
            require(value instanceof List<?>, "style provenance array");
            List<String> result = new ArrayList<>();
            Set<String> seen = new HashSet<>();
            for (Object key : (List<?>) value) {
                require(key instanceof String, "style provenance key");
                String text = (String) key;
                require(seen.add(text) && style.containsKey(text), "style provenance");
                result.add(text);
            }
            return Collections.unmodifiableList(result);
        }
    }
    private static void validateStyle(String key, Object value) {
        double n = value instanceof Double ? (Double) value : Double.NaN;
        boolean nonnegative = n >= 0 && (!Float.isInfinite((float) n) && !Float.isNaN((float) n));
        boolean valid;
        switch (key) {
            case "display": valid = "flex".equals(value); break;
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
            case "paddingLeft": case "rowGap": case "columnGap": case "minWidth": case "height":
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
    private static String hex(byte[] data) {
        StringBuilder result = new StringBuilder();
        for (byte value : data) result.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
        return result.toString();
    }
    public static Artifact decode(byte[] data, String expectedBuildHash) {
        require(data != null && data.length >= 80 && data.length <= 1024 * 1024 && expectedBuildHash != null &&
            expectedBuildHash.matches("[0-9a-f]{64}"), "size or build identity");
        Reader reader = new Reader(data);
        require(Arrays.equals(reader.take(4), new byte[]{'X', 'P', 'H', '1'}), "incompatible magic");
        reader.need(4);
        require(reader.bytes.getShort() == 1 && reader.bytes.getShort() == 0 && reader.u32() == data.length,
            "incompatible header");
        int count = reader.count(1024, "node count");
        require(count > 0, "node count");
        require(hex(reader.take(32)).equals(expectedBuildHash), "build mismatch");
        byte[] digest = reader.take(32);
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            sha.update(data, 80, data.length - 80);
            require(MessageDigest.isEqual(digest, sha.digest()), "payload checksum");
        } catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
        String scope = reader.string();
        Map<String, Object> seed = reader.object();
        List<String> kinds = new ArrayList<>(), paths = new ArrayList<>(), texts = new ArrayList<>();
        List<Integer> parents = new ArrayList<>();
        List<Map<String, Object>> props = new ArrayList<>();
        List<List<Integer>> children = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            int kind = reader.u8(); long parent = reader.u32();
            require(kind <= 1 && (index == 0 ? parent == 0xffffffffL : parent < index && kinds.get((int) parent).equals("masonview")),
                "node kind or parent");
            String text = reader.string();
            require(kind == 1 || text.isEmpty(), "container text");
            String path = index == 0 ? "0" : paths.get((int) parent) + "/" + children.get((int) parent).size();
            if (index > 0) children.get((int) parent).add(index);
            kinds.add(kind == 0 ? "masonview" : "label"); paths.add(path); texts.add(text);
            parents.add(index == 0 ? -1 : (int) parent); props.add(reader.object()); children.add(new ArrayList<>());
        }
        List<Node> nodes = new ArrayList<>();
        for (int i = 0; i < count; i++) nodes.add(new Node(i, parents.get(i), kinds.get(i), paths.get(i), texts.get(i), props.get(i), children.get(i)));
        Map<String, List<StyleRecord>> variants = new LinkedHashMap<>();
        for (String theme : new String[]{"light", "dark"}) {
            List<StyleRecord> rows = new ArrayList<>();
            for (int index = 0; index < count; index++) {
                Map<String, Object> style = reader.object();
                for (Map.Entry<String, Object> entry : style.entrySet()) validateStyle(entry.getKey(), entry.getValue());
                rows.add(new StyleRecord(index, style, reader.keys(style), reader.keys(style)));
            }
            variants.put(theme, Collections.unmodifiableList(rows));
        }
        require(!reader.bytes.hasRemaining(), "trailing bytes");
        return new Artifact(scope, seed, nodes, variants);
    }
}
