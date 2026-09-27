import { defineConfig } from "vite";
import { octane } from "@octanejs/vite-plugin";
import { nativeScriptRenderer } from "@nativescript-community/octane/config";

const EXTENSIONS = [
  ".ios.tsrx",
  ".android.tsrx",
  ".native.tsrx",
  ".tsrx",
  ".ios.tsx",
  ".android.tsx",
  ".native.tsx",
  ".tsx",
  ".ios.ts",
  ".android.ts",
  ".native.ts",
  ".mjs",
  ".mts",
  ".ts",
  ".jsx",
  ".js",
  ".json",
];

export default defineConfig(({ mode }) => {
  const native = mode === "native";
  return {
    plugins: octane({
      renderers: native
        ? {
            registry: { nativescript: nativeScriptRenderer },
            rules: [
              { include: "**/*.{ts,tsx,tsrx}", renderer: "nativescript" },
            ],
          }
        : undefined,
    }),
    build: {
      lib: {
        entry: native ? "src/index.native.ts" : "src/index.web.ts",
        formats: ["es"],
      },
      outDir: native ? "dist/native" : "dist/web",
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        output: { preserveModules: true, entryFileNames: "index.js" },
        external: [/^octane/, /^@nativescript\//, /^@nativescript-community\//],
      },
    },
    resolve: {
      conditions: [native ? "native" : "web"],
      alias: native
        ? [{ find: /^octane$/, replacement: "octane/universal/native" }]
        : [],
      extensions: EXTENSIONS,
    },
  };
});
