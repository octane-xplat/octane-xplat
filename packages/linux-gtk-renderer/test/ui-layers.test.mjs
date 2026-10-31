import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK anchored layers preserve shared layer/hover contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-layers', title: 'Octane GTK Layers test', marker: 'GTK_LAYERS', input: true, minChecks: { properties: 12, os: 15 } }),
)
