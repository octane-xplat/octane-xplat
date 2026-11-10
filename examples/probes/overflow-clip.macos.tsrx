/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../tools/probe/context'

export default function OverflowClipProbe() {
  const [mode, setMode] = useState<'hidden' | 'clip' | 'visible' | undefined>('hidden'),
    [presses, setPresses] = useState(0)

  return (
    <VStack gap={2}>
      <Text>
        Compare hidden, clip, visible and removed overflow. The inner content is wider than its
        parent. Check drawing, outside hit-testing, accessibility, and resizing with and without
        rounded corners. These checks require native qualification; the runner only records
        mounting.
      </Text>
      <masonview
        id="overflow-clip-preview"
        style={{ display: 'flex', width: 160, height: 48, overflow: mode }}
      >
        <masonview
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexShrink: 0,
            width: 280,
            height: 48,
            backgroundColor: '#68a',
          }}
        >
          <Text>Wide content</Text>
          <Button label="Outside action" onPress={() => setPresses(presses + 1)} />
        </masonview>
      </masonview>
      <Button label="Hidden" onPress={() => setMode('hidden')} />
      <Button label="Clip" onPress={() => setMode('clip')} />
      <Button label="Visible" onPress={() => setMode('visible')} />
      <Button label="Remove style" onPress={() => setMode(undefined)} />
      <Text>
        Mode: {mode ?? 'native default'}; presses: {presses}
      </Text>
    </VStack>
  )
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => ctx.find('overflow-clip-preview'))
  ctx.record(
    'qualification',
    'mounted only; native drawing/hit-testing/AX/shadow/resize and packaging remain unqualified',
  )
}
