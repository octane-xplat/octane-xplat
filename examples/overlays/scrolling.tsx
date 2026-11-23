import { ScrollableArea, Text } from '@octane-xplat/ui'

// 1. Bound a named scrollable area so longer content has a viewport.
export function Details({ height }: { height: number }) {
  return (
    <ScrollableArea label="Trip details" style={{ height }}>
      <Text>{'Two bags packed.\n'.repeat(12)}</Text>
    </ScrollableArea>
  )
}
