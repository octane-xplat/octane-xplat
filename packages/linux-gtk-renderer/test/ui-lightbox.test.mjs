import { test } from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK lightbox presents media on a modal layer with real input', (t) =>
	runGtkUiFixture(t, {
		stem: 'ui-lightbox',
		title: 'Octane GTK Lightbox test',
		marker: 'GTK_LIGHTBOX',
		input: true,
		minChecks: { properties: 8, os: 16 },
	}),
)
