import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK Mason preserves border-box sizing, outer margins and direction resets',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-box-model',
			title: 'Octane GTK box model test',
			marker: 'GTK_BOX_MODEL',
			minChecks: 54,
			input: false,
		}),
)
