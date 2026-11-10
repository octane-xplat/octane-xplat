/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, Pressable, Text, usePanGesture$ } from '@octane-xplat/ui'

export function SharedGestures(props: { report(kind: string, detail?: unknown): void }) {
  const [x, setX] = useState(0)
  const pan = usePanGesture$({
    axis: 'x',
    onStart() {
      props.report('start')
    },
    onUpdate(sample) {
      setX(sample.translation.x)
      props.report('move', sample.translation)
    },
    onFinalize(terminal) {
      props.report('finish', terminal.outcome)
    },
  })

  return (
    <View
      id="shared-panel"
      gestures={pan}
      style={{ width: 400, height: 260, transform: `translateX(${x}px)` }}
    >
      <Pressable
        id="shared-button"
        onPress={(event) => props.report('press', event.source)}
        style={{ width: 200, height: 120 }}
      >
        <Text>Shared owner</Text>
      </Pressable>
    </View>
  )
}
