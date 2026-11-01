import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK focus, keyboard and landmark hooks', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-focus',
		title: 'Octane GTK Focus test',
		marker: 'GTK_FOCUS',
		input: true,
		minChecks: { properties: 20, os: 45 },
	}),
)
