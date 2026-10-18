import { fileURLToPath } from 'node:url'
// Source import — consumers use '@octane-xplat/cli/linux-gtk/vite' (built
// dist); the test must not depend on the cli package's build state.
import { xplatLinuxGtk } from '../../../cli/src/linux-gtk/vite.ts'

// Headless introspection smoke — `src/introspect.ts` mounts the fixture over
// a bare Gtk.Box and prints the widget tree + a click→update check. Run under
// `xvfb-run -a gjs -m dist/app.js`.
export default async (env) =>
	xplatLinuxGtk(env, {
		root: fileURLToPath(new URL('.', import.meta.url)),
		entry: 'src/introspect.ts',
	})
