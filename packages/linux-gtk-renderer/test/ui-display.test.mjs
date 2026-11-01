import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK display primitives preserve shared text and metadata', (t) =>
	runGtkUiFixture(t, { stem: 'ui-display', title: 'Octane GTK Display test', marker: 'GTK_DISPLAY', input: false, minChecks: { properties: 30, os: 0 } }),
)
