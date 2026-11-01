import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK theme scheme, media queries, clipboard and announcements', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-theme',
		title: 'Octane GTK Theme test',
		marker: 'GTK_THEME',
		input: true,
		minChecks: { properties: 8, os: 4 },
	}),
)
