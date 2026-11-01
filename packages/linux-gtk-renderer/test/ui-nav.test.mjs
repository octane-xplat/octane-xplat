import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK navigation preserves shared nav/routing contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-nav', title: 'Octane GTK Nav test', marker: 'GTK_NAV', input: true, minChecks: { properties: 12, os: 24 } }),
)
