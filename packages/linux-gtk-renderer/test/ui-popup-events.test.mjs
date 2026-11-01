import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK native popup events preserve shared layer ownership across sibling and nested surfaces',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-popup-events',
			title: 'Octane GTK popup events test',
			marker: 'GTK_POPUP_EVENTS',
			minChecks: { properties: 11, os: 61 },
		}),
)
