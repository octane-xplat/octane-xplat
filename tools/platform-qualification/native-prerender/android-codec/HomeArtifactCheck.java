package org.octanexplat.prerenderandroid;

import org.octanexplat.prerender.MasonArtifact;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/** Host-only debug projection; no Android or JSON library required. */
public final class HomeArtifactCheck {
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String) {
            StringBuilder text = new StringBuilder("\"");
            for (char c : ((String) value).toCharArray()) {
                if (c == '"' || c == '\\') text.append('\\').append(c);
                else if (c < 32) text.append(String.format(java.util.Locale.ROOT, "\\u%04x", (int) c));
                else text.append(c);
            }
            return text.append('"').toString();
        }
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        StringBuilder result = new StringBuilder();
        if (value instanceof Map<?, ?>) {
            result.append('{');
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
                if (result.length() > 1) result.append(',');
                result.append(json(entry.getKey())).append(':').append(json(entry.getValue()));
            }
            return result.append('}').toString();
        }
        if (value instanceof Iterable<?>) {
            result.append('[');
            for (Object item : (Iterable<?>) value) {
                if (result.length() > 1) result.append(',');
                result.append(json(item));
            }
            return result.append(']').toString();
        }
        throw new IllegalArgumentException("Unsupported debug literal");
    }
    public static void main(String[] args) {
        try {
            if (args.length != 2) throw new MasonArtifact.Invalid("expected artifact path and build hash");
            if (Files.size(Paths.get(args[0])) > 1024 * 1024) throw new MasonArtifact.Invalid("size limit");
            byte[] bytes = Files.readAllBytes(Paths.get(args[0]));
            System.out.write(json(MasonArtifact.decode(bytes, args[1]).projection()).getBytes(StandardCharsets.UTF_8));
        } catch (Exception error) {
            System.err.println("Home IR rejected: " + error.getMessage());
            System.exit(1);
        }
    }
}
