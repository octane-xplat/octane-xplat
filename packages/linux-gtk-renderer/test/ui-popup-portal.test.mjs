import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK portal refs measure native popup surfaces and keep real input in their original root',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-popup-portal',
			title: 'Octane GTK popup portal test',
			marker: 'GTK_POPUP_PORTAL',
			minChecks: { properties: 47, os: 56 },
		}),
)
