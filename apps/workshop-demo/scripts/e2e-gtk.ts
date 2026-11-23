// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Workshop GTK e2e — drives `xplat workshop dev --target linux` on the
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
  hostCheckName: 'GTK4 host started',
  catalogLabel: 'linux',
  rendererName: 'the GTK renderer',
  counterTarget: 'workshop.counter',
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
    const profiles = readdirSync(appRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('.xplat-go-profile-'))
      .map(({ name }) => join(appRoot, name))
    const sessions = profiles
      .flatMap((profile) => readdirSync(profile).map((session) => join(profile, session, 'stories.cjs')))
      .filter((file) => existsSync(file))

    const stories = sessions.map((f) => readFileSync(f, 'utf8')).join('\n')
    const imports = [...stories.matchAll(/\brequire\(["']([^"']+)["']\)/g)].map((m) => m[1])

    check(
      'stories bundle externalizes octane runtime + renderer',
      sessions.length > 0 &&
        imports.some((id) => id === 'octane/universal/native' || id.endsWith('/universal-native.js')) &&
        !stories.includes('function createUniversalRoot') &&
        !stories.includes('NativeScript driver: batch renderer'),
      `${sessions.length} bundle(s), ${imports.length} external imports`,
    )
  },

  async leafSteps({ state, check }) {
    const s = await state('select platform/linux-gtk')

    check('gtk leaf story mounts', s.phase === 'ready', s.phase + ' ' + (s.failure ?? ''))
  },
})
