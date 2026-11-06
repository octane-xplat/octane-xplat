import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript-classic'

// Issue #148: SVGKit resolves <use> geometry but drops the use element's own
// paint/transform attributes, leaving use-based icons invisible. The vendored
// pipeline expands <use> into <g>/<svg> clones (SVG 1.1 §5.6) before SVGKit
// sees the markup. The real @nativescript/core XmlParser parses the input so
// these cases exercise the production parse path.
const require_ = createRequire(new URL('../package.json', import.meta.url))
const xmlModule = await import(pathToFileURL(require_.resolve('@nativescript/core/xml')))

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/vendor/ui-svg/src/svg-use.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

const exports = {}
runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === '@nativescript/core') {
      return xmlModule
    }
    throw new Error(`Unexpected import: ${name}`)
  },
})

const resolve = exports.resolveSvgUse

const FLIP =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="58" height="66" viewBox="0 0 58 66">' +
  '<defs><path id="path-1" d="M15 20h28"/></defs>' +
  '<use fill="#000000" filter="url(#filter-2)" xlink:href="#path-1"/>' +
  '<use fill="#FFFFFF" xlink:href="#path-1"/></svg>'

test('use becomes a g carrying its paint attributes over a path clone', () => {
  const resolved = resolve(FLIP)
  assert.ok(
    resolved.includes('<g fill="#000000" filter="url(#filter-2)"><path id="path-1" d="M15 20h28"/></g>'),
    resolved,
  )
  assert.ok(
    resolved.includes('<g fill="#FFFFFF"><path id="path-1" d="M15 20h28"/></g>'),
    resolved,
  )
  // The defs original stays so sibling references keep resolving.
  assert.ok(resolved.includes('<defs><path id="path-1" d="M15 20h28"/></defs>'))
})

test('x/y become a translate appended after the use transform', () => {
  const resolved = resolve(
    '<svg xmlns:xlink="x"><defs><path id="p" d="M4 4z"/></defs>' +
      '<use fill="#FFF" transform="scale(2)" x="3" y="4" xlink:href="#p"/></svg>',
  )
  assert.ok(
    resolved.includes('<g fill="#FFF" transform="scale(2) translate(3 4)"><path id="p" d="M4 4z"/></g>'),
    resolved,
  )
})

test('bare href resolves the same as xlink:href', () => {
  const resolved = resolve('<svg><defs><path id="p" d="M4 4z"/></defs><use fill="#FFF" href="#p"/></svg>')
  assert.ok(resolved.includes('<g fill="#FFF"><path id="p" d="M4 4z"/></g>'), resolved)
})

test('symbol/svg references generate a sized svg element', () => {
  const resolved = resolve(
    '<svg><defs><symbol id="s" viewBox="0 0 10 10"><path d="M1 1z"/></symbol></defs>' +
      '<use width="10" height="10" fill="#FFF" href="#s"/></svg>',
  )
  assert.ok(
    resolved.includes('<svg id="s" viewBox="0 0 10 10" width="10" height="10" fill="#FFF"><path d="M1 1z"/></svg>'),
    resolved,
  )
})

test('markup without use, broken references, and cycles pass through', () => {
  const plain = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>'
  assert.equal(resolve(plain), plain)

  const missing = '<svg><use fill="#FFF" href="#nope"/></svg>'
  assert.ok(missing.includes('<use fill="#FFF" href="#nope"/>'))

  // A cyclic reference expands the outer use and leaves the inner one —
  // bounded, so resolution always terminates.
  const cyclic = resolve('<svg><defs><g id="a"><use href="#a"/></g></defs><use fill="#FFF" href="#a"/></svg>')
  assert.ok(cyclic.length > 0)

  // Malformed markup is handed to SVGKit untouched.
  const broken = '<svg><use href="#p"></svg'
  assert.equal(resolve(broken), broken)
})

test('unrelated markup survives the parse round trip', () => {
  const resolved = resolve(
    '<svg viewBox="0 0 24 24"><!-- icon --><use fill="#FFF" href="#p"/><defs><path id="p" d="M4 &amp; 4"/></defs><style>.a&gt;b{fill:red}</style></svg>',
  )
  assert.ok(resolved.includes('<!-- icon -->'), resolved)
  assert.ok(resolved.includes('d="M4 &amp; 4"'), resolved)
  assert.ok(resolved.includes('<style>.a&gt;b{fill:red}</style>'), resolved)
})
