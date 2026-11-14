import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Select portable dependency implementations explicitly. In particular, the
// abort-controller browser entry only re-exports browser globals, and the
// readable-stream main entry requires the host's core stream module.
export default defineConfig({
  resolve: {
    mainFields: ['module', 'main'],
    alias: [
      { find: /^buffer\/?$/, replacement: require.resolve('buffer/') },
      { find: /^events\/?$/, replacement: local('./src/vendor/events.ts') },
      {
        find: /^process(?:\/browser(?:\.js)?|\/)?$/,
        replacement: require.resolve('process/browser.js'),
      },
      {
        find: /^abort-controller$/,
        replacement: require.resolve('abort-controller/dist/abort-controller.js'),
      },
    ],
  },
  build: {
    target: 'es2020',
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
    lib: { entry: local('./scripts/engine.ts'), formats: ['es'], fileName: () => 'engine.js' },
    rolldownOptions: { output: { codeSplitting: false } },
  },
})
