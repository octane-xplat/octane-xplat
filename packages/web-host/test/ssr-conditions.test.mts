import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'
import { webHost } from '../src/build/vite.ts'

const root = new URL('..', import.meta.url).pathname

test('the SSR bundle resolves web export conditions instead of native defaults', async () => {
  const bundle = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [webHost()],
    build: {
      write: false,
      minify: false,
      ssr: root + '/test/fixtures/escape-props-entry.web.ts',
    },
  })

  const code = bundle.output.find((entry) => entry.type === 'chunk').code

  assert.match(code, /setAttribute|removeAttribute/, 'the DOM escape-props leaf is bundled')
  assert.doesNotMatch(code, /isIOS|isAndroid|@nativescript\/core/)
})
