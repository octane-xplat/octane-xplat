/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import './block-flow.css'
import { SafeArea, Text, VStack, View } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ProbeContext } from '../../../../../tools/probe/context'

// Engine prerequisite: explicit block flow must differ from a flex column.
// A flex-grow child keeps its authored height in block flow, while its auto
// width fills the containing block without a per-child width declaration.
let replaceChildren: ((items: string[]) => void) | undefined
let replaceText: ((text: string) => void) | undefined

export default function BlockFlow() {
  const [items, setItems] = useState(['a', 'b'])
  const [text, setText] = useState('Short')

  replaceChildren = setItems
  replaceText = setText
  return (
    <VStack width={320} height={800}>
      <SafeArea edges={[]} className="block-flow-host">
        <View id="block-first" className="block-flow-child" flexGrow={1} />
        <View id="block-second" className="block-flow-child" flexGrow={1} />
      </SafeArea>
      <View id="block-auto" className="block-flow-auto">
        @for (const item of items; key item) {
          <View id={`block-auto-${item}`} className="block-flow-margin-child" />
        }
      </View>
      <View className="block-flow-host">
        <View id="block-percentage" className="block-flow-percentage" />
      </View>
      {/* Flex items can gain a definite height after flexing. Keep the
          auto-height percentage container below a neutral block instead. */}
      <View className="block-flow-auto">
        <View id="block-indefinite-parent" className="block-flow-auto">
          <View id="block-indefinite-percentage" className="block-flow-indefinite-percentage">
            <View className="block-flow-child" />
          </View>
        </View>
      </View>
      <View id="block-text-parent" className="block-flow-text-parent">
        <Text id="block-changing-text">{text}</Text>
      </View>
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.mount(BlockFlow)
  await ctx.waitFor(() => (ctx.inspect('block-second').frame?.height ?? 0) > 0)

  const first = ctx.inspect('block-first').frame!
  const second = ctx.inspect('block-second').frame!

  ctx.record('block flow', { first, second })
  ctx.assert('block ignores child flex-grow', Math.abs(first.height - 20) <= 1)
  ctx.assert('block retains second child height', Math.abs(second.height - 20) <= 1)
  ctx.assert('auto width fills block', Math.abs(first.width - 240) <= 1)
  ctx.assert('block siblings share left edge', Math.abs(first.x - second.x) <= 1)

  // The AppKit probe exposes superview-local frames with a bottom-left
  // origin; the browser/mobile adapters expose screen-space top-left frames.
  const advance = ctx.target === 'macos' ? first.y - second.y : second.y - first.y

  ctx.assert('block siblings flow vertically', Math.abs(advance - 20) <= 1)

  await ctx.waitFor(() => Math.abs((ctx.inspect('block-auto').frame?.height ?? 0) - 40) <= 1)
  ctx.assert(
    'block auto height follows its children',
    Math.abs(ctx.inspect('block-auto').frame!.height - 40) <= 1,
  )

  ctx.assert(
    'block auto width accounts for horizontal margins',
    Math.abs(ctx.inspect('block-auto-a').frame!.width - 220) <= 1,
  )

  const percentage = ctx.inspect('block-percentage').frame!

  ctx.assert('percentage width uses the containing block', Math.abs(percentage.width - 120) <= 1)
  ctx.assert(
    'percentage height uses a definite containing block',
    Math.abs(percentage.height - 30) <= 1,
  )

  const retained = ctx.find('block-auto-a')

  replaceChildren!(['b', 'c', 'a'])
  await ctx.waitFor(
    () => {
      ctx.record('block insertion', {
        host: ctx.inspect('block-auto'),
        children: ['a', 'b', 'c'].map((id) =>
          ctx.find(`block-auto-${id}`) ? ctx.inspect(`block-auto-${id}`) : null,
        ),
      })

      return (
        ctx.find('block-auto-c') &&
        Math.abs((ctx.inspect('block-auto').frame?.height ?? 0) - 60) <= 1
      )
    },
    { timeout: 5000 },
  )

  const b = ctx.inspect('block-auto-b').frame!
  const c = ctx.inspect('block-auto-c').frame!
  const a = ctx.inspect('block-auto-a').frame!
  const direction = ctx.target === 'macos' ? -1 : 1

  ctx.assert(
    'block insertion recomputes auto height',
    Math.abs(ctx.inspect('block-auto').frame!.height - 60) <= 1,
  )

  ctx.assert(
    'keyed block children reorder in normal flow',
    Math.abs(direction * (c.y - b.y) - 20) <= 1 && Math.abs(direction * (a.y - c.y) - 20) <= 1,
  )

  ctx.assert('keyed block reorder retains the child host', ctx.find('block-auto-a') === retained)
  replaceChildren!(['c'])
  await ctx.waitFor(
    () =>
      !ctx.find('block-auto-a') &&
      Math.abs((ctx.inspect('block-auto').frame?.height ?? 0) - 20) <= 1,
    { timeout: 5000 },
  )

  ctx.assert(
    'block removal recomputes auto height',
    Math.abs(ctx.inspect('block-auto').frame!.height - 20) <= 1,
  )

  ctx.assert('removed block hosts detach', !ctx.find('block-auto-a') && !ctx.find('block-auto-b'))

  await ctx.waitFor(() => (ctx.inspect('block-indefinite-percentage').frame?.height ?? 0) > 0)

  const indefinite = ctx.inspect('block-indefinite-percentage').frame!
  const autoParent = ctx.inspect('block-indefinite-parent').frame!

  ctx.record('indefinite percentage', { child: indefinite, parent: autoParent })
  ctx.assert(
    'percentage width resolves inside an auto-height block',
    Math.abs(indefinite.width - 120) <= 1,
  )

  ctx.assert(
    'indefinite percentage height follows intrinsic content',
    Math.abs(indefinite.height - 20) <= 1,
  )

  ctx.assert(
    'indefinite percentage child determines parent height',
    Math.abs(autoParent.height - 20) <= 1,
  )

  await ctx.waitFor(() => (ctx.inspect('block-text-parent').frame?.height ?? 0) > 0)

  const initialHeight = ctx.inspect('block-text-parent').frame!.height
  const textHost = ctx.find('block-changing-text')

  replaceText!(
    'This longer text must wrap within its block. Updating the existing text host must also resize its parent. The same layout should shrink again when the text becomes short.',
  )

  await ctx.waitFor(
    () => {
      ctx.record('changing text', {
        parent: ctx.inspect('block-text-parent'),
        text: ctx.inspect('block-changing-text'),
      })

      return ctx.inspect('block-text-parent').frame!.height > initialHeight * 2
    },
    { timeout: 5000 },
  )

  ctx.assert(
    'text updates resize an auto-height block',
    ctx.inspect('block-text-parent').frame!.height > initialHeight * 2,
  )

  const updatedText = ctx.inspect('block-changing-text')
  // NSTextField's optical frame extends beyond its allocated alignment rect.
  const textAllocation = ctx.target === 'macos' ? updatedText.alignmentRect! : updatedText.frame!

  ctx.assert('updated text wraps within its block', textAllocation.width <= 181)

  ctx.assert('text updates retain the text host', ctx.find('block-changing-text') === textHost)
  replaceText!('Short')
  await ctx.waitFor(
    () => Math.abs(ctx.inspect('block-text-parent').frame!.height - initialHeight) <= 1,
    { timeout: 5000 },
  )

  ctx.assert(
    'shorter text shrinks its block again',
    Math.abs(ctx.inspect('block-text-parent').frame!.height - initialHeight) <= 1,
  )
}
