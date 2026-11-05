import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { transpileModule, ModuleKind, JsxEmit } from 'typescript-classic'
import { mockNativeBoundary } from './native-boundary.ts'

const scenario = process.argv[2]
if (scenario === 'diagnostics') {
  process.env.OCTANE_MACOS_AUTOMATION = '1'
} else {
  delete process.env.OCTANE_MACOS_AUTOMATION
}

const runtimeURL = new URL('../src/runtime.ts', import.meta.url).href
const failure = Error('injected native boundary failure')
const registrations: string[] = [],
  readiness: string[] = []

const assembly: {
  scenario: string
  failure: Error
  registrations: string[]
  readiness: string[]
  activationReentry?: string
  createRoot?: (host: object) => unknown
} = { scenario, failure, registrations, readiness }

Object.assign(globalThis, { __assembly: assembly })
const boundary = mockNativeBoundary(
  undefined,
  `
import { createMacOSRoot as publicCreateRoot } from ${JSON.stringify(runtimeURL)};
import { activateRuntime } from ${JSON.stringify(new URL('../src/runtime-activation.ts', import.meta.url).href)};
const assembly = globalThis.__assembly;
assembly.createRoot = publicCreateRoot;
NativeClass = ctor => {
  assembly.registrations.push(ctor.name);
  if (ctor.name === 'GestureDelegate' || ctor.name === 'ContentAlignedTextField' || ctor.name === 'MasonLayoutView') {
    try { publicCreateRoot({}); throw Error('root entered before activation'); }
    catch (error) { assembly.readiness.push(error.message); }
  }
  if (ctor.name === 'MasonLayoutView') {
    try { activateRuntime(() => { throw Error('activation entered twice') }); }
    catch (error) { assembly.activationReentry = error.message; }
  }
  if (assembly.scenario === 'required-class' && ctor.name === 'PaddedLabelCell') throw assembly.failure;
  if (assembly.scenario === 'optional' && ctor.name === 'HoverTrackingTarget') throw assembly.failure;
  return ctor;
};
NativeObject.prototype.init = function() { return this };
NSApplication.sharedApplication = {
  effectiveAppearance: {},
  addObserverForKeyPathOptionsContext() {
    if (assembly.scenario === 'required-activation') throw assembly.failure;
  },
};
NSThread.mainThread = { threadDictionary: { objectForKey() { return null } } };
`,
)

const syntax = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(specifier + '.tsx', context.parentURL)
      if (existsSync(candidate)) {
        return next(candidate.href, context)
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    // Node does not parse TSX. Lower its syntax for import only; this fixture
    // does not execute the compiler-owned portal components. Packed tests do.
    if (url.endsWith('.tsx')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: transpileModule(
          readFileSync(new URL(url), 'utf8').replace('@jsxImportSource @octane-xplat/jsx', ''),
          {
            compilerOptions: { module: ModuleKind.ESNext, jsx: JsxEmit.React },
          },
        ).outputText,
      }
    }
    return next(url, context)
  },
})

const warnings: unknown[][] = []
const priorError = console.error
console.error = (...args) => warnings.push(args)
try {
  const entry = new URL('../src/index.ts', import.meta.url).href
  if (scenario.startsWith('required-')) {
    await assert.rejects(import(entry), (error) => error === failure)
    const count = registrations.length
    await assert.rejects(import(entry), (error) => error === failure)
    assert.equal(registrations.length, count, 'failed native registration is never retried')
    if (scenario === 'required-activation') {
      const { activateRuntime } = await import('../src/runtime-activation.ts')
      assert.throws(
        () => activateRuntime(() => assert.fail('failed activation retried')),
        (error) => error === failure,
      )

      assert.ok(assembly.createRoot)
      assert.throws(
        () => assembly.createRoot!({}),
        (error) => error === failure,
      )
    }
  } else {
    const first = await import(entry)
    const { activateRuntime } = await import('../src/runtime-activation.ts')
    activateRuntime(() => assert.fail('loaded runtime must not activate twice'))
    const bridge = globalThis.__xplatAppKit
    const count = registrations.length
    const again = await import(entry)
    assert.equal(first.createMacOSRoot, again.createMacOSRoot)
    assert.equal(globalThis.__xplatAppKit, bridge)
    assert.equal(registrations.length, count)
    assert.equal(new Set(registrations).size, count, 'native class identity registers once')
    assert.ok(
      registrations.indexOf('AccessibleHostView') < registrations.indexOf('MasonLayoutView'),
    )

    assert.equal(bridge.keyboardEventsSupported, false)
    assert.equal(bridge.contextMenuEventsSupported, false)
    assert.throws(() => bridge.observePointerInput(() => {}), /pointer observation unavailable/)
    const root = first.createMacOSRoot({})
    assert.equal(Boolean(root.__macosDebug), scenario === 'diagnostics')
    const { defineUniversalComponent } = await import('octane/universal/native')
    root.render(
      defineUniversalComponent('macos', () => null),
      {},
    )

    root.unmount()
    assert.equal(registrations.length, count, 'root lifetimes do not recreate native classes')
    if (scenario === 'optional') {
      assert.equal(bridge.containerRevealSupported, false)
      assert.ok(warnings.some((args) => String(args).includes('hover')))
    }
  }

  assert.equal(readiness.length, scenario === 'required-class' ? 2 : 3)
  assert.ok(
    readiness.some(
      (message) => message.includes('constructing') && message.includes('root creation'),
    ),
  )

  if (scenario !== 'required-class') {
    assert.match(assembly.activationReentry ?? '', /activating; activation cannot reenter/)
    assert.ok(
      readiness.some(
        (message) => message.includes('activating') && message.includes('root creation'),
      ),
    )
  }

  console.log(JSON.stringify({ scenario, registrations, readiness }))
} finally {
  console.error = priorError
  syntax.deregister()
  boundary.deregister()
}
