import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript-classic'

class Style {
  cssText = ''
  static new() { return new Style() }
}

class Element {
  constructor(values = {}, children = []) {
    this.values = values
    this.childNodes = { length: children.length, item: (i) => children[i] }
  }
  cascadedValueForStylablePropertyInherit(name, inherit) {
    assert.equal(inherit, false)
    return this.values[name] ?? null
  }
}

const exports = {}
runInNewContext(ts.transpileModule(
  readFileSync(new URL('../src/vendor/ui-svg/src/svg-current-color.ios.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, { exports, SVGElement: Element, CSSStyleDeclaration: Style })
const resolve = exports.resolveSvgCurrentColor

test('inherited currentColor uses each consuming element color, independent of parent mutation', () => {
  const purple = new Element({ color: '#7e22ce' })
  const explicit = new Element({ fill: 'none', stroke: '#7c2d12' })
  const sibling = new Element({ fill: 'currentColor' })
  const green = new Element({ color: '#166534', fill: 'currentColor' }, [purple, explicit])
  const root = new Element({ color: '#2563eb' }, [green, sibling])
  const image = { DOMTree: root }
  assert.equal(resolve(image), image)
  assert.equal(green.style.cssText, ';fill:#166534')
  assert.equal(purple.style.cssText, ';fill:#7e22ce')
  assert.equal(explicit.style, undefined)
  assert.equal(sibling.style.cssText, ';fill:#2563eb')
})

test('currentColor on color inherits, initial resets, and existing declarations survive', () => {
  const inherited = new Element({ color: 'currentColor', fill: 'CURRENTCOLOR' })
  const reset = new Element({ color: 'initial', stroke: 'currentColor' })
  reset.style = new Style()
  reset.style.cssText = 'stroke:currentColor;fill:none;opacity:0.4'
  resolve({ DOMTree: new Element({ color: '#be123c' }, [inherited, reset]) })
  assert.equal(inherited.style.cssText, ';fill:#be123c')
  assert.equal(reset.style.cssText, 'stroke:currentColor;fill:none;opacity:0.4;stroke:black')
})

test('literal paints, URL paints and unrelated currentColor text are never rewritten', () => {
  const path = new Element({ fill: 'url(#currentColor)', stroke: '#f59e0b' })
  path.text = 'currentColor'
  path.style = new Style()
  path.style.cssText = 'filter:url(#currentColor)'
  resolve({ DOMTree: new Element({}, [path]) })
  assert.equal(path.style.cssText, 'filter:url(#currentColor)')
  assert.equal(path.values.fill, 'url(#currentColor)')
  assert.equal(path.text, 'currentColor')
  assert.equal(resolve(null), null)
})
