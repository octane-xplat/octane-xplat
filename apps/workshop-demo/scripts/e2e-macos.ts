// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Workshop macOS e2e — drives `xplat workshop dev --target macos` on the real
 * AppKit/JavaScriptCore host through its stdin automation protocol. Shared
 * journey lives in ./native-journey.ts; this file owns macOS-only steps:
 * the isolation/owned-window block and the Escape/NSEvent assertions.
 *
 * Interaction evidence here is gesture-action dispatch through each view's
 * real NSClickGestureRecognizer target — it is not OS-synthesized input. The
 * window is created offscreen so the run never takes desktop focus.
 *
 * Usage: node scripts/e2e-macos.ts [consumerRoot]
 *        (consumerRoot defaults to this demo app; a packed consumer passes its own)
 */
import { runNativeJourney } from './native-journey.ts'

await runNativeJourney({
	target: 'macos',
	hostBanner: 'WORKSHOP_MACOS_HOST',
	hostCheckName: 'AppKit/JSC host started',
	catalogLabel: 'macOS',
	rendererName: 'macOS renderer',
	expectedApplicable:
		'counter/async-fixture,counter/basic,counter/static,failing/broken,failing/fixture,isolation/resources,providers/theme',
	expectedInapplicable: 3,

	async leafSteps({ state, check }) {
		let s = await state('select isolation/resources')
		check(
			'isolation story mounts with providers',
			s.phase === 'ready',
			s.phase + ' ' + (s.failure ?? ''),
		)

		s = await state('press Open owned overlay')
		check('story opens owned secondary window', s.openWindows === 1, `openWindows=${s.openWindows}`)

		s = await state('press Mutate data')
		check(
			'fixture mutation propagates',
			s.fixture?.nested?.label === 'changed',
			JSON.stringify(s.fixture),
		)

		s = await state('select counter/basic')
		check(
			'switching releases owned window',
			s.openWindows === 0 && s.phase === 'ready',
			`openWindows=${s.openWindows} phase=${s.phase}`,
		)
	},

	// Escape through NSApp.sendEvent: AppKit dispatch evidence, not OS input.
	async overlaySteps({ state, check }) {
		let s = await state('key escape')
		check('escape closes an open panel', s.panel === null, s.panel)

		s = await state('panel stories')
		s = await state('key escape')
		check('escape closes the stories panel', s.panel === null, s.panel)

		// With no overlay the event is not consumed — the monitor returns it to
		// the normal dispatch path and state stays untouched.
		s = await state('key escape')
		check(
			'escape without overlay is not consumed',
			s.panel === null && s.stageOnly === false && s.phase === 'ready',
			`panel=${s.panel} stageOnly=${s.stageOnly} phase=${s.phase}`,
		)
	},
})
