import { fileURLToPath } from 'node:url'
import { linuxGtk } from '../../../cli/src/linux-gtk/vite.ts'

export default async (env) =>
  linuxGtk(env, {
    root: fileURLToPath(new URL('.', import.meta.url)),
    entry: 'src/routing-main.ts',
    outDir: 'dist/routing',
  })
