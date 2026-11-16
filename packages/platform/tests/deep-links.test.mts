import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const compile = async (file) =>
  ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  })

const web = await compile('deep-links.web')

const locationOf = (pathname, search = '') => ({ pathname, search })

function loadWeb({ location = locationOf('/') } = {}) {
  const context = { exports: {}, location, window: { addEventListener: () => {} } }

  vm.runInNewContext(web, context)
  return context.exports
}

test('web consumeInitialUrl reports a non-root browser path exactly once', () => {
  const links = loadWeb({ location: locationOf('/index.html') })

  assert.equal(links.consumeInitialUrl(), '/index.html')
  assert.equal(links.consumeInitialUrl(), null)
})

test('web consumeInitialUrl at the root always resolves null', () => {
  const links = loadWeb()

  assert.equal(links.consumeInitialUrl(), null)
  assert.equal(links.consumeInitialUrl(), null)
})
