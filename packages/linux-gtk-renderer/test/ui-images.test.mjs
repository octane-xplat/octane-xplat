import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK images preserve shared image, avatar and thumbnail contracts', (t) =>
	runGtkUiFixture(t, { stem: 'ui-images', title: 'Octane GTK Images test', marker: 'GTK_IMAGES', input: false, minChecks: { properties: 20, os: 0 } }),
)
