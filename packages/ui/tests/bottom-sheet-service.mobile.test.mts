import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = await readFile(
  new URL('../src/components/overlays/bottom-sheet-service.ts', import.meta.url),
  'utf8',
)

const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
})

function loadService(stubs: Record<string, unknown>) {
  const context = vm.createContext({ exports: {}, console })

  context.require = (specifier: string) => {
    if (specifier in stubs) {
      return stubs[specifier]
    }

    throw new Error(`Unexpected module: ${specifier}`)
  }

  vm.runInContext(compiled, context)

  return context.exports as {
    openBottomSheet: (...args: any[]) => Promise<unknown> & { close(): void }
    closeBottomSheet: (result?: unknown) => void
    bottomSheetHost: () => unknown
  }
}

function harness() {
  const host: any = { on: () => {}, off: () => {} }
  const panel: any = {}
  const unbound: string[] = []
  const attached: any[] = []
  const detached: any[] = []
  const removed: any[] = []
  const unmounted: string[] = []

  const owner = {
    hasChild: () => true,
    // The close path is in flight — finish must removeChild, not re-close.
    getPopupIndex: () => -1,
    removeChild: (v: any) => removed.push(v),
  }

  host.parent = owner

  const stubs = {
    './owned-content': { afterContentCommit: (_root: any, cb: () => void) => cb() },
    '@nativescript/core': {
      GridLayout: class {},
      Screen: { mainScreen: { heightDIPs: 800 } },
    },
    '@octane-xplat/nativescript-octane': {
      createNativeScriptRoot: () => ({
        render() {},
        unmount: () => unmounted.push('root'),
      }),
    },
    'octane/universal': {},
    '../../props': {},
    '../layout/root-layout': {
      topRootLayout: () => ({ open: () => Promise.resolve() }),
      currentRootLayoutFor: () => ({ open: () => Promise.resolve() }),
    },
    '../../theme/theme-host': {
      applyThemeClasses: () => () => unbound.push('theme'),
    },
    './sheet-snap': { normalizeSnapPoints: (pts: unknown) => pts },
    './sheet-detents': {
      attachSheetDetents: () => ({ detach: () => unbound.push('detents'), enter() {} }),
    },
    '../../internal/keyboard/keyboard-overlay-host': {
      createKeyboardOverlayHost: () => ({
        host,
        panel,
        bindKeyboard: () => () => unbound.push('keyboard'),
      }),
      keyboardOverlayAnimation: () => ({}),
    },
    '../../internal/keyboard/tap-to-blur': {
      attachTapToBlur: (v: any) => {
        attached.push(v)
        return () => detached.push(v)
      },
    },
  }

  return { host, unbound, attached, detached, removed, unmounted, stubs }
}

test('imperative bottom sheet detaches tap-to-blur with the rest of the host teardown', async () => {
  const h = harness()
  const service = loadService(h.stubs)

  const handle = service.openBottomSheet(() => null)

  assert.deepEqual(h.attached, [h.host])
  assert.equal(service.bottomSheetHost(), h.host)

  service.closeBottomSheet('done')

  // The returned cleanup owns the iOS ref-counted window recognizer — dropping
  // it leaves the count elevated for the life of the app.
  assert.deepEqual(h.detached, [h.host])
  assert.deepEqual(h.unbound, ['keyboard', 'theme', 'detents'])
  assert.deepEqual(h.unmounted, ['root'])
  assert.deepEqual(h.removed, [h.host])
  assert.equal(await handle, 'done')
  assert.equal(service.bottomSheetHost(), null)
})

test('imperative bottom sheet opens nothing when no rootlayout is mounted', async () => {
  const h = harness()
  h.stubs['../layout/root-layout'] = {
    topRootLayout: () => null,
    currentRootLayoutFor: () => null,
  } as never

  const service = loadService(h.stubs)

  const handle = service.openBottomSheet(() => null)

  assert.equal(await handle, undefined)
  assert.deepEqual(h.attached, [])
  assert.deepEqual(h.detached, [])
})
