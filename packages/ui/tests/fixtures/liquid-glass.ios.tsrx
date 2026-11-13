/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Application, ImageSource } from '@nativescript/core'
import { UIImage, UIImageSymbolConfiguration } from '@octane-xplat/platform/ios'
import { LiquidGlass } from '../../src/ios/LiquidGlass.ios.tsrx'
import { LiquidGlassContainer } from '../../src/ios/LiquidGlassContainer.ios.tsrx'
import type { ProbeContext } from '../../../../tools/probe/context'

type State = {
  width: number
  parentWidth: number
  icon: number
  iconSource: ImageSource | undefined
  autoImageSource: ImageSource | undefined
  text: string
  clip: boolean
  hidden: boolean
  mounted: boolean
  variant: 'regular' | 'clear'
}

let change: (state: State) => void
let defaultTaps = 0
let interactiveTaps = 0
let allowInput: (ready: boolean) => void
const initial: State = {
  width: 72,
  parentWidth: 200,
  icon: 24,
  iconSource: undefined,
  autoImageSource: undefined,
  text: 'Hi',
  clip: false,
  hidden: false,
  mounted: true,
  variant: 'regular',
}

Application.addCss(
  '.xplat-glass-probe-flex { display: flex; align-items: center; justify-content: center; }',
)

export default function Fixture() {
  const [state, setState] = useState(initial)
  const [ordinary, setOrdinary] = useState(0)
  const [interactive, setInteractive] = useState(0)
  const [ready, setReady] = useState(false)

  allowInput = setReady
  change = setState
  return (
    <masonview style={{ display: 'block', width: '100%', height: '100%', padding: 12 }}>
      @if (state.mounted) {
        <LiquidGlass
          id="glass-fixed"
          variant={state.variant}
          tint="#88aaff"
          animateChangeDuration={0}
          style={{
            width: state.width,
            height: 48,
            display: state.hidden ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            overflow: state.clip ? 'hidden' : 'visible',
          }}
        >
          <image
            id="glass-icon"
            src={state.iconSource}
            style={{ width: state.icon, height: state.icon }}
          />
        </LiquidGlass>
      }
      <LiquidGlass
        id="glass-intrinsic"
        style={{
          padding: 8,
          borderWidth: 2,
          borderColor: 'red',
          alignSelf: 'flex-start',
          width: 'max-content',
        }}
      >
        <label id="glass-text" text={state.text} />
      </LiquidGlass>
      <LiquidGlass id="glass-image-intrinsic" style={{ width: 'max-content', padding: 6 }}>
        <image id="glass-auto-image" src={state.autoImageSource} />
      </LiquidGlass>
      <LiquidGlass
        id="glass-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: 200,
          height: 60,
          padding: 8,
          borderWidth: 2,
          borderColor: 'red',
        }}
      >
        <label id="glass-grid-a" text="A" style={{ width: 20, height: 20 }} />
        <label id="glass-grid-b" text="B" style={{ width: 20, height: 20 }} />
        <label
          id="glass-absolute"
          text="X"
          style={{ position: 'absolute', right: 10, bottom: 10, width: 10, height: 10 }}
        />
      </LiquidGlass>
      <masonview style={{ display: 'block', width: state.parentWidth, height: 30 }}>
        <LiquidGlass
          id="glass-percent"
          style={{ width: '50%', minWidth: 80, maxWidth: 120, height: 24, marginLeft: 4 }}
        >
          <label text="Percent" style={{ width: 40, height: 12 }} />
        </LiquidGlass>
      </masonview>
      <LiquidGlass
        id="glass-class"
        className="xplat-glass-probe-flex"
        style={{ width: 72, height: 48 }}
      >
        <label id="glass-class-child" text="CSS" style={{ width: 24, height: 24 }} />
      </LiquidGlass>
      <LiquidGlass id="glass-block" style={{ width: 72, height: 24 }}>
        <label id="glass-block-a" text="A" style={{ width: 10, height: 10 }} />
        <label id="glass-block-b" text="B" style={{ width: 10, height: 10 }} />
      </LiquidGlass>
      @if (state.mounted) {
        <>
          <LiquidGlass
            id="glass-default-input"
            style={{
              display: 'flex',
              width: 240,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              id="glass-default-button"
              text={ready ? `Default glass child ${ordinary}` : 'Preparing default glass'}
              style={{ width: 210, height: 40 }}
              onTap={() => {
                defaultTaps++
                setOrdinary(defaultTaps)
              }}
            />
          </LiquidGlass>
          <LiquidGlass
            id="glass-interactive-input"
            interactive
            style={{
              display: 'flex',
              width: 240,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              id="glass-interactive-button"
              text={
                ready
                  ? `Interactive glass child ${interactive}`
                  : 'Preparing interactive glass'
              }
              style={{ width: 210, height: 40 }}
              onTap={() => {
                interactiveTaps++
                setInteractive(interactiveTaps)
              }}
            />
          </LiquidGlass>
        </>
      }
      <LiquidGlassContainer id="glass-group" spacing={12} style={{ width: 200, height: 60 }}>
        <LiquidGlass
          id="glass-group-child"
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            width: 72,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <label id="glass-group-label" text="Group" style={{ width: 40, height: 20 }} />
        </LiquidGlass>
      </LiquidGlassContainer>
    </masonview>
  )
}

function native(ctx: ProbeContext, id: string): any {
  const host: any = ctx.find(id)

  return host?.nativeViewProtected ?? host?.ios ?? host
}

function close(ctx: ProbeContext, name: string, actual: number, expected: number) {
  ctx.assert(name, Math.abs(actual - expected) < 0.75, true)
}

function centered(ctx: ProbeContext, id: string, child: string) {
  const box = native(ctx, id)
  const view = native(ctx, child)

  close(
    ctx,
    `${child} centered x`,
    view.frame.origin.x + view.frame.size.width / 2,
    box.bounds.size.width / 2,
  )

  close(
    ctx,
    `${child} centered y`,
    view.frame.origin.y + view.frame.size.height / 2,
    box.bounds.size.height / 2,
  )

  ctx.assert(`${child} UIKit content host`, view.superview === box.contentView, true)
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => native(ctx, 'glass-icon')?.frame.size.width === 24, { timeout: 10000 })
  centered(ctx, 'glass-fixed', 'glass-icon')

  const box = native(ctx, 'glass-fixed')
  const inputBox = native(ctx, 'glass-default-input')

  centered(ctx, 'glass-class', 'glass-class-child')
  ctx.assert('default display is block', Number(native(ctx, 'glass-block').style.display), 3)
  close(
    ctx,
    'block second child flows below first',
    native(ctx, 'glass-block-b').frame.origin.y,
    10,
  )

  close(ctx, 'percentage uses parent width', native(ctx, 'glass-percent').frame.size.width, 100)
  close(ctx, 'margin belongs to the outer box', native(ctx, 'glass-percent').frame.origin.x, 4)
  ctx.assert('one Mason node child', Number(box.node.getChildren().count), 1)
  ctx.assert('default glass effect is noninteractive', box.effect.interactive, false)
  close(ctx, 'material bounds follow box', box.frame.size.width, 72)

  ctx.assert('radius alone leaves children unclipped', Boolean(box.layer.mask), false)
  ctx.assert('visible overflow keeps native clipping disabled', box.clipsToBounds, false)
  await ctx.waitFor(() => Math.abs(box.effectiveRadiusForCorner(1) - 12) < 0.75)

  const previous = native(ctx, 'glass-intrinsic').frame.size.width
  const imageBefore = native(ctx, 'glass-image-intrinsic').frame.size.width

  change({
    ...initial,
    width: 144,
    icon: 32,
    text: 'Dynamic text inside glass',
    variant: 'clear',
    parentWidth: 300,
  })

  await ctx.waitFor(
    () =>
      native(ctx, 'glass-icon')?.frame.size.width === 32 &&
      native(ctx, 'glass-fixed')?.frame.size.width === 144,
  )

  centered(ctx, 'glass-fixed', 'glass-icon')
  await ctx.waitFor(() => native(ctx, 'glass-percent').frame.size.width === 120)
  change({ ...initial, width: 144, icon: 32, text: 'Dynamic text inside glass', parentWidth: 100 })
  await ctx.waitFor(() => native(ctx, 'glass-percent').frame.size.width === 80)
  await ctx.waitFor(() => native(ctx, 'glass-intrinsic').frame.size.width > previous)
  close(
    ctx,
    'intrinsic box counts insets once',
    native(ctx, 'glass-intrinsic').frame.size.width,
    native(ctx, 'glass-text').frame.size.width + 20,
  )

  const symbol = UIImage.systemImageNamed('star')?.imageWithConfiguration(
    UIImageSymbolConfiguration.configurationWithPointSize(24),
  )

  if (!symbol) {
    throw new Error('System image unavailable')
  }

  change({
    ...initial,
    width: 144,
    icon: 32,
    text: 'Dynamic text inside glass',
    parentWidth: 100,
    iconSource: new ImageSource(symbol),
    autoImageSource: new ImageSource(symbol),
  })

  await ctx.waitFor(
    () => Boolean(native(ctx, 'glass-icon')?.image && native(ctx, 'glass-auto-image')?.image),
    { timeout: 10000 },
  )
  ctx.assert('fixed glass child receives a decoded native image', Boolean(native(ctx, 'glass-icon').image), true)
  centered(ctx, 'glass-fixed', 'glass-icon')
  await ctx.waitFor(() => native(ctx, 'glass-image-intrinsic').frame.size.width > imageBefore)

  const imageSmall = native(ctx, 'glass-image-intrinsic').frame.size.width
  const largerSymbol = UIImage.systemImageNamed('star')?.imageWithConfiguration(
    UIImageSymbolConfiguration.configurationWithPointSize(48),
  )

  if (!largerSymbol) {
    throw new Error('Larger system image unavailable')
  }

  change({
    ...initial,
    width: 144,
    icon: 32,
    text: 'Dynamic text inside glass',
    parentWidth: 100,
    iconSource: new ImageSource(largerSymbol),
    autoImageSource: new ImageSource(largerSymbol),
  })
  await ctx.waitFor(() => native(ctx, 'glass-image-intrinsic').frame.size.width > imageSmall)
  close(
    ctx,
    'decoded image updates intrinsic glass width',
    native(ctx, 'glass-image-intrinsic').frame.size.width,
    native(ctx, 'glass-auto-image').frame.size.width + 12,
  )

  close(
    ctx,
    'decoded image updates intrinsic glass height',
    native(ctx, 'glass-image-intrinsic').frame.size.height,
    native(ctx, 'glass-auto-image').frame.size.height + 12,
  )

  close(ctx, 'grid first inset', native(ctx, 'glass-grid-a').frame.origin.x, 10)
  close(ctx, 'grid second track', native(ctx, 'glass-grid-b').frame.origin.x, 100)
  close(ctx, 'absolute right inset', native(ctx, 'glass-absolute').frame.origin.x, 178)
  centered(ctx, 'glass-group-child', 'glass-group-label')
  close(ctx, 'group child left placement', native(ctx, 'glass-group-child').frame.origin.x, 8)
  close(ctx, 'group child top placement', native(ctx, 'glass-group-child').frame.origin.y, 8)
  ctx.assert(
    'group keeps direct UIKit effect children',
    native(ctx, 'glass-group-child').superview === native(ctx, 'glass-group').contentView,
    true,
  )

  change({ ...initial, clip: true })
  await ctx.waitFor(() => native(ctx, 'glass-fixed').clipsToBounds)
  ctx.assert(
    'hidden overflow has rounded clip',
    Boolean(native(ctx, 'glass-fixed').layer.mask),
    true,
  )

  change(initial)
  await ctx.waitFor(() => !native(ctx, 'glass-fixed').clipsToBounds)
  ctx.assert('visible overflow clears clip', Boolean(native(ctx, 'glass-fixed').layer.mask), false)
  change({ ...initial, hidden: true })
  await ctx.waitFor(() => native(ctx, 'glass-fixed').hidden)
  change(initial)
  await ctx.waitFor(
    () => !native(ctx, 'glass-fixed').hidden && native(ctx, 'glass-icon').frame.size.width === 24,
  )

  centered(ctx, 'glass-fixed', 'glass-icon')
  change({ ...initial, mounted: false })
  await ctx.waitFor(() => !ctx.find('glass-fixed'))
  change(initial)
  await ctx.waitFor(() => native(ctx, 'glass-icon')?.frame.size.width === 24)
  centered(ctx, 'glass-fixed', 'glass-icon')
  ctx.assert('remount creates a new native box', native(ctx, 'glass-fixed') !== box, true)
  ctx.assert(
    'input surface remount creates a new native box',
    native(ctx, 'glass-default-input') !== inputBox,
    true,
  )

  ctx.record('geometry', {
    fixed: native(ctx, 'glass-fixed').frame,
    grid: native(ctx, 'glass-grid').frame,
    group: native(ctx, 'glass-group-child').frame,
  })

  allowInput(true)
  console.log('XPLAT_GLASS_OS_INPUT_READY')
  await ctx.waitFor(() => defaultTaps === 2 && interactiveTaps === 2, {
    timeout: 120000,
    interval: 100,
  })

  ctx.assert('default glass real child taps', defaultTaps, 2)
  ctx.assert('interactive glass real child taps', interactiveTaps, 2)
  ctx.record('input requirement', 'External HID touches; this case never dispatches handlers')
}
