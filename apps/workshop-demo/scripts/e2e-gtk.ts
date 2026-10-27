// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Workshop GTK e2e — drives `xplat workshop dev --target linux` on the GJS
 * GTK4 host through its stdin automation protocol. Shared journey lives in
 * ./native-journey.ts; this file owns GTK-only steps: the bundle
 * externalization assertion and the gtk-leaf mount.
 *
 * Interaction evidence here is signal dispatch through the real GtkButton
 * 'clicked' / Gtk.GestureClick 'released' handlers — it is not OS-synthesized
 * input. The window is created offscreen so the run never takes desktop focus.
 *
 * Usage: node scripts/e2e-gtk.ts [consumerRoot]
 *        (consumerRoot defaults to this demo app; a packed consumer passes its own)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { runNativeJourney } from './native-journey.ts'

await runNativeJourney({
	target: 'linux',
	hostBanner: 'WORKSHOP_GTK_HOST',
	hostCheckName: 'GJS/GTK4 host started',
	catalogLabel: 'linux',
	rendererName: 'the GTK renderer',
	expectedApplicable:
		'counter/async-fixture,counter/basic,counter/static,failing/broken,failing/fixture,platform/linux-gtk,providers/theme',
	expectedInapplicable: 3,

	// GJS prefixes console messages with `Gjs-Console-Message:` when stderr and
	// stdout share a stream; protocol lines need the marker stripped.
	normalize(line) {
		const i = line.indexOf('WORKSHOP_')
		return i < 0 ? line : line.slice(i)
	},

	// The stories bundle must keep the octane runtime and the renderer external
	// — an inlined second copy would fork signal/store identity between the
	// shell and the stories. Locate the session's built bundle and assert.
	afterHostStarted({ appRoot, check }) {
		const cacheDir = join(appRoot, 'node_modules/.cache/xplat/workshop-gtk')
		const sessions = readdirSync(cacheDir)
			.map((d) => join(cacheDir, d, 'stories.cjs'))
			.filter((f) => existsSync(f))
		const stories = sessions.map((f) => readFileSync(f, 'utf8')).join('\n')
		check(
			'stories bundle externalizes octane runtime + renderer',
			sessions.length > 0 &&
				/require\(["'][^"']*universal-native\.js["']\)/.test(stories) &&
				stories.includes('require("@octane-xplat/linux-gtk")') &&
				!stories.includes('function createUniversalRoot'),
			`${sessions.length} bundle(s)`,
		)
	},

	async leafSteps({ state, check }) {
		const s = await state('select platform/linux-gtk')
		check('gtk leaf story mounts', s.phase === 'ready', s.phase + ' ' + (s.failure ?? ''))
	},
})
