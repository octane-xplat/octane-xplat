import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK dates slice-I contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-dates', title: 'Octane GTK Dates test', marker: 'GTK_DATES', input: true, minChecks: { properties: 8, os: 10 } }),
)
