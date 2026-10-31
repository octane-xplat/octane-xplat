import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK buttons preserve shared interaction contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-buttons', title: 'Octane GTK Buttons test', marker: 'GTK_BUTTONS', minChecks: { properties: 15, os: 10 } }),
)
