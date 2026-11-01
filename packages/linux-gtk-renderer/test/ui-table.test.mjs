import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK table preserves shared data/plugin pipeline contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-table', title: 'Octane GTK Table test', marker: 'GTK_TABLE', input: true, minChecks: { properties: 14, os: 28 } }),
)
