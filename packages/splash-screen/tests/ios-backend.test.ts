import { afterEach, expect, it, vi } from 'vitest'

const nativescript = vi.hoisted(() => ({ Application: { started: false } }))

vi.mock('@nativescript/core', () => nativescript)

interface HostOptions {
  mainThread?: boolean
  storyboard?: string | null
  storyboardSuffix?: boolean
  compiled?: boolean
  initialController?: boolean
  maxHold?: unknown
  started?: boolean
}

const stubs = vi.hoisted(() => ({
  observers: [] as Array<{ name: unknown; object: unknown; run: (notification: unknown) => void }>,
  delayed: [] as Array<{ when: number; run: () => void }>,
  queued: [] as Array<() => void>,
  animations: [] as Array<{ duration: number; animate: () => void; done: () => void }>,
}))

function makeView() {
  return {
    frame: null as unknown,
    autoresizingMask: 0,
    accessibilityIdentifier: '',
    accessibilityViewIsModal: false,
    userInteractionEnabled: false,
    alpha: 1,
    hidden: false,
    superview: null as unknown,
    removed: false,
    isEqual(other: unknown) {
      return other === this
    },
    removeFromSuperview() {
      this.removed = true
      this.superview = null
    },
  }
}

function stubHost(options: HostOptions = {}) {
  const {
    mainThread = true,
    storyboard = 'LaunchScreen',
    storyboardSuffix = false,
    compiled = true,
    initialController = true,
    started = false,
  } = options

  stubs.observers.length = 0
  stubs.delayed.length = 0
  stubs.queued.length = 0
  stubs.animations.length = 0
  nativescript.Application.started = started

  const info: Record<string, unknown> = {
    UILaunchStoryboardName:
      storyboard === null ? undefined : storyboardSuffix ? `${storyboard}.storyboard` : storyboard,
  }

  if ('maxHold' in options) {
    info.XplatSplashScreenMaxHoldMilliseconds = options.maxHold
  }

  class NSObjectStub {
    static alloc() {
      return new (this as unknown as new () => NSObjectStub)()
    }
    init() {
      return this
    }
    static extend(members: Record<string, unknown>) {
      return class extends NSObjectStub {
        static new() {
          return new this()
        }
        constructor() {
          super()
          Object.assign(this, members)
        }
      }
    }
  }

  vi.stubGlobal('interop', { types: { void: {} } })
  vi.stubGlobal('NSObject', NSObjectStub)
  vi.stubGlobal('NSString', class NSStringStub {})
  vi.stubGlobal('NSDictionary', class NSDictionaryStub {})

  class NSNumberStub {
    constructor(public doubleValue: number) {}
  }

  vi.stubGlobal('NSNumber', NSNumberStub)
  vi.stubGlobal('NSThread', { isMainThread: mainThread })
  vi.stubGlobal('NSBundle', {
    mainBundle: {
      objectForInfoDictionaryKey: (key: string) => info[key],
      pathForResourceOfType: (name: string | null, type: string | null) =>
        type === 'storyboardc' && compiled && name ? `/app/${name}.storyboardc` : null,
    },
  })

  vi.stubGlobal('NSNotificationCenter', {
    defaultCenter: {
      addObserverForNameObjectQueueUsingBlock(
        name: unknown,
        object: unknown,
        _queue: unknown,
        run: (notification: unknown) => void,
      ) {
        const observer = { name, object, run }

        stubs.observers.push(observer)
        return observer
      },
      removeObserver(observer: unknown) {
        const index = stubs.observers.indexOf(observer as never)

        if (index >= 0) {
          stubs.observers.splice(index, 1)
        }
      },
    },
  })

  vi.stubGlobal('UIWindowDidBecomeVisibleNotification', 'UIWindowDidBecomeVisibleNotification')
  vi.stubGlobal('UIWindowDidBecomeHiddenNotification', 'UIWindowDidBecomeHiddenNotification')
  vi.stubGlobal('UIWindowLevelNormal', 0)
  vi.stubGlobal('UIView', {
    animateWithDurationAnimationsCompletion(
      duration: number,
      animate: () => void,
      done: () => void,
    ) {
      stubs.animations.push({ duration, animate, done })
    },
  })

  vi.stubGlobal('dispatch_time', (when: number, delta: number) => when + delta)
  vi.stubGlobal('dispatch_after', (when: number, _queue: unknown, run: () => void) => {
    stubs.delayed.push({ when, run })
  })

  vi.stubGlobal('NSOperationQueue', {
    mainQueue: {
      underlyingQueue: {},
      addOperationWithBlock: (run: () => void) => {
        stubs.queued.push(run)
      },
    },
  })

  const controllerView = makeView()

  vi.stubGlobal('UIStoryboard', {
    storyboardWithNameBundle: () => ({
      instantiateInitialViewController: () => (initialController ? { view: controllerView } : null),
    }),
  })

  class UIWindowStub {
    windowLevel = 0
    hidden = false
    bounds = { origin: { x: 0, y: 0 }, size: { width: 390, height: 844 } }
    rootViewController: unknown = null
    subviews: Array<{ superview: unknown }> = []
    kvo: {
      observer: { observeValueForKeyPathOfObjectChangeContext: Function }
      keyPath: string
    } | null = null
    kvoRemoved = false
    addSubview(view: { superview: unknown }) {
      view.superview = this
      this.subviews.push(view)
    }
    addObserverForKeyPathOptionsContext(
      observer: { observeValueForKeyPathOfObjectChangeContext: Function },
      keyPath: string,
    ) {
      this.kvo = { observer, keyPath }
    }
    removeObserverForKeyPath() {
      this.kvoRemoved = true
      this.kvo = null
    }
  }

  vi.stubGlobal('UIWindow', UIWindowStub)
  return { UIWindowStub, NSNumberStub, controllerView, info }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

const importBackend = () => import('../src/backend.ios')

function fireVisible(window: unknown) {
  for (const observer of [...stubs.observers]) {
    if (observer.name === 'UIWindowDidBecomeVisibleNotification') {
      observer.run({ object: window })
    }
  }
}

function fireHidden(window: unknown) {
  for (const observer of [...stubs.observers]) {
    if (observer.name === 'UIWindowDidBecomeHiddenNotification' && observer.object === window) {
      observer.run({ object: window })
    }
  }
}

it('reports capabilities from the configured launch storyboard only', async () => {
  stubHost({ storyboard: null })

  const { backend } = await importBackend()

  expect(backend.capabilities()).toEqual({
    hold: false,
    fade: false,
    animationDuration: false,
  })

  expect(() => backend.preventAutoHide()).toThrow('launch storyboard')

  stubHost({ storyboardSuffix: true })
  vi.resetModules()

  const suffixed = await importBackend()

  expect(suffixed.backend.capabilities().hold).toBe(true)

  stubHost({ compiled: false })
  vi.resetModules()

  const uncompiled = await importBackend()

  expect(uncompiled.backend.capabilities().hold).toBe(false)
})

it('registers the window observer during preparation without touching app or window objects', async () => {
  stubHost()

  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)
  expect(stubs.observers.map((entry) => entry.name)).toEqual([
    'UIWindowDidBecomeVisibleNotification',
  ])

  expect(stubs.queued).toHaveLength(0)

  const state = JSON.parse(diagnostics())

  expect(state.state).toBe('waiting')
  expect(state.held).toBe(true)
  expect(stubs.delayed).toHaveLength(1)
})

it('rejects malformed hold bounds before arming', async () => {
  for (const maxHold of [true, '15000', 50, 120001, 1000.5, Number.NaN]) {
    stubHost({ maxHold })

    const { backend } = await importBackend()

    expect(() => backend.preventAutoHide()).toThrow('Invalid native splash screen configuration')
    vi.resetModules()
  }

  stubHost({ maxHold: 15000 })

  const valid = await importBackend()

  expect(valid.backend.preventAutoHide()).toBe(true)
  expect(stubs.delayed).toHaveLength(1)
  expect(stubs.delayed[0].when).toBe(15_000_000_000)
})

it('accepts an NSNumber-wrapped hold bound', async () => {
  const { NSNumberStub, info } = stubHost({ maxHold: 1000 })

  info.XplatSplashScreenMaxHoldMilliseconds = new NSNumberStub(2000)

  const { backend } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)
  expect(stubs.delayed[0].when).toBe(2_000_000_000)
})

it('attaches the storyboard continuation to the first normal visible window', async () => {
  const { UIWindowStub, controllerView } = stubHost()
  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)

  fireVisible({})

  const hiddenWindow = new UIWindowStub()

  hiddenWindow.hidden = true
  fireVisible(hiddenWindow)

  const alertWindow = new UIWindowStub()

  alertWindow.windowLevel = 2000
  fireVisible(alertWindow)
  expect(JSON.parse(diagnostics()).state).toBe('waiting')

  const window = new UIWindowStub()

  fireVisible(window)

  const state = JSON.parse(diagnostics())

  expect(state.state).toBe('visible')
  expect(state.visible).toBe(true)
  expect(controllerView.superview).toBe(window)
  expect(controllerView.userInteractionEnabled).toBe(true)
  expect(controllerView.accessibilityIdentifier).toBe('xplat.launch-screen')
  expect(controllerView.accessibilityViewIsModal).toBe(true)
  expect(controllerView.autoresizingMask).toBe(18)
  expect(controllerView.frame).toBe(window.bounds)
  expect(window.kvo?.keyPath).toBe('rootViewController')
  expect(stubs.observers).toHaveLength(1)
  expect(stubs.observers[0].name).toBe('UIWindowDidBecomeHiddenNotification')
  expect(stubs.observers[0].object).toBe(window)

  const second = new UIWindowStub()

  fireVisible(second)
  expect(controllerView.superview).toBe(window)
})

it('reattaches the continuation above a replacement scene root', async () => {
  const { UIWindowStub, controllerView } = stubHost()
  const { backend } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)

  const window = new UIWindowStub()

  fireVisible(window)
  window.subviews.length = 0
  controllerView.superview = null
  window.kvo?.observer.observeValueForKeyPathOfObjectChangeContext(
    'rootViewController',
    window,
    null,
    null,
  )

  expect(window.subviews[window.subviews.length - 1]).toBe(controllerView)
  expect(controllerView.superview).toBe(window)
})

it('auto-hides an unheld continuation on the next main-queue turn', async () => {
  const { UIWindowStub, controllerView } = stubHost()
  const { backend, diagnostics } = await importBackend()

  backend.configure({ fade: false })

  const window = new UIWindowStub()

  fireVisible(window)
  expect(stubs.queued).toHaveLength(1)
  stubs.queued[0]()
  expect(controllerView.removed).toBe(true)
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
})

it('holds through repeated prevention and releases on hide with a fade', async () => {
  const { UIWindowStub, controllerView } = stubHost()
  const { backend, diagnostics } = await importBackend()

  backend.configure({ duration: 250, fade: true })
  expect(backend.preventAutoHide()).toBe(true)
  expect(backend.preventAutoHide()).toBe(true)
  expect(stubs.delayed).toHaveLength(1)

  const window = new UIWindowStub()

  fireVisible(window)
  expect(stubs.queued).toHaveLength(0)
  backend.hide()
  expect(stubs.animations).toHaveLength(1)
  expect(stubs.animations[0].duration).toBe(0.25)
  expect(JSON.parse(diagnostics()).state).toBe('hiding')
  stubs.animations[0].animate()
  expect(controllerView.alpha).toBe(0)
  stubs.animations[0].done()
  expect(controllerView.removed).toBe(true)

  const state = JSON.parse(diagnostics())

  expect(state.state).toBe('hidden')
  expect(state.observers).toBe(false)
  expect(state.timeout).toBe(false)
  expect(backend.preventAutoHide()).toBe(false)
})

it('cancels a pending auto-hide when the hold arrives after attachment', async () => {
  const { UIWindowStub } = stubHost()
  const { backend } = await importBackend()

  backend.configure({})

  const window = new UIWindowStub()

  fireVisible(window)
  expect(stubs.queued).toHaveLength(1)
  expect(backend.preventAutoHide()).toBe(true)
  stubs.queued[0]()
  expect(JSON.parse((await importBackend()).diagnostics()).state).toBe('visible')
})

it('releases an abandoned hold at the native deadline', async () => {
  const { UIWindowStub, controllerView } = stubHost({ maxHold: 1000 })
  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)

  const window = new UIWindowStub()

  fireVisible(window)
  expect(JSON.parse(diagnostics()).state).toBe('visible')
  stubs.delayed[0].run()
  expect(controllerView.removed).toBe(true)
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
  expect(stubs.animations).toHaveLength(0)
})

it('an early hide prevents later attachment', async () => {
  const { UIWindowStub } = stubHost()
  const { backend, diagnostics } = await importBackend()

  backend.hide()
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
  fireVisible(new UIWindowStub())
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
  expect(backend.preventAutoHide()).toBe(false)
})

it('treats a request after Application.started as a dismissed startup', async () => {
  stubHost({ started: true })

  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(false)
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
  expect(stubs.observers).toHaveLength(0)
})

it('dismisses when the owning window hides and ignores repeated calls', async () => {
  const { UIWindowStub, controllerView } = stubHost()
  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)

  const window = new UIWindowStub()

  fireVisible(window)
  fireHidden(window)
  expect(controllerView.removed).toBe(true)
  expect(window.kvoRemoved).toBe(true)
  expect(stubs.observers).toHaveLength(0)
  backend.hide()
  expect(JSON.parse(diagnostics()).state).toBe('hidden')
})

it('fails closed when the storyboard has no initial controller', async () => {
  const { UIWindowStub } = stubHost({ initialController: false })
  const { backend, diagnostics } = await importBackend()

  expect(backend.preventAutoHide()).toBe(true)
  fireVisible(new UIWindowStub())
  expect(JSON.parse(diagnostics()).state).toBe('failed')
  expect(backend.preventAutoHide()).toBe(false)
})

it('rejects invalid native options through configure', async () => {
  stubHost()

  const { backend } = await importBackend()

  expect(() => backend.configure({ duration: -1 } as never)).toThrow(
    'Invalid native splash screen options',
  )

  expect(() => backend.configure({ duration: 60001 } as never)).toThrow(
    'Invalid native splash screen options',
  )

  expect(() => backend.configure({ fade: 1 } as never)).toThrow(
    'Invalid native splash screen options',
  )

  backend.configure({})
})

it('refuses preparation off the main thread', async () => {
  stubHost({ mainThread: false })

  const { backend } = await importBackend()

  expect(() => backend.preventAutoHide()).toThrow('Invalid native splash screen configuration')
  expect(stubs.observers).toHaveLength(0)
})
