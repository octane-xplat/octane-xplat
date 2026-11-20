import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { expect, it, vi } from 'vitest'
import {
  createDesktopWindowService,
  type NativeWindowController,
} from '../../src/window/service.js'

interface FakeWindow {
  id: string
}

type ChangeSink = (change: { moved: boolean; resized: boolean }) => void

interface FakeController extends NativeWindowController<FakeWindow> {
  markClosed(): void
}

function makeController(id: string): FakeController {
  let closed = false
  let resolveClosed!: () => void
  const controller: FakeController = {
    window: { id },
    get isClosed() {
      return closed
    },
    closed: new Promise<void>((resolve) => {
      resolveClosed = resolve
    }),
    onCloseRequested: null,
    close() {
      controller.markClosed()
    },
    setTitle() {},
    markClosed() {
      if (!closed) {
        closed = true
        resolveClosed()
      }
    },
  }
  return controller
}

function fixture(
  options: {
    bounds?: boolean
    minimized?: boolean
    primary?: boolean
    supportsMinimizedState?: () => boolean
  } = {},
) {
  const state = { maximized: false, minimized: false, focused: 'main' }
  const observers = new Map<FakeWindow, ChangeSink>()
  const primary = makeController('main')
  const opened: FakeController[] = []
  const actions = {
    requestClose: vi.fn(),
    present: vi.fn(),
    hide: vi.fn(),
    isVisible: () => true,
    minimize: vi.fn(() => {
      state.minimized = true
    }),
    restore: vi.fn(() => {
      state.minimized = false
    }),
    maximize: vi.fn(() => {
      state.maximized = true
    }),
    unmaximize: vi.fn(() => {
      state.maximized = false
    }),
    isMaximized: () => state.maximized,
    supportsMinimizedState: options.supportsMinimizedState,
    isMinimized: options.minimized ? () => state.minimized : undefined,
    isFocused: (window: FakeWindow) => state.focused === window.id,
    observe: vi.fn((window: FakeWindow, onChange: ChangeSink) => {
      observers.set(window, onChange)
      return () => {
        observers.delete(window)
      }
    }),
    bounds: options.bounds
      ? {
          supported: () => true,
          get: () => ({ x: 0, y: 0, width: 800, height: 600 }),
          set: () => {},
        }
      : undefined,
  }
  const binding = createDesktopWindowService<FakeWindow>(
    () => (options) => {
      const controller = makeController(String(options.title ?? opened.length))
      opened.push(controller)
      return controller
    },
    actions,
    options.primary === false ? undefined : () => primary,
  )

  return { actions, binding, observers, opened, primary, state }
}

it('returns the main window first, then open windows in creation order, dropping closed ones', async () => {
  const { binding, primary } = fixture()

  const all = binding.windows.getAllWindows()
  expect(all).toHaveLength(1)
  expect(all[0]).toBe(binding.windows.getAllWindows()[0])
  expect(binding.getWindowOwner(all[0])).toBe(primary.window)

  const first = binding.windows.open({ title: 'one' })
  const second = binding.windows.open({ title: 'two' })
  expect(binding.windows.getAllWindows()).toEqual([all[0], first, second])

  first.destroy()
  await first.closed
  expect(binding.windows.getAllWindows()).toEqual([all[0], second])

  primary.close()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(binding.windows.getAllWindows()).toEqual([second])
})

it('reports the focused handle and null when nothing has focus', () => {
  const { binding, state } = fixture()

  const main = binding.windows.getAllWindows()[0]
  const inspector = binding.windows.open({ title: 'inspector' })

  expect(binding.windows.getFocusedWindow()).toBe(main)
  state.focused = 'inspector'
  expect(binding.windows.getFocusedWindow()).toBe(inspector)
  state.focused = 'elsewhere'
  expect(binding.windows.getFocusedWindow()).toBeNull()
})

it('propagates a failing focus action instead of reporting null', () => {
  const { actions, binding } = fixture()
  binding.windows.getAllWindows()
  actions.isFocused = () => {
    throw new UnavailabilityError('windows.getFocusedWindow')
  }

  expect(() => binding.windows.getFocusedWindow()).toThrow(UnavailabilityError)
})

it('honors the main-window close veto for native and programmatic requests', () => {
  const { actions, binding, primary } = fixture()
  const main = binding.windows.getAllWindows()[0]

  let requests = 0
  const veto = (event: { preventDefault(): void }) => {
    requests++
    event.preventDefault()
  }
  main.on('close', veto)

  expect(primary.onCloseRequested?.()).toBe(false)
  expect(requests).toBe(1)

  main.close()
  expect(actions.requestClose).toHaveBeenCalledWith(primary.window)
  expect(primary.isClosed).toBe(false)
})

it('starts native observation on the first state listener and stops it after the last removal', () => {
  const { actions, binding, observers, primary } = fixture({ bounds: true })
  const main = binding.windows.getAllWindows()[0]

  expect(actions.observe).not.toHaveBeenCalled()
  const moved = vi.fn()
  main.on('move', moved)
  expect(actions.observe).toHaveBeenCalledTimes(1)
  expect(observers.has(primary.window)).toBe(true)

  const resized = vi.fn()
  main.on('resize', resized)
  expect(actions.observe).toHaveBeenCalledTimes(1)

  main.off('move', moved) // resize still observes
  expect(observers.has(primary.window)).toBe(true)
  main.off('resize', resized)
  expect(observers.has(primary.window)).toBe(false)
})

it('emits maximize transitions before move/resize inside one native notification', () => {
  const { binding, observers, primary, state } = fixture({ bounds: true })
  const main = binding.windows.getAllWindows()[0]
  const events: string[] = []

  main.on('maximize', () => events.push('maximize'))
  main.on('unmaximize', () => events.push('unmaximize'))
  main.on('move', () => events.push('move'))
  main.on('resize', () => events.push('resize'))

  state.maximized = true
  observers.get(primary.window)!({ moved: true, resized: true })
  expect(events).toEqual(['maximize', 'move', 'resize'])

  state.maximized = false
  observers.get(primary.window)!({ moved: false, resized: true })
  expect(events).toEqual(['maximize', 'move', 'resize', 'unmaximize', 'resize'])

  // No state transition — no maximize events.
  observers.get(primary.window)!({ moved: true, resized: false })
  expect(events).toEqual(['maximize', 'move', 'resize', 'unmaximize', 'resize', 'move'])
})

it('throws UnavailabilityError for move/resize listeners without bounds support', () => {
  const { binding } = fixture()
  const main = binding.windows.getAllWindows()[0]

  expect(() => main.on('move', () => {})).toThrowError(
    expect.objectContaining({ name: 'UnavailabilityError', feature: 'DesktopWindow.move' }),
  )
  expect(() => main.on('resize', () => {})).toThrowError(
    expect.objectContaining({ name: 'UnavailabilityError', feature: 'DesktopWindow.resize' }),
  )
  expect(() => main.on('maximize', () => {})).not.toThrow()
})

it('throws UnavailabilityError for isMinimized on hosts without a minimized query', () => {
  const { binding } = fixture()
  const main = binding.windows.getAllWindows()[0]

  expect(main.supportsMinimizedState).toBe(false)
  expect(() => main.isMinimized()).toThrowError(
    expect.objectContaining({ name: 'UnavailabilityError', feature: 'DesktopWindow.isMinimized' }),
  )
})

it('checks the live minimized-state capability and clears it on close', () => {
  let supported = false
  const { binding, primary } = fixture({
    minimized: true,
    supportsMinimizedState: () => supported,
  })
  const main = binding.windows.getAllWindows()[0]

  expect(main.supportsMinimizedState).toBe(false)
  supported = true
  expect(main.supportsMinimizedState).toBe(true)
  primary.markClosed()
  expect(main.supportsMinimizedState).toBe(false)
})

it('tracks maximize and minimize state through the actions', () => {
  const { actions, binding, state } = fixture({ minimized: true })
  const main = binding.windows.getAllWindows()[0]

  expect(main.supportsMinimizedState).toBe(true)
  expect(main.isMaximized()).toBe(false)
  main.maximize()
  expect(actions.maximize).toHaveBeenCalled()
  expect(main.isMaximized()).toBe(true)
  main.unmaximize()
  expect(state.maximized).toBe(false)

  main.minimize()
  expect(main.isMinimized()).toBe(true)
  main.restore()
  expect(main.isMinimized()).toBe(false)
})

it('stops observation when the window closes and clears its listeners', async () => {
  const { binding, observers, primary } = fixture({ bounds: true })
  const main = binding.windows.getAllWindows()[0]
  const moved = vi.fn()
  main.on('move', moved)
  main.on('close', (event) => event.preventDefault())

  primary.markClosed()
  await main.closed
  expect(observers.has(primary.window)).toBe(false)
  expect(() => main.on('move', moved)).not.toThrow()
  expect(moved).not.toHaveBeenCalled()
})

it('keeps a stable handle identity for the main window', () => {
  const { binding } = fixture()

  const first = binding.windows.getAllWindows()
  const second = binding.windows.getAllWindows()
  const focused = binding.windows.getFocusedWindow()

  expect(first[0]).toBe(second[0])
  expect(focused).toBe(first[0])
  expect(binding.windows.open()).not.toBe(first[0])
})
