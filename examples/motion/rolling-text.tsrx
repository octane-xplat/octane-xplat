import { useState } from 'octane'
import { HStack, Pressable, Text, VStack } from '@octane-xplat/ui'
import { RollingText } from '@octane-xplat/rolling-text'

/** Smallest useful harness: a counter whose label rolls per grapheme. */
export function RollingTextDemo() {
  // 1. Keep the value that will be displayed and changed by the buttons.
  const [count, setCount] = useState(9)

  // 2. Update the counter and pass its latest formatted value to RollingText.
  return (
    <VStack padding={4} gap={2}>
      <HStack gap={2}>
        <Pressable onPress={() => setCount((c: number) => Math.max(0, c - 1))}>
          <Text>−1</Text>
        </Pressable>
        <Pressable onPress={() => setCount((c: number) => c + 1)}>
          <Text>+1</Text>
        </Pressable>
      </HStack>
      {/* 3. Configure the animation and expose the current value to assistive technology. */}
      <RollingText
        value={`${count} seconds`}
        style={{ height: 24, fontSize: 16 }}
        rollBy="grapheme"
        direction="up"
        updatePolicy="latest"
        transition={{ duration: 0.25 }}
        reducedMotion="user"
        accessibilityLabel={`${count} seconds`}
      />
    </VStack>
  )
}
