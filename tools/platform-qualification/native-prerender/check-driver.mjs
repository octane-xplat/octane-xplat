import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import vm from 'node:vm'

const directory = process.env.XPLAT_PRERENDER_DRIVER_ROOT
if (!directory) throw new Error('Set XPLAT_PRERENDER_DRIVER_ROOT to the patched driver package.')
const manifest = JSON.parse(readFileSync(join(resolve(directory), 'package.json'), 'utf8'))
assert.equal(manifest.name, '@nativescript-community/octane')
assert.equal(
  manifest.version,
  '0.2.5',
  'Requalify the factory patch before changing driver versions',
)
const scratch = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-driver')
mkdirSync(scratch, { recursive: true })
const workdir = mkdtempSync(join(scratch, 'run-'))
cpSync(join(resolve(directory), 'dist'), join(workdir, 'dist'), { recursive: true })
const patch = resolve(import.meta.dirname, '../../../packages/cli/patches/@nativescript-community__octane@0.2.5.patch')
const file = join(workdir, 'dist/driver.js')
const source = readFileSync(file, 'utf8')

// Execute the actual installed driver with a small host boundary. This checks
// command/ownership semantics; UIKit, Mason and Octane reconciliation need the
// separate native Home check. No driver implementation is copied here.
class ViewBase {
  parent = null
  style = {}
  listeners = new Map()
  on(type, handler) {
    this.listeners.set(type, handler)
  }
  off(type) {
    this.listeners.delete(type)
  }
}
class View extends ViewBase {}
class LayoutBase extends View {
  children = []
  getChildrenCount() {
    return this.children.length
  }
  insertChild(view, index) {
    this.children.splice(index, 0, view)
    view.parent = this
  }
  removeChild(view) {
    this.children.splice(this.children.indexOf(view), 1)
    view.parent = null
  }
}
class TextBase extends View {
  text = ''
}
class Label extends TextBase {}
class ContentView extends View {}
class ActionBar extends View {}
class FormattedString extends ViewBase {}
class Span extends ViewBase {}
class ListView extends View {}
class TabView extends View {}
class TabViewItem extends ViewBase {}
const elements = new Map([
  ['label', Label],
  ['masonview', LayoutBase],
])
const renderer = 'nativescript'
const context = vm.createContext({
  console,
  unsetValue: Symbol('unsetValue'),
  ViewBase,
  View,
  LayoutBase,
  TextBase,
  ContentView,
  ActionBar,
  FormattedString,
  Span,
  ListView,
  TabView,
  TabViewItem,
  ELEMENTS: elements,
  NATIVESCRIPT_RENDERER_ID: renderer,
  EVENT_PROP: /^on[A-Z]/,
  onElementReplaced() {},
  createUniversalRoot(container, driver) {
    return { container, driver, unmount() {} }
  },
})
const executable = source
  .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"];\s*/gm, '')
  .replace(/^export /gm, '')
const {
  createNativeScriptContainer,
  createNativeScriptRoot,
  nativeScriptDriver: driver,
  releaseNativeScriptContainer,
} = vm.runInContext(
  `(function(){${executable}\nreturn {createNativeScriptContainer,createNativeScriptRoot,nativeScriptDriver,releaseNativeScriptContainer}})()`,
  context,
  { filename: file },
)
const containers = []
function container(factory) {
  const result = createNativeScriptContainer(new LayoutBase(), { createView: factory })
  containers.push(result)
  return result
}
const create = (id, type = 'label', props = {}) => ({ op: 'create', id, type, props })
const insert = (id, parent = null, before = null) => ({ op: 'insert', id, parent, before })
const remove = (id) => ({ op: 'remove', id })
const destroy = (id) => ({ op: 'destroy', id })
const batch = (owner, commands) => driver.prepareBatch(owner, { renderer, commands })
const apply = (owner, commands) => batch(owner, commands).apply()

try {
  let calls = 0
  const supplied = new Label()
  const adopted = container((id, type, props) => {
    calls++
    if (calls === 1) {
      assert.equal(id, 1)
      assert.equal(type, 'label')
      assert.equal(props.text, 'initial')
    }
    return supplied
  })
  const prepared = batch(adopted, [create(1, 'label', { text: 'initial' })])
  assert.equal(calls, 0)
  prepared.abort()
  assert.equal(calls, 0)
  assert.equal(adopted.nodes.size, 0)
  apply(adopted, [
    create(1, 'label', { text: 'initial' }),
    insert(1),
    create(2, '#text', { value: 'child' }),
    insert(2, 1),
  ])
  assert.equal(calls, 1, 'text nodes must not call the native view factory')
  assert.equal(driver.getPublicInstance(adopted, 1), supplied)
  assert.equal(supplied.text, 'child')
  assert.equal(adopted.host.children[0], supplied)

  const ordinary = container()
  let fallbacks = 0
  const fallback = container(() => {
    fallbacks++
    return undefined
  })
  apply(ordinary, [create(1), insert(1)])
  apply(fallback, [create(1), insert(1)])
  assert.equal(fallbacks, 1)
  assert.equal(calls, 1)
  assert(ordinary.nodes.get(1).view instanceof Label)
  assert(fallback.nodes.get(1).view instanceof Label)
  assert.notEqual(ordinary.nodes.get(1).view, supplied)

  for (const factory of [() => supplied, () => ({})]) {
    const rejected = container(factory)
    assert.throws(
      () => apply(rejected, [create(1)]),
      /owned by a live host node|must return a ViewBase/,
    )
    apply(rejected, [remove(1), destroy(1)])
    assert.equal(rejected.nodes.size, 0)
    assert.equal(rejected.host.children.length, 0)
  }
  assert.throws(() => apply(adopted, [create(3)]), /owned by a live host node/)

  const manualParent = new LayoutBase()
  const manuallyOwned = new Label()
  manualParent.insertChild(manuallyOwned, 0)
  const rejectedParent = container(() => manuallyOwned)
  assert.throws(() => apply(rejectedParent, [create(1)]), /existing logical parent/)
  apply(rejectedParent, [remove(1), destroy(1)])
  assert.equal(manuallyOwned.parent, manualParent)
  assert.equal(manualParent.children[0], manuallyOwned)
  assert.equal(rejectedParent.host.children.length, 0)

  // A failed later creation must still allow existing attachments/listeners
  // and never-created logical hosts to be removed during root disposal.
  let partialCalls = 0
  const partial = container(() => (++partialCalls === 2 ? {} : undefined))
  assert.throws(
    () =>
      apply(partial, [
        create(1),
        insert(1),
        { op: 'event', id: 1, type: 'tap', listener: { id: 1, priority: 'discrete' } },
        create(2),
      ]),
    /must return a ViewBase/,
  )
  const first = partial.nodes.get(1).view
  assert.equal(first.listeners.size, 1)
  apply(partial, [remove(2), destroy(2), remove(1), destroy(1)])
  assert.equal(partial.nodes.size, 0)
  assert.equal(partial.host.children.length, 0)
  assert.equal(first.listeners.size, 0)

  apply(adopted, [remove(2), destroy(2), remove(1), destroy(1)])
  const reused = container(() => supplied)
  apply(reused, [create(1), insert(1)])
  assert.equal(reused.nodes.get(1).view, supplied, 'disposed owners must not retain claims')
  const mason = new LayoutBase()
  const masonOwner = container(() => mason)
  apply(masonOwner, [create(1, 'masonview')])
  assert.equal(mason.style['css:position'], 'relative')

  // Registered constructors can fail too; cleanup must not depend on use of
  // the root factory. Failed apply still has no rollback guarantee.
  elements.set(
    'throws',
    class extends ViewBase {
      constructor() {
        super()
        throw new Error('constructor failed')
      }
    },
  )
  const failedConstructor = container()
  assert.throws(
    () => apply(failedConstructor, [create(1), insert(1), create(2, 'throws')]),
    /constructor failed/,
  )
  apply(failedConstructor, [remove(2), destroy(2), remove(1), destroy(1)])
  assert.equal(failedConstructor.nodes.size, 0)
  assert.equal(failedConstructor.host.children.length, 0)

  const hook = () => undefined
  const root = createNativeScriptRoot(new LayoutBase(), { createView: hook })
  assert.equal(root.container.createView, hook)
  root.unmount()
  const result = {
    file,
    inputDirectory: resolve(directory),
    patchHash: createHash('sha256').update(readFileSync(patch)).digest('hex'),
    sourceHash: createHash('sha256').update(source).digest('hex'),
    passed: true,
    nativeQualified: false,
  }
  writeFileSync(join(workdir, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
} finally {
  for (const owner of containers) releaseNativeScriptContainer(owner)
}
