import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK command palette filters, navigates, and dismisses on real input', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-palette',
		title: 'Octane GTK Palette test',
		marker: 'GTK_PALETTE',
		input: true,
		minChecks: { properties: 8, os: 16 },
	}),
)
