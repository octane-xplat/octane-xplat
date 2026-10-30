import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK bottom sheets dock, snap and dismiss on real input', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-sheet',
		title: 'Octane GTK Sheet test',
		marker: 'GTK_SHEET',
		input: true,
		minChecks: { properties: 8, os: 60 },
	}),
)
