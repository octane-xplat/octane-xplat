import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK toasts preserve shared stack/viewport contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-toast', title: 'Octane GTK Toast test', marker: 'GTK_TOAST', input: true, minChecks: { properties: 12, os: 28 } }),
)
