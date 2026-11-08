import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'gi://Gtk?version=4.0': fileURLToPath(new URL('./tests/fakes/gtk.ts', import.meta.url)),
      'gi://Gio': fileURLToPath(new URL('./tests/fakes/gio.ts', import.meta.url)),
      'gi://GLib': fileURLToPath(new URL('./tests/fakes/glib.ts', import.meta.url)),
    },
  },
  test: { environment: 'jsdom', globals: true },
})
