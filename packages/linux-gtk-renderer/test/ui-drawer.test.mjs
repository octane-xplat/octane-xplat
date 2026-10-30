import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK drawer docks its panel over a modal scrim on real input', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-drawer',
		title: 'Octane GTK Drawer test',
		marker: 'GTK_DRAWER',
		input: true,
		minChecks: { properties: 6, os: 12 },
	}),
)
