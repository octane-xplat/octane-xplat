import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. The root config's generated env programs
// exist only after `xplat typecheck` runs — pin the test transform to the
// committed env manifest so the suite never depends on generated state.
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  resolve: {
    alias: {
      'gi://Gtk?version=4.0': fileURLToPath(new URL('./tests/fakes/gtk.ts', import.meta.url)),
      'gi://Gio': fileURLToPath(new URL('./tests/fakes/gio.ts', import.meta.url)),
      'gi://GLib': fileURLToPath(new URL('./tests/fakes/glib.ts', import.meta.url)),
    },
  },
  test: { environment: 'jsdom', globals: true },
})
