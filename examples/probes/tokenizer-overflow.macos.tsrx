/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, TextInput, Tokenizer, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem, TokenizerOverflowBehavior } from '@octane-xplat/ui'
import type { ProbeContext } from '../../tools/probe/context'

const people = [
  { id: 'ada', label: 'Ada Lovelace' },
  { id: 'grace', label: 'Grace Hopper' },
  { id: 'alan', label: 'Alan Turing with a longer token' },
]

const source = createStaticSource(people)

export default function TokenizerOverflowProbe() {
  const [tags, setTags] = useState<SearchableItem[]>(people),
    [width, setWidth] = useState(240),
    [mode, setMode] = useState<TokenizerOverflowBehavior>('unfocusedInline')

  return (
    <VStack gap={2}>
      <Text>
        Check narrow/wide counts, partial tokens, focus expansion and leaving through Apply. Widen
        until every token fits: the count should disappear without reserving its own space. Compare
        inline/layer/none, reorder/reset, custom fonts and RTL context. The current AppKit token
        layer is inline; actual native drawing, sizing, focus, hit-testing and accessibility remain
        unqualified.
      </Text>
      <TextInput label="Before tags" />
      <Tokenizer
        id="tokenizer-overflow-preview"
        label="People"
        width={width}
        value={tags}
        onChange={setTags}
        searchSource={source}
        tokenOverflowBehavior={mode}
        hasClear
        endContent={<Button label="Apply" onPress={() => {}} />}
      />
      <TextInput label="After tags" />
      <Button label="Narrow" onPress={() => setWidth(180)} />
      <Button label="Wide" onPress={() => setWidth(640)} />
      <Button label="Inline" onPress={() => setMode('unfocusedInline')} />
      <Button label="Layer" onPress={() => setMode('unfocusedLayer')} />
      <Button label="Wrap" onPress={() => setMode('none')} />
      <Button label="Restore" onPress={() => setTags(people)} />
      <Button label="Reverse" onPress={() => setTags([...tags].reverse())} />
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => ctx.find('tokenizer-overflow-preview'))
  ctx.record(
    'qualification',
    'mounted only; native drawing/resize/fonts/RTL/focus/IME/hit-testing/AX and packaging remain unqualified',
  )
}
