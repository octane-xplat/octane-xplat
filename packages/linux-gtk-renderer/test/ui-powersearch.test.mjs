import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK powersearch slice-I contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-powersearch', title: 'Octane GTK PowerSearch test', marker: 'GTK_PS', input: true, minChecks: { properties: 8, os: 10 } }),
)
