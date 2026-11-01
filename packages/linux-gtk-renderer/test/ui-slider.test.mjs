import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK Slider retains fields, bounds and single/range values', { timeout: 120000 }, async (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-slider',
		title: 'Octane GTK slider test',
		marker: 'GTK_SLIDER',
		minChecks: { properties: 41, os: 120 },
	}),
)
