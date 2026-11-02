import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK public useTooltip preserves intent, options, split refs and lifetime', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-tooltip-hook',
		title: 'Octane GTK tooltip hook test',
		marker: 'GTK_TOOLTIP_HOOK',
		minChecks: { properties: 35, os: 40 },
	}))
