import test from 'node:test'
import { runGtkUiFixture } from './gjs-ui-fixture.mjs'

test('GTK webview preserves shared WebView document and handle contracts', (t) =>
	runGtkUiFixture(t, { stem: 'ui-webview', title: 'Octane GTK WebView test', marker: 'GTK_WEBVIEW', input: false, minChecks: { properties: 21, os: 0 } }),
)
