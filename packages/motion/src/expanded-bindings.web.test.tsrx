/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot, useEffect } from 'octane'
import { expect, it, vi } from 'vitest'
import { dispatchPointer } from '../test/geometry.web'
import { motion, useMotionValue, useTransform } from './index.web'
import type { MotionValue } from './value'
import type { MotionTargetError } from './value-codec'
import { VideoCropSurface } from '../../../examples/motion/video-crop-surface.tsrx'
import type { VideoCropControls } from '../../../examples/motion/video-crop-surface.tsrx'

type Values = {
  p: MotionValue<number>
  x: MotionValue<string>
  clip: MotionValue<string>
  width: MotionValue<number>
}

function Bindings(props: {
  ready(values: Values): void
  error(error: MotionTargetError): void
}) @{
  const p = useMotionValue(0)
  const x = useMotionValue('0px')
  const width = useMotionValue(10)
  const clip = useTransform(p, [0, 1], ['inset(30% 10% round 12px)', 'inset(0% round 0px)'])

  useEffect(() => {
    props.ready({ p, x, clip, width })
  }, [])

  <>
    <motion.View
      id="crop"
      style={{ width: 200, height: 100, boxSizing: 'border-box', x, clipPath: clip }}
    />
    <motion.View
      id="width"
      style={{ boxSizing: 'border-box', width }}
      onMotionError={props.error}
    />
  </>
}

it('binds derived clips, resolves a bound mixed-unit value and releases subscriptions', async () => {
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  let values: Values | undefined
  const errors: MotionTargetError[] = []

  act(() =>
    root.render(
      <Bindings
        ready={(next) => {
          values = next
        }}
        error={(error) => errors.push(error)}
      />,
    ),
  )

  await act(async () => {})
  if (!values) {
    throw new Error('bindings did not mount')
  }

  const node = container.querySelector<HTMLElement>('#crop')!

  Object.defineProperty(node, 'offsetWidth', { value: 200, configurable: true })
  Object.defineProperty(node, 'offsetHeight', { value: 100, configurable: true })
  act(() => values!.p.set(0.5))
  expect(node.style.clipPath).toContain('inset(15px 10px 15px 10px')
  expect(() => values!.clip.set('inset(0%)')).toThrow(/read-only/)
  await act(async () => {
    await values!.x.animate('50%', { duration: 0 }).finished
  })

  expect(values.x.get()).toBe('100px')
  expect(node.style.transform).toContain('translateX(100px)')
  act(() => values!.width.set(-1))
  expect(errors).toHaveLength(1)
  expect(container.querySelector<HTMLElement>('#width')!.style.width).toBe('10px')
  act(() => root.unmount())
  expect(node.style.clipPath).toBe('')
  container.remove()
})

it('cancels a video crop drag back to the completed endpoint and cleans up its controls', async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))

  const closed = vi.fn()
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  let controls: VideoCropControls | undefined

  act(() =>
    root.render(
      <VideoCropSurface
        onClosed={closed}
        geometry={{
          overlay: { x: 0, y: 0, width: 400, height: 800 },
          media: { x: 0, y: 200, width: 400, height: 400 },
          thumbnailImage: { x: 20, y: 40, width: 120, height: 120 },
          thumbnailClip: { x: 20, y: 60, width: 120, height: 80 },
          radius: 16,
        }}
        onControls={(next) => {
          controls = next
        }}
      />,
    ),
  )

  await act(async () => {})
  expect(controls).toBeDefined()
  await act(async () => {
    controls!.open()
  })

  const node = container.firstElementChild as HTMLElement
  const openClip = node.style.clipPath

  act(() => {
    dispatchPointer(node, 'pointerdown', 100, 100)
    dispatchPointer(node, 'pointermove', 100, 120)
    dispatchPointer(node, 'pointermove', 100, 200)
  })

  expect(node.style.clipPath).not.toBe(openClip)
  await act(async () => {
    dispatchPointer(node, 'pointercancel', 100, 200)
  })

  expect(node.style.clipPath).toBe(openClip)
  expect(closed).not.toHaveBeenCalled()
  await act(async () => {
    controls!.close()
  })

  expect(closed).toHaveBeenCalledOnce()
  act(() => root.unmount())
  expect(controls).toBeUndefined()
  container.remove()
  vi.unstubAllGlobals()
})

it('restores authored compound styles after a cancelled press without a competing binding', async () => {
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)

  act(() =>
    root.render(
      <motion.View
        id="press-crop"
        style={{ width: 200, height: 100, clipPath: 'inset(0px)', borderRadius: '12px' }}
        whileTap={{ clipPath: 'inset(10px)', borderRadius: 24 }}
        transition={{ duration: 0 }}
      />,
    ),
  )

  await act(async () => {})

  const node = container.querySelector<HTMLElement>('#press-crop')!

  await act(async () => {
    dispatchPointer(node, 'pointerdown', 0, 0)
  })

  expect(node.style.clipPath).toContain('inset(10px')
  expect(node.style.borderRadius).toContain('24px')
  await act(async () => {
    dispatchPointer(node, 'pointercancel', 0, 0)
  })

  expect(node.style.clipPath).toContain('inset(0px')
  expect(node.style.borderRadius).toContain('12px')
  act(() => root.unmount())
  container.remove()
})
