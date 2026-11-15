package org.octanexplat.prerender;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

public final class StartupArtifactCheck {
    private static String quote(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\\' || c == '"') out.append('\\').append(c);
            else if (c < 32) out.append(String.format(java.util.Locale.ROOT, "\\u%04x", (int) c));
            else out.append(c);
        }
        return out.append('"').toString();
    }
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return quote((String) value);
        if (value instanceof Boolean || value instanceof Number) return value.toString();
        StringBuilder out = new StringBuilder(); boolean first = true;
        if (value instanceof List<?>) {
            out.append('[');
            for (Object item : (List<?>) value) { if (!first) out.append(','); first = false; out.append(json(item)); }
            return out.append(']').toString();
        }
        if (!(value instanceof Map<?, ?>)) throw new IllegalArgumentException("Unexpected native output");
        out.append('{');
        for (Map.Entry<?, ?> item : ((Map<?, ?>) value).entrySet()) {
            if (!first) out.append(','); first = false;
            out.append(quote((String) item.getKey())).append(':').append(json(item.getValue()));
        }
        return out.append('}').toString();
    }
    public static void main(String[] args) throws Exception {
        try {
            if (!(args.length == 3 || args.length == 4 || args.length == 11) || Files.size(Paths.get(args[0])) > 1048576) throw new IllegalArgumentException("Arguments or byte length");
            StartupArtifact.Snapshot result = StartupArtifact.decode(Files.readAllBytes(Paths.get(args[0])), args[1], args[2]);
            Object output = args.length == 4 ? result.visualNodes() : args.length == 11
                ? result.supports(Double.parseDouble(args[3]), Double.parseDouble(args[4]), Double.parseDouble(args[5]), Boolean.parseBoolean(args[6]),
                        Double.parseDouble(args[7]), Double.parseDouble(args[8]), Double.parseDouble(args[9]), Double.parseDouble(args[10]))
                : result.value;
            System.out.write(json(output).getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException error) {
            System.err.println("Native startup rejected: " + error.getMessage()); System.exit(1);
        }
    }
}
