import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK dates calendar slice-I contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-dates-cal', title: 'Octane GTK Dates test', marker: 'GTK_DATES', input: true, minChecks: { properties: 6, os: 8 } }),
)
