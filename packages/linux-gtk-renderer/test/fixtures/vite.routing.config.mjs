import { fileURLToPath } from 'node:url'
import { xplatLinuxGtk } from '../../../cli/src/linux-gtk/vite.ts'

export default async (env) =>
	xplatLinuxGtk(env, {
		root: fileURLToPath(new URL('.', import.meta.url)),
		entry: 'src/routing-main.ts',
		outDir: 'dist/routing',
	})
