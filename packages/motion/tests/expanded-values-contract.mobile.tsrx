/** @jsxImportSource @octane-xplat/jsx */
// Nonvisual native policy/geometry probe; no OS-input or appearance qualification.
import { useLayoutEffect } from 'octane'
import { Color } from '@nativescript/core'
import { motion, useMotionValue, useTransform, useAnimate } from '@octane-xplat/motion'
import type { MotionValue, ScopedAnimate } from '@octane-xplat/motion'
import type { View } from '@nativescript/core'
import type { ProbeContext } from '../../../tools/probe/context'

let progress: MotionValue<number>
let animate: ScopedAnimate
function Integrated() @{
  const p$ = useMotionValue(0)
  const clip$ = useTransform(p$, [0, 1], ['inset(20% 10% round 12px)', 'inset(0% round 0px)'])
  const x$ = useTransform(p$, [0, 1], [0, 30])
  const [scope, scoped] = useAnimate()

  useLayoutEffect(() => {
    progress = p$
    animate = scoped
  }, [])

  <masonview style={{ width: '100%', height: '100%' }}>
    <motion.View
      id="bound"
      style={{ width: 240, height: 160, clipPath: clip$, x: x$, backgroundColor: '#224466' }}
    >
      <masonview style={{ width: 240, height: 160 }} />
    </motion.View>
    <motion.View
      id="target"
      ref={scope}
      initial={{ width: 200, x: 0, clipPath: 'inset(10% round 12px)' }}
      style={{ height: 100, backgroundColor: '#446688' }}
    />
  </masonview>
}

export async function runExpandedValues(
  ctx: ProbeContext,
  inspectNative?: (ctx: ProbeContext, host: View, frame: number) => void,
) {
  await ctx.mount(Integrated)

  const bound: View = await ctx.waitFor(() => ctx.find('bound'))
  const target: View = await ctx.waitFor(() => ctx.find('target'))

  await ctx.waitFor(
    () =>
      Math.abs(bound.getActualSize().width - 240) < 1 &&
      Math.abs(target.getActualSize().width - 200) < 1,
  )

  const opening = progress.animate(1, { duration: 0.4, ease: 'linear' })

  await new Promise((resolve) => setTimeout(resolve, 150))

  const shown = progress.get()

  ctx.assert('opening sampled interior progress', shown > 0 && shown < 1, true)
  progress.stop()
  ctx.assert('interruption cancels progress playback', await opening.finished, 'cancelled')
  progress.set(0.5)
  await new Promise((resolve) => setTimeout(resolve, 80))
  ctx.assert(
    'derived clip uses host measurements',
    bound.style.clipPath.includes('inset(16px 12px'),
    true,
  )

  const before = bound.style.clipPath

  for (let frame = 0; frame < 5; frame++) {
    bound.style.backgroundColor = new Color(frame % 2 ? '#335577' : '#224466')
    bound._redrawNativeBackground(bound.style.backgroundInternal)
    bound.requestLayout()
    await new Promise((resolve) => setTimeout(resolve, 50))
    ctx.assert('redraw ' + frame + ' retains owned style', bound.style.clipPath, before)
    inspectNative?.(ctx, bound, frame)
  }

  const reversing = progress.animate(0, { type: 'spring', stiffness: 220, damping: 32 })

  ctx.assert('spring reversal finishes', await reversing.finished, 'finished')
  ctx.assert('reversal returns displayed progress', progress.get(), 0)
  progress.set(0.35)
  ctx.assert(
    'drag cancellation return finishes',
    await progress.animate(0, { duration: 0.05 }).finished,
    'finished',
  )

  const first = animate(
    { width: 260, x: '50%', clipPath: 'inset(0% round 0px)' },
    { duration: 0.4, ease: 'linear' },
  )

  await new Promise((resolve) => setTimeout(resolve, 120))

  const second = animate(
    { width: 240, x: '25%', clipPath: 'inset(5% round 8px)' },
    { duration: 0.15, ease: 'linear' },
  )

  ctx.assert('retarget replaces logical run', await first, 'replaced')
  ctx.assert('replacement finishes', await second, 'finished')
  await ctx.waitFor(
    () =>
      Math.abs(target.getActualSize().width - 240) < 0.5 && Math.abs(target.translateX - 60) < 0.5,
  )

  ctx.assert('mixed unit channel follows final resized host', Math.round(target.translateX), 60)
  bound.style.width = 300
  await new Promise((resolve) => setTimeout(resolve, 200))
  ctx.record('resize observed', {
    actual: bound.getActualSize(),
    declared: String(bound.style.width),
    clip: bound.style.clipPath,
  })

  await ctx.waitFor(() => Math.abs(bound.getActualSize().width - 300) < 1)
  progress.set(0.5)
  await new Promise((resolve) => setTimeout(resolve, 80))
  ctx.assert(
    'bound crop resolves new dimensions',
    Math.abs(
      Number(/inset\(16px ([\d.]+)px/.exec(bound.style.clipPath)?.[1]) -
        bound.getActualSize().width * 0.05,
    ) < 0.1,
    true,
  )

  await animate({ clipPath: 'path("M0 0 L240 0 L240 100 L0 100 Z")' }, { duration: 0 })

  const pathRun = animate(
    { clipPath: 'path("M20 0 L220 0 L220 80 L20 80 Z")' },
    { duration: 0.15, ease: 'linear' },
  )

  ctx.assert('compatible path playback finishes', await pathRun, 'finished')
  await new Promise((resolve) => setTimeout(resolve, 80))
  ctx.assert(
    'serialized path is installed',
    target.style.clipPath.startsWith('path(nonzero,'),
    true,
  )

  inspectNative?.(ctx, target, 10)
  ctx.record('native geometry', { bound: bound.getActualSize(), target: target.getActualSize() })

  const retained = bound

  await ctx.mount(Empty)
  await new Promise((resolve) => setTimeout(resolve, 80))
  ctx.assert(
    'unmount releases owned clip',
    retained.style.clipPath === 'none' || retained.style.clipPath === '',
    true,
  )
}

function Empty() @{
  <masonview />
}
