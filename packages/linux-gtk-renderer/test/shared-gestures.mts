import { build } from 'vite'
import { fileURLToPath } from 'node:url'
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
await build({
  logLevel: 'error',
  ...(await linuxGtk('production', {
    root: fixture,
    entry: 'src/ui-shared-gestures-main.ts',
    outDir: 'dist-shared-gestures',
  })),
})
console.log(
  'Built shared gesture OS-input fixture; run app.js with GJS and actual input. Build is not qualification.',
)
