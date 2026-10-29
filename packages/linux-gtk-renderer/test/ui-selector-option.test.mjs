import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK SelectorOption preserves presentation parts and retained layout',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-selector-option',
			title: 'Octane GTK selector option test',
			marker: 'GTK_SELECTOR_OPTION',
			minChecks: 51,
			input: false,
		}),
)
