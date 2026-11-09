import { describe, it, expect, vi } from 'vitest'
import type { MotionProps } from '../src/types'
import type { Controller } from '../src/controller'

export interface GestureHarness {
  controller: Controller
  event(name: 'focus' | 'blur' | 'down' | 'up' | 'cancel'): void
  update(props: MotionProps): void
  close(): void
}

export function gestureContract(mount: (props: MotionProps, reduced?: boolean) => GestureHarness) {
  describe('composed gesture destinations (#209)', () => {
    for (const reduced of [false, true]) {
      for (const first of ['blur', 'up'] as const) {
        it(`preserves precedence with ${first} first, reduced=${reduced}`, () => {
          const m = mount(
            { style: { scale: 1 }, whileFocus: { scale: 1.1 }, whileTap: { scale: 0.9 } },
            reduced,
          )

          try {
            m.event('focus')
            m.event('down')
            expect(m.controller.value('scale').get()).toBe(0.9)
            m.event(first)
            expect(m.controller.value('scale').get()).toBe(first === 'blur' ? 0.9 : 1.1)
            m.event(first === 'blur' ? 'up' : 'blur')
            expect(m.controller.value('scale').get()).toBe(1)
          } finally {
            m.close()
          }
        })
      }
    }

    it('uses the current base and gesture definitions while held and after removal', () => {
      const m = mount({
        animate: { scale: 1 },
        whileFocus: { scale: 1.1 },
        whileTap: { scale: 0.9 },
      })

      try {
        m.event('focus')
        m.event('down')
        m.update({ animate: { scale: 2 }, whileFocus: { scale: 1.2 }, whileTap: { scale: 0.8 } })
        expect(m.controller.value('scale').get()).toBe(0.8)
        m.update({ animate: { scale: 2 }, whileFocus: { scale: 1.2 } })
        expect(m.controller.value('scale').get()).toBe(1.2)
        m.event('cancel')
        m.event('blur')
        expect(m.controller.value('scale').get()).toBe(2)
        m.update({ animate: { scale: 2 }, whileTap: { scale: 0.7 } })
        expect(m.controller.value('scale').get()).toBe(2)
      } finally {
        m.close()
      }
    })

    it('tracks numeric style changes and cancels press back to active focus', () => {
      const m = mount({ style: { scale: 1 }, whileTap: { scale: 0.9 }, whileFocus: { x: 20 } })

      try {
        m.event('focus')
        m.event('down')
        m.update({ style: { scale: 2 }, whileTap: { scale: 0.9 }, whileFocus: { x: 20 } })
        expect(m.controller.value('scale').get()).toBe(0.9)
        expect(m.controller.value('x').get()).toBe(20)
        m.event('cancel')
        expect(m.controller.value('scale').get()).toBe(2)
        expect(m.controller.value('x').get()).toBe(20)
        m.event('blur')
        expect(m.controller.value('x').get()).toBe(0)
      } finally {
        m.close()
      }
    })

    it('disposes active gestures and ignores late terminal events', async () => {
      vi.useFakeTimers()

      const m = mount({ whileTap: { scale: 0.8 }, transition: { duration: 1 } })

      try {
        m.event('down')
        await vi.advanceTimersByTimeAsync(100)
        m.close()
        m.event('cancel')
        await vi.advanceTimersByTimeAsync(1200)
        expect(m.controller.values.size).toBe(0)
      } finally {
        m.close()
        vi.useRealTimers()
      }
    })

    it('restores defaults when active props and base keys are removed', () => {
      const m = mount({ animate: { scale: 2 }, whileTap: { scale: 0.8 } })

      try {
        m.event('down')
        m.update({ animate: {} })
        expect(m.controller.value('scale').get()).toBe(1)
      } finally {
        m.close()
      }
    })

    it('does not stop or restart unrelated animated channels', async () => {
      vi.useFakeTimers()

      const m = mount({
        animate: { x: 100 },
        transition: { duration: 1, ease: 'linear' },
        whileFocus: { opacity: 0.5 },
        whileFocusTransition: { duration: 1, ease: 'linear' },
        whileTap: { scale: 0.9 },
        whileTapTransition: { duration: 0 },
      })

      try {
        m.event('focus')
        await vi.advanceTimersByTimeAsync(300)

        const x = m.controller.value('x').get()
        const opacity = m.controller.value('opacity').get()

        expect(x).toBeGreaterThan(0)
        m.event('down')
        m.event('up')
        await vi.advanceTimersByTimeAsync(300)
        expect(m.controller.value('x').get()).toBeGreaterThan(x)
        expect(m.controller.value('opacity').get()).toBeLessThan(opacity)
        m.update({ animate: { x: 100 }, transition: { duration: 1, ease: 'linear' } })
        await vi.advanceTimersByTimeAsync(450)
        expect(m.controller.value('x').get()).toBe(100)
        expect(m.controller.value('opacity').get()).toBeGreaterThan(0.5)
        m.close()
        expect(m.controller.values.size).toBe(0)
        await vi.advanceTimersByTimeAsync(50)
        expect(vi.getTimerCount()).toBe(0)
      } finally {
        m.close()
        vi.useRealTimers()
      }
    })
  })
}
