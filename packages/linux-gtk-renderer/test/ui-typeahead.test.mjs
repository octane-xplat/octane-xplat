import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK typeahead slice-I contracts on real input', (t) =>
	runGtkUiFixture(t, { stem: 'ui-typeahead', title: 'Octane GTK Typeahead test', marker: 'GTK_TA', input: true, minChecks: { properties: 8, os: 10 } }),
)
