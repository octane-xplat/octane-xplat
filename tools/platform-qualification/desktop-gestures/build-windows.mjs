import { build } from 'vite'
import { fileURLToPath } from 'node:url'
await build({
  configFile: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'dist-windows-gestures',
    lib: {
      entry: fileURLToPath(new URL('./windows-owner.mjs', import.meta.url)),
      formats: ['iife'],
      name: 'WindowsGestureQualification',
    },
    minify: false,
  },
})
