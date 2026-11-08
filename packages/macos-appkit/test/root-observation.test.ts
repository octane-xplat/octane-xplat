import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

const platform = `
export const registrations = [];
const center = { addObserverForNameObjectQueueUsingBlock(name, object, queue, callback) {
  registrations.push({name, callback}); return {};
} };
export const NSNotificationCenter = { defaultCenter: center };
export const NSWorkspace = { sharedWorkspace: { notificationCenter: center } };
export const NSOperationQueue = { mainQueue: {} };
export const NSWindowDidResizeNotification = 'resize';
export const NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification = 'display';
export const NSNotification = {};
export const NSScrollView = {};
export const NSColor = {};
`

const url = 'data:text/javascript,' + encodeURIComponent(platform)
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@octane-xplat/platform/macos') {
      return { url, shortCircuit: true }
    }

    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL)

      if (existsSync(candidate)) {
        return next(candidate.href, context)
      }
    }

    return next(specifier, context)
  },
})

const { createRootDirectory } = await import('../src/root-directory.ts')
const { createRoots } = await import('../src/roots.ts')
const { createStyleEnvironment } = await import('../src/style-environment.ts')
const { createAutomation } = await import('../src/automation.ts')
const { registrations } = await import(url)

hooks.deregister()

function fixture() {
  const directory = createRootDirectory()
  const roots = createRoots({
    directory: directory.writer,
    driver: {
      macOSDriver: {
        id: 'test',
        capabilities: { text: 'host' },
        prepareBatch() {
          return { apply() {}, abort() {} }
        },
      },
    },
  })

  return { directory: directory.reader, roots }
}

test('environment activation installs process observers once across repeated root lifetimes', () => {
  const { roots, directory } = fixture()
  const seeds = []
  const environment = createStyleEnvironment({
    directory,
    cssPseudoState: { syncContainerPseudoState() {} },
    cssCascade: {
      windowMediaSize(win) {
        seeds.push(win)
        return { width: 20, height: 10 }
      },
    },
  })

  assert.equal(registrations.length, 0)

  const first = roots.createMacOSRoot({ window: {} })

  environment.activate()
  environment.activate()
  assert.equal(registrations.length, 2)
  assert.equal(seeds.length, 1)
  first.unmount()
  for (let i = 0; i < 5; i++) {
    roots.createMacOSRoot({ window: {} }).unmount()
  }

  assert.equal(registrations.length, 2)
  assert.equal(seeds.length, 6)
})

test('diagnostics observes existing and new roots, falls back by identity and unwinds failed setup', () => {
  const previous = process.env.OCTANE_MACOS_AUTOMATION

  process.env.OCTANE_MACOS_AUTOMATION = '1'

  const saved = Object.getOwnPropertyDescriptor(globalThis, '__xplatMacOSDebug')

  try {
    const { roots, directory } = fixture()
    const first = roots.createMacOSRoot({})
    const automation = createAutomation({ directory })

    automation.activate()

    const firstDebug = first.__macosDebug

    assert.ok(firstDebug)
    automation.activate()
    assert.equal(first.__macosDebug, firstDebug)

    const host = {}
    const second = roots.createMacOSRoot(host)
    const secondDebug = second.__macosDebug

    assert.equal(globalThis.__xplatMacOSDebug, secondDebug)
    second.unmount()
    assert.equal(globalThis.__xplatMacOSDebug, firstDebug)
    assert.equal(second.__macosDebug, undefined)

    const replacement = roots.createMacOSRoot(host)

    second.unmount()
    assert.equal(globalThis.__xplatMacOSDebug, replacement.__macosDebug)

    const failure = Error('later setup')
    const stop = directory.observe((container) => {
      if (container.hostView.fail) {
        throw failure
      }
    })

    assert.throws(
      () => roots.createMacOSRoot({ fail: true }),
      (error) => error === failure,
    )

    assert.equal(directory.containers().length, 2)
    assert.equal(globalThis.__xplatMacOSDebug, replacement.__macosDebug)
    stop()
    replacement.unmount()
    first.unmount()
    assert.equal(globalThis.__xplatMacOSDebug, undefined)
  } finally {
    if (previous === undefined) {
      delete process.env.OCTANE_MACOS_AUTOMATION
    } else {
      process.env.OCTANE_MACOS_AUTOMATION = previous
    }

    if (saved) {
      Object.defineProperty(globalThis, '__xplatMacOSDebug', saved)
    } else {
      Reflect.deleteProperty(globalThis, '__xplatMacOSDebug')
    }
  }
})
