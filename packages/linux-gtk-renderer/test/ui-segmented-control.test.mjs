import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK segmented controls preserve field and single-choice semantics',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-segmented-control',
			title: 'Octane GTK segmented control test',
			marker: 'GTK_SEGMENTED',
			minChecks: { os: 120, properties: 70 },
			input: true,
		}),
)
