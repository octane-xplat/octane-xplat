/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './neutral-containers.css'
import { useState } from 'octane'
import { Card, FocusScope, Pressable, StackItem, View, VStack } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../../tools/probe/context'

type Kind = 'View' | 'Pressable' | 'FocusScope' | 'StackItem' | 'Card'
type Mode = 'default' | 'flex-class' | 'grid-class' | 'flex-style'
let selectMode: ((mode: Mode) => void) | undefined

function Children() {
  return (
    <>
      <View id="neutral-first" className="neutral-child" flexGrow={1} />
      <View id="neutral-second" className="neutral-child" flexGrow={1} />
    </>
  )
}

function Example(props: { kind: Kind }) {
  const [mode, setMode] = useState<Mode>('default')

  selectMode = setMode

  const className = [
    'neutral-host',
    {
      'neutral-flex-class': mode === 'flex-class',
      'neutral-grid-class': mode === 'grid-class',
    },
  ]

  const style: ViewProps['style'] =
    mode === 'flex-style' ? { display: 'flex', flexDirection: 'row' } : undefined

  return (
    <VStack width={320} height={240}>
      {props.kind === 'Card' ? (
        <Card className="neutral-card" padding={0}>
          <Children />
        </Card>
      ) : props.kind === 'Pressable' ? (
        <Pressable className={className} style={style}>
          <Children />
        </Pressable>
      ) : props.kind === 'FocusScope' ? (
        <FocusScope className={className} style={style}>
          <Children />
        </FocusScope>
      ) : props.kind === 'StackItem' ? (
        <StackItem className={className} style={style}>
          <Children />
        </StackItem>
      ) : (
        <View className={className} style={style}>
          <Children />
        </View>
      )}
    </VStack>
  )
}

export default Example

async function check(ctx: ProbeContext, kind: Kind, mode: Mode) {
  const first = await ctx.waitFor(
    () => {
      const a = ctx.inspect('neutral-first').frame
      const b = ctx.inspect('neutral-second').frame

      if (!a || !b) {
        return null
      }

      const expectedWidth = mode === 'default' ? 240 : 120

      if (Math.abs(a.width - expectedWidth) > 1) {
        ctx.record(`waiting ${kind} ${mode}`, { first: a, second: b, expectedWidth })
        return null
      }

      return a
    },
    { timeout: 8000 },
  )

  const second = ctx.inspect('neutral-second').frame!

  ctx.record(`${kind} ${mode}`, { first, second })
  ctx.assert(`${kind} ${mode} ignores flex growth on block axis`, Math.abs(first.height - 20) <= 1)
  if (mode === 'default') {
    const advance = ctx.target === 'macos' ? first.y - second.y : second.y - first.y

    ctx.assert(`${kind} block siblings flow vertically`, Math.abs(advance - 20) <= 1)
    ctx.assert(`${kind} block siblings share left edge`, Math.abs(second.x - first.x) <= 1)
  } else {
    ctx.assert(
      `${kind} ${mode} siblings flow horizontally`,
      Math.abs(second.x - first.x - 120) <= 1,
    )

    ctx.assert(`${kind} ${mode} siblings share top edge`, Math.abs(second.y - first.y) <= 1)
  }
}

export async function run(ctx: ProbeContext) {
  for (const kind of ['Card', 'View', 'Pressable', 'FocusScope', 'StackItem'] as const) {
    await ctx.mount(Example, { kind })
    await check(ctx, kind, 'default')
    if (kind === 'Card') {
      continue
    } // Card styles address the frame, not its body slot.

    for (const mode of [
      'flex-class',
      'default',
      'grid-class',
      'default',
      'flex-style',
      'default',
    ] as const) {
      selectMode!(mode)
      await check(ctx, kind, mode)
    }
  }
}
