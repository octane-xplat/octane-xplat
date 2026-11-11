import { describe, expect, it, vi } from 'vitest'
import { bindDrawer, drawerDestination, type DrawerPresentation } from './native-binding'
import type { DrawerProps } from '../../../props'
import type { AnimationResult, PanSample } from '@octane-xplat/ui'

function setup(initial: DrawerProps = {}) {
  let props = initial
  let value = 0
  let width = 280
  const pending: { value: number; finish(result: AnimationResult): void }[] = []
  const presentation: DrawerPresentation = {
    width: () => width,
    read: () => value,
    stop: vi.fn(),
    write: (next) => {
      value = next
    },
    settle: vi.fn(
      (next) =>
        new Promise((resolve) => {
          pending.push({ value: next, finish: resolve })
        }),
    ),
    dispose: vi.fn(),
  }

  const binding = bindDrawer(presentation, () => props)
  let session = 0
  const sample = (x = 0, velocity = 0): PanSample => ({
    sequenceId: '1',
    time: 1,
    target: { id: 'button' },
    currentTarget: { id: 'drawer' },
    position: { local: { x, y: 0 }, window: { x, y: 0 }, screen: null },
    startPosition: { local: { x: 0, y: 0 }, window: { x: 0, y: 0 }, screen: null },
    pointerCount: 1,
    contacts: [],
    translation: { x, y: 0 },
    velocity: { x: velocity, y: 0 },
    session: { id: String(++session), cancel: vi.fn() },
  })

  return {
    binding,
    presentation,
    sample,
    pending,
    value: () => value,
    update(next: DrawerProps) {
      props = next
      binding.sync()
    },
    resize(next: number) {
      width = next
      binding.sync()
    },
    async finish(index = pending.length - 1, stale = false) {
      const run = pending[index]

      if (!stale) {
        value = run.value
      }

      run.finish({ status: 'finished' })
      await Promise.resolve()
    },
  }
}

describe('shared-owner native Drawer presentation', () => {
  it('waits for geometry and seeds defaultOpen only once without callback echoes', async () => {
    const change = vi.fn()
    const f = setup({ defaultOpen: true, onOpenChange: change })

    f.resize(0)
    expect(f.pending).toHaveLength(0)
    f.resize(280)
    expect(f.pending[0].value).toBe(280)
    await f.finish()
    expect(change).not.toHaveBeenCalled()
    f.update({ defaultOpen: false, onOpenChange: change })
    expect(f.pending).toHaveLength(1)
  })

  it('admits only enabled edge contacts and signed intent before start', () => {
    const f = setup()
    const position = (x: number) => ({ local: { x, y: 0 }, window: { x, y: 0 }, screen: null })

    expect(f.binding.admission.admit(position(80))).toBe(false)
    expect(f.binding.admission.admit(position(10))).toBe(true)
    expect(f.binding.admission.intent(f.sample(-20))).toBe(false)
    expect(f.binding.admission.intent(f.sample(20))).toBe(true)
    f.update({ isGestureEnabled: false })
    expect(f.binding.admission.admit(position(10))).toBe(false)
  })

  it('rejects a possible candidate after a new command or geometry revision', () => {
    const f = setup()

    f.binding.admission.admit({ local: { x: 20, y: 0 }, window: { x: 20, y: 0 }, screen: null })
    f.update({ open: true })
    expect(f.binding.admission.intent(f.sample(30))).toBe(false)
  })

  it('moves only in started sessions, clamps progress and emits a single settled user request', async () => {
    const change = vi.fn()
    const f = setup({ onOpenChange: change })

    f.binding.sync()

    const start = f.sample()

    f.binding.pan.onUpdate?.({ ...start, translation: { x: 90, y: 0 } })
    expect(f.value()).toBe(0)
    f.binding.pan.onStart?.(start)

    const end = { ...start, translation: { x: 400, y: 0 } }

    f.binding.pan.onUpdate?.(end)
    expect(f.value()).toBe(280)
    f.binding.pan.onEnd?.(end)
    expect(change).not.toHaveBeenCalled()
    await f.finish()
    expect(change.mock.calls).toEqual([[true]])
    await Promise.resolve()
    expect(f.pending).toHaveLength(1)
  })

  it('rolls cancelled multi-contact/capture-loss work back without dismissal', async () => {
    for (const reason of ['pointer-count', 'capture-lost', 'system'] as const) {
      const change = vi.fn(),
        dismiss = vi.fn()

      const f = setup({ onOpenChange: change, onDismiss: dismiss })

      f.binding.sync()

      const start = f.sample()

      f.binding.pan.onStart?.(start)
      f.binding.pan.onUpdate?.({ ...start, translation: { x: 160, y: 0 } })
      f.binding.pan.onCancel?.(start, reason)
      expect(f.pending[0].value).toBe(0)
      await f.finish()
      expect(change).not.toHaveBeenCalled()
      expect(dismiss).not.toHaveBeenCalled()
    }
  })

  it('regrabs rendered progress and ignores stale settlement completions', async () => {
    const change = vi.fn()
    const f = setup({ open: true, onOpenChange: change })

    f.binding.sync()
    f.presentation.write(120)

    const start = f.sample()

    f.binding.pan.onStart?.(start)
    f.binding.pan.onUpdate?.({ ...start, translation: { x: -30, y: 0 } })
    expect(f.value()).toBe(90)
    await f.finish(0, true)
    expect(change).not.toHaveBeenCalled()
    expect(f.value()).toBe(90)
  })

  it('accepts queued controlled state and restores a rejected destination', async () => {
    for (const accept of [false, true]) {
      const change = vi.fn((open: boolean) => {
        if (accept) {
          queueMicrotask(() => f.update({ open, onOpenChange: change }))
        }
      })

      const f = setup({ open: false, onOpenChange: change })

      f.binding.sync()

      const start = f.sample()

      f.binding.pan.onStart?.(start)

      const end = { ...start, translation: { x: 200, y: 0 } }

      f.binding.pan.onUpdate?.(end)
      f.binding.pan.onEnd?.(end)
      await f.finish()
      await Promise.resolve()
      expect(change).toHaveBeenCalledExactlyOnceWith(true)
      expect(f.pending).toHaveLength(accept ? 1 : 2)
      if (!accept) {
        expect(f.pending[1].value).toBe(0)
      }
    }
  })

  it('latest commands interrupt, cancel active input and never echo user callbacks', async () => {
    const change = vi.fn()
    const f = setup({ open: true, onOpenChange: change })

    f.binding.sync()
    f.presentation.write(100)
    f.update({ open: false, onOpenChange: change })
    expect(f.pending[1].value).toBe(0)
    f.update({ open: true, onOpenChange: change, reducedMotion: true })
    expect(f.presentation.settle).toHaveBeenLastCalledWith(280, true)
    await f.finish(0, true)
    await f.finish(1, true)
    await f.finish(2)
    expect(change).not.toHaveBeenCalled()

    const start = f.sample()

    f.binding.pan.onStart?.(start)
    f.update({ open: false, onOpenChange: change })
    expect(start.session.cancel).toHaveBeenCalledOnce()
  })

  it('dismisses through current handlers, reports errors and disposes once', async () => {
    const change = vi.fn(),
      dismiss = vi.fn(),
      error = vi.fn()

    const f = setup({ defaultOpen: true, onError: error })

    f.binding.sync()
    await f.finish()
    f.update({ onOpenChange: change, onDismiss: dismiss, onError: error })
    f.binding.dismiss()
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
    expect(dismiss).toHaveBeenCalledOnce()
    await Promise.resolve()
    f.pending.at(-1)!.finish({ status: 'failed', error: 'failure' })
    await Promise.resolve()
    expect(error).toHaveBeenCalledExactlyOnceWith('failure')
    f.binding.dispose()
    f.binding.dispose()
    f.binding.dismiss()
    expect(f.presentation.dispose).toHaveBeenCalledOnce()
    expect(change).toHaveBeenCalledOnce()
  })

  it('keeps direction triggers and midpoint/velocity fallback explicit', () => {
    expect(drawerDestination(20, 280, 0, 1000)).toBe(true)
    expect(drawerDestination(260, 280, 0, -1000)).toBe(false)
    expect(drawerDestination(130, 280, 0, 0)).toBe(false)
    expect(drawerDestination(150, 280, 0, 0)).toBe(true)
  })
})
