import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK app chrome preserves shared shell/nav contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-appshell', title: 'Octane GTK Appshell test', marker: 'GTK_APPSHELL', input: true, minChecks: { properties: 16, os: 30 } }),
)
