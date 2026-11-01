import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK utilities preserve shared pure and hook contracts in GJS', (t) =>
	runGtkUiFixture(t, { stem: 'ui-utilities', title: 'Octane GTK Utilities test', marker: 'GTK_UTILITIES', minChecks: 40, input: false }),
)
