import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
const outDir = join(fixture, 'dist-ui-focus')
const preset = await xplatLinuxGtk('production', { root: fixture, entry: 'src/ui-focus-main.ts', outDir })
await build({ logLevel: 'error', ...preset })
console.log('built ' + outDir + '/app.js')
