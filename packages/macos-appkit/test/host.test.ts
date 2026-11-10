import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { transpileModule, ModuleKind, JsxEmit } from 'typescript-classic'
import { mockNativeBoundary } from './native-boundary.ts'

// Substitute the Objective-C boundary and the injected host globals: host
// startup, window controllers, delegate dispatch and the service merge are
// real; AppKit objects and OS event delivery are mocked.
const boundary = mockNativeBoundary(
  undefined,
  `
NativeObject.prototype.init = function() { return this }

const defaults = new Map()

export const NSUserDefaults = {
  standardUserDefaults: {
    stringForKey: (key) => (defaults.has(key) ? defaults.get(key) : null),
    setObjectForKey: (value, key) => void defaults.set(key, value),
    removeObjectForKey: (key) => void defaults.delete(key),
    synchronize: () => true,
  },
}

export const NSPasteboard = {
  generalPasteboard: {
    stringForType: () => null,
    clearContents() {},
    setStringForType: () => true,
  },
}

export const NSSharingServicePicker = undefined
export const NSEventMask = { Any: 0 }
export const NSApplicationActivationPolicy = { Regular: 0, Accessory: 1 }
export const NSApplicationDelegate = {}
export const NSWindowDelegate = {}

export const NSAccessibilityAnnouncementKey = 'AXAnnouncement'
export const NSAccessibilityAnnouncementRequestedNotification = 'AXAnnounce'
export const NSAccessibilityPriorityKey = 'AXPriority'
export const NSAccessibilityPriorityLevel = { Medium: 50 }
export function NSAccessibilityPostNotificationWithUserInfo() {
  globalThis.__announceCalls = (globalThis.__announceCalls || 0) + 1
  return true
}

export class NSPanel extends NSWindow {}

NSApplication.sharedApplication = {
  effectiveAppearance: {},
  addObserverForKeyPathOptionsContext() {},
  setActivationPolicy() {},
  activateIgnoringOtherApps() { this.activated = true },
  finishLaunching() { this.launchingFinished = true },
  run() { this.didRun = true },
  stop() {},
  sendEvent() {},
  nextEventMatchingMaskUntilDateInModeDequeue: () => null,
  keyWindow: null,
  mainWindow: null,
  windows: { firstObject: null },
  delegate: null,
}

NSBundle.mainBundle = { infoDictionary: {}, bundleIdentifier: 'test.consumer' }
NSFileManager.defaultManager = { fileExistsAtPath: () => false }
NSWorkspace.sharedWorkspace = { openURL: () => true }
NSURL.URLWithString = (value) => (value ? { absoluteString: String(value) } : null)
NSURL.fileURLWithPath = (value) => ({ path: String(value) })

NSWindow.prototype.initWithContentRectStyleMaskBackingDefer = function() { return this }
NSWindow.prototype.center = function() {}
NSWindow.prototype.makeKeyAndOrderFront = function() {}
NSWindow.prototype.orderFront = function() {}
NSWindow.prototype.close = function() { this.__closed = true }
NSWindow.prototype.endSheet = function() {}
NSWindow.prototype.setContentSize = function() {}
NSWindow.prototype.beginSheetCompletionHandler = function() {}
NSWindow.prototype.addChildWindowOrdered = function() {}

NSView.prototype.initWithFrame = function() {
  this.bounds = { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } }
  this.widthAnchor = { constraintEqualToConstant: (constant) => ({ active: false, constant }) }
  this.heightAnchor = this.widthAnchor
  return this
}

NSThread.mainThread = { threadDictionary: { objectForKey() { return null } } }
`,
)

// Node does not parse TSX. Lower its syntax for import only; the host chain
// does not execute the compiler-owned portal components in this fixture.
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

const host = await import('../src/host.ts')
const { defineUniversalComponent } = await import('octane/universal/native')

const {
  runMacOSApp,
  createAppKitWindow,
  createHostedWindow,
  setWindowContentResolver,
  debugWindows,
} = host

const shared: any = (globalThis as any).__xplatMacosWindowing
const openSecondary: any = (globalThis as any).__xplatAppKitOpenWindow
const bridge: any = (globalThis as any).__xplatAppKit

test('host option validation rejects malformed arguments', () => {
  assert.throws(() => (runMacOSApp as any)(null, () => {}), {
    name: 'TypeError',
    message: 'runMacOSApp options must be an object',
  })

  assert.throws(() => (runMacOSApp as any)({}, 'mount'), {
    name: 'TypeError',
    message: 'runMacOSApp mount must be a function',
  })

  assert.throws(() => (createAppKitWindow as any)('options'), {
    name: 'TypeError',
    message: 'createAppKitWindow options must be an object',
  })

  assert.throws(() => createAppKitWindow({ terminateAfterLastWindowClosed: 'yes' as any }), {
    name: 'TypeError',
    message: 'createAppKitWindow terminateAfterLastWindowClosed must be a boolean',
  })

  assert.throws(() => (createAppKitWindow as any)({ size: { width: -4, height: 10 } }), {
    name: 'TypeError',
    message: 'createAppKitWindow size must have positive finite width and height',
  })

  assert.throws(() => (createHostedWindow as any)('options'), {
    name: 'TypeError',
    message: 'createHostedWindow options must be an object',
  })

  assert.equal(typeof openSecondary, 'function')
  assert.throws(() => openSecondary(null), {
    name: 'TypeError',
    message: 'openWindow options must be an object',
  })

  assert.throws(() => openSecondary({ kind: 'sideways' }), {
    name: 'RangeError',
    message: 'Unsupported macOS window kind: sideways',
  })

  assert.throws(() => (setWindowContentResolver as any)('resolver'), {
    name: 'TypeError',
    message: 'setWindowContentResolver expects a function or null',
  })
})

test('importing the host merges platform services onto the seeded bridge', () => {
  assert.equal(typeof bridge.storageSet, 'function')
  assert.equal(bridge.appState, 'active')
  assert.equal(bridge.appInfo.supported, true)
  assert.equal(bridge.appInfo.bundleId, 'test.consumer')

  bridge.storageSet('host-key', 'host-value')
  assert.equal(bridge.storageGet('host-key'), 'host-value')
  bridge.storageRemove('host-key')
  assert.equal(bridge.storageGet('host-key'), null)

  // appState is a live accessor over delegate events, not a frozen snapshot.
  createAppKitWindow({})
  assert.equal(typeof Object.getOwnPropertyDescriptor(bridge, 'appState')?.get, 'function')
  shared.appDelegate.applicationDidResignActive()
  assert.equal(bridge.appState, 'inactive')
  shared.appDelegate.applicationDidBecomeActive()
  assert.equal(bridge.appState, 'active')
})

test('openWindow enforces the resolver contract and unmounts on close', async () => {
  setWindowContentResolver(null)
  assert.throws(() => openSecondary({}), /setWindowContentResolver/)

  setWindowContentResolver(() => 'not-a-component')
  assert.throws(() => openSecondary({}), /openWindow component|setWindowContentResolver/)

  const seen: unknown[] = []

  setWindowContentResolver((data, controller) => {
    seen.push(data)
    assert.equal(controller.isClosed, false)
    return defineUniversalComponent('macos', () => null)
  })

  const controller = openSecondary({ data: { marker: 1 }, title: 'Secondary' })

  assert.equal(seen.length, 1)
  assert.equal(controller.kind, 'regular')
  assert.equal(controller.isClosed, false)
  assert.ok(controller.root)
  assert.equal(controller.window.title, 'Secondary')
  assert.equal(
    debugWindows().some((entry) => entry.title === 'Secondary'),
    true,
  )

  controller.close()
  await controller.closed
  assert.equal(controller.isClosed, true)
  assert.equal(controller.root, null)
  assert.equal(
    debugWindows().some((entry) => entry.title === 'Secondary'),
    false,
  )
})

test('runMacOSApp calls mount cleanup once before unmount, then stops the host', async () => {
  const order: string[] = []
  let stopCalls = 0
  const priorStop = (globalThis as any).__xplatStopHost

  ;(globalThis as any).__xplatStopHost = () => {
    stopCalls += 1
  }

  process.env.OCTANE_MACOS_EXTERNAL_RUNLOOP = '1'

  let mounted: any = null

  runMacOSApp({ title: 'Host test' }, (target) => {
    mounted = target

    const unmount = target.root.unmount.bind(target.root)

    target.root.unmount = () => {
      order.push('unmount')
      unmount()
    }

    return () => order.push('cleanup')
  })

  assert.ok(mounted.app && mounted.window && mounted.contentView && mounted.root)
  assert.equal(mounted.window.title, 'Host test')
  assert.equal(mounted.app.launchingFinished, true)
  assert.equal(mounted.app.activated, true)

  shared.appDelegate.applicationWillTerminate()
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.deepEqual(order, ['cleanup', 'unmount'])
  assert.equal(mounted.window.delegate, null)
  assert.equal(mounted.app.delegate, null)
  assert.equal(stopCalls, 1)

  // A second stop request neither reruns teardown nor re-stops the host.
  ;(globalThis as any).__xplatStopHost()
  assert.deepEqual(order, ['cleanup', 'unmount'])
  assert.equal(stopCalls, 1)

  assert.throws(() => openSecondary({}), /application termination has started/)

  ;(globalThis as any).__xplatStopHost = priorStop
})

test.after(() => {
  syntax.deregister()
  boundary.deregister()
})
