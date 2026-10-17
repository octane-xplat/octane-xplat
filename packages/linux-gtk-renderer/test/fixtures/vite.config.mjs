import { fileURLToPath } from 'node:url'
// Source import — consumers use '@octane-xplat/cli/linux-gtk/vite' (built
// dist); the test must not depend on the cli package's build state.
import { xplatLinuxGtk } from '../../../cli/src/linux-gtk/vite.ts'

export default async (env) =>
	xplatLinuxGtk(env, {
		root: fileURLToPath(new URL('.', import.meta.url)),
		entry: 'src/main.ts',
	})
