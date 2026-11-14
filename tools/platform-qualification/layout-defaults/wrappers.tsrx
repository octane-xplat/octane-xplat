/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './wrappers.css'
import { useEffect, useState } from 'octane'
import { View, VStack } from '@octane-xplat/ui'
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { ViewShot } from '@octane-xplat/view-shot'
import type { ProbeContext } from '../../probe/context'

type Kind = 'SmoothCorners' | 'ViewShot'
type Mode = 'block' | 'flex' | 'grid' | 'style'
let select: ((mode: Mode) => void) | undefined

function Children() {
  return (
    <>
      <View id="wrapper-first" className="layout-wrapper-child" flexGrow={1} />
      <View id="wrapper-second" className="layout-wrapper-child" flexGrow={1} />
    </>
  )
}

export default function Example(props: { kind: Kind }) {
  const [mode, setMode] = useState<Mode>('block')

  useEffect(() => {
    select = setMode
    return () => {
      if (select === setMode) {
        select = undefined
      }
    }
  }, [])

  const className = ['layout-wrapper', mode !== 'block' && `layout-wrapper-${mode}`]
  const style = mode === 'style' ? { display: 'flex', flexDirection: 'row' } : undefined

  return (
    <VStack width={320} height={240}>
      {props.kind === 'SmoothCorners' ? (
        <SmoothCorners corners={{ radius: 12 }} className={className} style={style}>
          <Children />
        </SmoothCorners>
      ) : (
        // Manual mode only: there is no captureMode, ref.capture or captureRef call.
        <ViewShot className={className} style={style}>
          <Children />
        </ViewShot>
      )}
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  for (const kind of ['SmoothCorners', 'ViewShot'] as const) {
    await ctx.mount(Example, { kind })
    await ctx.waitFor(() => (ctx.inspect('wrapper-first').frame?.height ?? 0) > 0)

    const original = ctx.find('wrapper-first')

    for (const mode of ['block', 'flex', 'block', 'grid', 'block', 'style', 'block'] as const) {
      select!(mode)

      const width = mode === 'block' ? 240 : 120

      await ctx.waitFor(() => {
        const first = ctx.inspect('wrapper-first').frame
        const second = ctx.inspect('wrapper-second').frame

        ctx.record(`waiting ${kind} ${mode}`, { first, second, width })
        return Math.abs((first?.width ?? 0) - width) <= 1
      })

      const first = ctx.inspect('wrapper-first').frame!
      const second = ctx.inspect('wrapper-second').frame!

      ctx.record(`${kind} ${mode}`, { first, second })
      ctx.assert(`${kind} ${mode} preserves intrinsic height`, Math.abs(first.height - 20) <= 1)
      ctx.assert(`${kind} ${mode} retains child host`, ctx.find('wrapper-first') === original)
      if (mode === 'block') {
        const advance = ctx.target === 'macos' ? first.y - second.y : second.y - first.y

        ctx.assert(`${kind} block flow`, Math.abs(advance - 20) <= 1)
      } else {
        ctx.assert(`${kind} ${mode} row flow`, Math.abs(second.x - first.x - 120) <= 1)
      }
    }
  }
}
