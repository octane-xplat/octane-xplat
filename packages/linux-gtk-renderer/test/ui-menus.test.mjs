import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK menus preserve shared anchored-menu contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-menus', title: 'Octane GTK Menus test', marker: 'GTK_MENUS', input: true, minChecks: { properties: 10, os: 12 } }),
)
