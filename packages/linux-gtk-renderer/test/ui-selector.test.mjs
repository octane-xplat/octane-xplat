import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK Selector and MultiSelector preserve shared finite-list contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-selector', title: 'Octane GTK Selector test', marker: 'GTK_SELECTOR', minChecks: { properties: 20, os: 30 } }),
)
