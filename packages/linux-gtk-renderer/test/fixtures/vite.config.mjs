import { fileURLToPath } from 'node:url'
import { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'

export default async (env) =>
	xplatLinuxGtk(env, {
		root: fileURLToPath(new URL('.', import.meta.url)),
		entry: 'src/main.ts',
	})
