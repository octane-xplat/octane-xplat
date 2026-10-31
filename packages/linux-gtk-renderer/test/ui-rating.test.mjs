import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test(
	'GTK InputRating retains one field and an accessible score owner',
	{ timeout: 120000 },
	async (t) =>
		runGtkUiFixture(t, {
			stem: 'ui-rating',
			title: 'Octane GTK rating test',
			marker: 'GTK_RATING',
			minChecks: { properties: 55, os: 100 },
		}),
)
