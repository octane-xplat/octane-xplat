import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript-classic'

// Run the installed Core evaluator, Style variable maps, CssState and width
// converter without loading platform UI bindings. Selector matching and native
// setters remain boundaries; device layout/input/painting need separate probes.
function declarations(file, names, assignments) {
  const code = readFileSync(file, 'utf8')
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS)
  const selected = []

  for (const node of source.statements) {
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name &&
      names.has(node.name.text)
    ) {
      selected.push(node.getText(source))
    } else if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (entry) => ts.isIdentifier(entry.name) && names.has(entry.name.text),
      )
    ) {
      selected.push(node.getText(source))
    } else if (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      node.expression.arguments[0] &&
      ts.isBinaryExpression(node.expression.arguments[0]) &&
      ts.isIdentifier(node.expression.arguments[0].left) &&
      names.has(node.expression.arguments[0].left.text)
    ) {
      // Core emits its public length namespaces as immediately invoked functions.
      selected.push(node.getText(source))
    } else if (
      assignments &&
      ts.isExpressionStatement(node) &&
      ts.isBinaryExpression(node.expression)
    ) {
      let owner = node.expression.left

      while (ts.isPropertyAccessExpression(owner)) {
        owner = owner.expression
      }

      if (ts.isIdentifier(owner) && assignments.has(owner.text)) {
        selected.push(node.getText(source))
      }
    }
  }

  return ts.transpileModule(selected.join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
}

function loadCore(root) {
  const fromCore = createRequire(join(root, 'package.json'))
  const unsetValue = Symbol('unset')
  const messages = []
  const globals = {
    unsetValue,
    calc: fromCore('@csstools/css-calc').calc,
    Observable: class {},
    WeakRef: class {
      constructor(value) {
        this.value = value
      }
      get() {
        return this.value
      }
    },
    Trace: {
      categories: { Style: 'style', Error: 'error' },
      messageType: { warn: 'warn', error: 'error' },
      write(message) {
        messages.push(message)
      },
    },
  }

  const properties = declarations(
    join(root, 'ui/core/properties/index.js'),
    new Set([
      'CSS_VARIABLE_NAME_RE',
      'DIP_RE',
      'UNSET_RE',
      'INFINITY_RE',
      'UNRESOLVED_VAR',
      'cssValueSourceKeys',
      'isCssVariable',
      'isCssVariableExpression',
      'isCssCalcExpression',
      '_evaluateCssVariableExpression',
      'findClosingParenthesis',
      '_evaluateCssCalcExpression',
      '_replaceDip',
      '_replaceKeywordsWithValues',
      '_isCssValueStillApplied',
      'CssPendingSubstitution',
      '_isCssPendingSubstitution',
    ]),
  )

  const propertyApi = runInNewContext(properties + '\nexports', { ...globals, exports: {} })
  const lengthCode = declarations(
    join(root, 'ui/styling/length-shared.js'),
    new Set(['PercentLength', 'equalsCommon', 'toDevicePixelsCommon', 'convertToStringCommon']),
  )

  const { PercentLength } = runInNewContext(lengthCode + '\nexports', { exports: {} })
  const styleCode = declarations(
    join(root, 'ui/styling/style/index.js'),
    new Set(['Style']),
    new Set(['Style']),
  )

  const { Style } = runInNewContext(styleCode + '\nexports', { ...globals, exports: {} })
  const scopeCode = declarations(
    join(root, 'ui/styling/style-scope.js'),
    new Set([
      'CssState',
      'evaluateCssExpressions',
      'evaluateCssVariable',
      'settleCssVariables',
      'hasForwardCssVariableReference',
      'kebabCasePattern',
      'kebabCaseReplacementFunc',
    ]),
    new Set(['CssState']),
  )

  const { CssState } = runInNewContext(scopeCode + '\nexports', {
    ...globals,
    ...propertyApi,
    exports: {},
  })

  class HostView {
    constructor(parent) {
      this.parent = parent
      this.values = new Map()
      this.writes = []
      this.style = new Proxy(new Style(this), {
        has: (target, property) =>
          ['color', 'width', 'opacity'].includes(property) || Reflect.has(target, property),
        set: (target, property, value) => {
          if (typeof property !== 'string' || !property.startsWith('css:')) {
            return Reflect.set(target, property, value)
          }

          const name = property.slice(4)

          this.writes.push([name, value])
          // Model a native converter rejecting a malformed color. CssState,
          // including its failure/reset bookkeeping, is the real Core code.
          if (name === 'color' && value === 'not-a-color') {
            throw new Error('Invalid color: ' + value)
          }

          if (value === unsetValue) {
            this.values.delete(name)
          } else {
            this.values.set(name, name === 'width' ? PercentLength.parse(value) : value)
          }

          return true
        },
      })

      this.state = new CssState({ get: () => this })
    }
    apply(properties) {
      this.state.setPropertyValues([
        {
          ruleset: {
            declarations: Object.entries(properties).map(([property, value]) => ({
              property,
              value,
            })),
          },
        },
      ])
    }
    toString() {
      return 'contract-view'
    }
  }

  return { ...propertyApi, PercentLength, HostView, messages, unsetValue }
}

const local = createRequire(import.meta.url)
const windows = createRequire(new URL('../../../apps/windows/package.json', import.meta.url))
const variants = [
  ['registry', dirname(local.resolve('@nativescript/core/package.json'))],
  ['Windows preview', dirname(windows.resolve('@nativescript/core/package.json'))],
]

for (const [variant, root] of variants) {
  const api = loadCore(root)

  test(`${variant}: Core preserves complete variable fallbacks and invalidates whole values`, () => {
    const view = new api.HostView()

    view.style.setScopedCssVariable('--known', 'blue')
    view.style.setScopedCssVariable('--initial', 'initial')

    for (const [value, expected] of [
      ['var(--known, red)', 'blue'],
      ['var(--missing, rgb(17, 34, 51))', 'rgb(17, 34, 51)'],
      ['var(--missing, red 0%, blue 100%)', 'red 0%, blue 100%'],
      ['var(--initial, 20px)', '20px'],
      ['var(--known, var(--missing))', 'blue'],
      ['var(--missing, var(--missing-too, yellow))', 'yellow'],
      ['calc(var(--missing) * 2)', 'unset'],
      ['color-mix(in srgb, var(--missing) 35%, transparent)', 'unset'],
    ]) {
      assert.equal(api._evaluateCssVariableExpression(view, 'color', value), expected, value)
    }
  })

  test(`${variant}: Core settles forward custom-property references before consumers`, () => {
    const view = new api.HostView()

    view.apply({ color: 'var(--a)', '--a': 'var(--b, blue)', '--b': 'var(--c)', '--c': 'red' })

    assert.equal(view.values.get('color'), 'red')
    assert.equal(view.style.getCssVariable('--a'), 'red')
  })

  test(`${variant}: Core treats cyclic custom properties as invalid and uses a fallback`, () => {
    const view = new api.HostView()

    view.apply({ '--a': 'var(--b)', '--b': 'var(--a)', color: 'var(--a, blue)' })

    assert.equal(view.values.get('color'), 'blue')
    assert.equal(view.style.getCssVariable('--a'), null)
  })

  test(`${variant}: a locally invalid custom property blocks inherited values`, () => {
    const parent = new api.HostView()

    parent.apply({ '--a': 'green' })

    const child = new api.HostView(parent)

    child.apply({ '--a': 'var(--missing)', color: 'var(--a, blue)' })

    assert.equal(child.values.get('color'), 'blue')
  })

  test(`${variant}: unresolved variable updates remove prior values and preserve siblings`, () => {
    const view = new api.HostView()

    view.apply({ width: '24px', opacity: 0.5 })
    view.apply({ width: 'calc(var(--missing) * 2)', opacity: 0.5 })

    assert.equal(view.values.get('width'), undefined)
    assert.equal(view.values.get('opacity'), 0.5)
    assert.equal(Object.hasOwn(view.state._appliedPropertyValues, 'width'), false)
  })

  test(`${variant}: rejected native conversions clear prior styles and are not cached`, () => {
    const view = new api.HostView()

    view.apply({ color: 'red' })
    view.apply({ '--color': 'not-a-color', color: 'var(--color)', opacity: 0.5 })

    assert.equal(view.values.get('color'), undefined)
    assert.equal(view.values.get('opacity'), 0.5)
    assert.equal(Object.hasOwn(view.state._appliedPropertyValues, 'color'), false)
    view.apply({ '--color': 'blue', color: 'var(--color)' })
    assert.equal(view.values.get('color'), 'blue')
  })

  test(`${variant}: Core resolves scalar percentage math but cannot consume contextual width math`, () => {
    const view = new api.HostView()

    view.apply({ '--step': '4dip', width: 'calc(var(--step) * 2)' })
    assert.equal(view.values.get('width'), 8)
    view.apply({ width: 'calc(25% * 2)' })

    assert.equal(view.values.get('width').unit, '%')
    assert.equal(view.values.get('width').value, 0.5)

    const unresolved = api._evaluateCssCalcExpression('calc(100% - 8dip)')

    assert.throws(() => api.PercentLength.parse(unresolved), /Invalid value/)
    view.apply({ width: 'calc(100% - 8dip)' })
    assert.equal(view.values.get('width'), undefined)
    assert.equal(Object.hasOwn(view.state._appliedPropertyValues, 'width'), false)
  })
}
