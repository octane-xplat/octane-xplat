import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript-classic'
import { runGtkUiFixture } from './gjs-ui-fixture.mts'

// Execute the actual page helper in WebKit's document, including its outbox.
const pageSource = ts.transpileModule(
  readFileSync(new URL('../../ui/src/components/media/webview-post.ts', import.meta.url), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } },
).outputText

test('GTK webview preserves shared WebView document and handle contracts', (t) =>
  runGtkUiFixture(t, {
    stem: 'ui-webview',
    title: 'Octane GTK WebView test',
    marker: 'GTK_WEBVIEW',
    input: false,
    minChecks: { properties: 40, os: 0 },
    define: { __GTK_WEBVIEW_POST_SOURCE__: JSON.stringify(pageSource) },
  }))
