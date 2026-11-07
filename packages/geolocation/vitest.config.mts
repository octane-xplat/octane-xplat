import { defineConfig } from 'vitest/config'

// Leaf contract tests — web and NativeScript leaves driven through stubbed
// globals and a mocked @nativescript/geolocation (same rejection surfaces the
// pinned plugin produces). Not a substitute for a native smoke run.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
