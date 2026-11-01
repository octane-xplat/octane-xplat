import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK Popover leaf preserves portal state, shared placement and native lifetime', { timeout: 120000 }, async t =>
	runGtkUiFixture(t, { stem: 'ui-popover', title: 'Octane GTK Popover test', marker: 'GTK_POPOVER', minChecks: { properties: 38, os: 70 } }),
)
