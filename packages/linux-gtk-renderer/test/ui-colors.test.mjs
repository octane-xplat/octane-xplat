import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK colors slice-I contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-colors', title: 'Octane GTK Colors test', marker: 'GTK_COL', input: true, minChecks: { properties: 8, os: 10 } }),
)
