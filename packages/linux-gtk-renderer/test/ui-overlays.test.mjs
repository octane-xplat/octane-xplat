import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK overlays preserve shared in-window dialog/overlay contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-overlays', title: 'Octane GTK Overlays test', marker: 'GTK_OVERLAYS', input: true, minChecks: { properties: 8, os: 12 } }),
)
