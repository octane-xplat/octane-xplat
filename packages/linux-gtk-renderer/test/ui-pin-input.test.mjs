import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK PinInput preserves sequential editing and one field owner',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-pin-input',
			title: 'Octane GTK PIN input test',
			marker: 'GTK_PIN',
			minChecks: { properties: 50, os: 100 },
		}),
)
