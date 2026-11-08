import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// octane-xplat#181 — deps-bundle classified ESM by a line-anchored syntax
// check, so a minified `.js` chunk with `...;export{mt as g};` after other
// statements was treated as opaque CJS and the served /ns/m shim dropped every
// named export. Classification and the export scanners now run against a
// comment/literal-masked copy, so mid-line ESM is found without matching
// ESM-looking text inside strings, comments, or regexes.
const nsViteEntry = createRequire(import.meta.url).resolve('@nativescript/vite')
const nsViteUrl = pathToFileURL(nsViteEntry)

const { collectDepsModuleExportInfo, buildDepsShimCode } = await import(
  new URL('./hmr/server/deps-bundle.js', nsViteUrl)
)

const dirs = []
const makeProject = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-deps-esm-')))
  dirs.push(root)
  return root
}
afterEach(() => {
  while (dirs.length) {
    rmSync(dirs.pop(), { recursive: true, force: true })
  }
})

const write = (root, name, code) => {
  const file = join(root, name)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, code)
  return file
}
const info = (root, name, code) => collectDepsModuleExportInfo(write(root, name, code), 'ios')
const shimExports = (key, names, hasDefault) =>
  buildDepsShimCode(key, names, hasDefault)
    .split('\n')
    .filter((line) => line.startsWith('export'))

describe('deps-bundle ESM classification (octane-xplat#181)', () => {
  it('reads named exports from a single-line minified .js chunk', () => {
    const root = makeProject()
    const result = info(root, 'chunk.js', 'const value=1;export{value as g};')
    assert.deepEqual(result, { names: ['g'], hasDefault: false })
    assert.deepEqual(shimExports('k', result.names, result.hasDefault), [
      'export const g = __ns_dep_ns__.g;',
      'export default __ns_dep_ns__;',
    ])
  })

  it('reads named exports emitted after function declarations on one line', () => {
    const root = makeProject()
    const result = info(
      root,
      'chunk.js',
      'function mt(){return 1}function xx(){return 2}export{mt as g,xx as h};',
    )
    assert.deepEqual(result.names, ['g', 'h'])
  })

  it('keeps minified .mjs and newline-separated .js working', () => {
    const root = makeProject()
    assert.deepEqual(info(root, 'a.mjs', 'const v=1;export{v as g};').names, ['g'])
    assert.deepEqual(info(root, 'b.js', 'const v=1;\nexport{v as g};').names, ['g'])
  })

  it('follows a mid-line `export * from` into the target file', () => {
    const root = makeProject()
    write(root, 'child.js', 'export const childName = 2;')
    const result = info(root, 'barrel.js', 'const a=1;export{a};export*from"./child.js";')
    assert.deepEqual(result.names, ['a', 'childName'])
  })

  it('reads a space-free `export * as ns from` namespace re-export', () => {
    const root = makeProject()
    write(root, 'child.js', 'export const childName = 2;')
    const result = info(root, 'ns.js', 'export*as ns from"./child.js";')
    assert.deepEqual(result.names, ['ns'])
  })

  it('detects a mid-line default export', () => {
    const root = makeProject()
    const result = info(root, 'd.js', 'const x=1;export default x;')
    assert.deepEqual(result, { names: [], hasDefault: true })
    assert.deepEqual(shimExports('k', result.names, result.hasDefault), [
      'export default __ns_dep_ns__.default;',
    ])
  })

  it('does not match ESM-looking text inside strings, templates, comments, or regexes', () => {
    const root = makeProject()
    for (const [name, code] of [
      ['str.js', 'const s = "export{fake as g}";\nexports.real = 1;'],
      ['tpl.js', 'const s = `multi\nexport{fake as g}\nline`;\nexports.real = 1;'],
      ['line.js', '// export{fake as g}\nexports.real = 1;'],
      ['block.js', '/*\nexport{fake as g}\n*/\nexports.real = 1;'],
      ['regex.js', 'const re = /export{fake}/g;\nexports.real = 1;'],
      ['starstr.js', 'const s = "export * from \'./x\'";\nexports.real = 1;'],
    ]) {
      const result = info(root, name, code)
      assert.deepEqual(result, { names: ['real'], hasDefault: false }, name)
    }
  })

  it('does not match `$export`-style identifiers or obj.import/obj.export members', () => {
    const root = makeProject()
    assert.deepEqual(info(root, 'a.js', 'var $export = function(){};\nexports.real = 1;').names, [
      'real',
    ])
    assert.deepEqual(
      info(root, 'b.js', 'compiler.import = function(){};\nexports.real = 1;').names,
      ['real'],
    )
    assert.deepEqual(info(root, 'c.js', 'obj.export = {a:1};\nexports.real = 1;').names, ['real'])
  })

  it('ignores ESM-looking text inside a nested template literal', () => {
    const root = makeProject()
    const result = info(
      root,
      'nested.js',
      'const x=1;const t = `a${`inner export{fake} ${x}`}b`;export{x as g};',
    )
    assert.deepEqual(result.names, ['g'])
  })

  it('keeps plain CJS assignment scanning and opaque-CJS fallback', () => {
    const root = makeProject()
    assert.deepEqual(info(root, 'cjs.js', 'exports.a = 1;\nexports.b = 2;'), {
      names: ['a', 'b'],
      hasDefault: false,
    })
    const opaque = info(root, 'umd.js', 'module.exports = (() => ({ a: 1 }))();')
    assert.equal(opaque.names, null)
    assert.equal(opaque.opaqueCjs, true)
  })

  it('keeps per-module serving when a star re-export resolves nowhere', () => {
    const root = makeProject()
    const result = info(root, 'star.js', 'const a=1;export{a};export*from"./missing.js";')
    assert.equal(result.names, null)
  })
})
