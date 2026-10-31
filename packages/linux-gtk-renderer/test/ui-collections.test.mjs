import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK collections preserve shared disclosure/list contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-collections', title: 'Octane GTK Collections test', marker: 'GTK_COLL', input: true, minChecks: { properties: 14, os: 26 } }),
)
