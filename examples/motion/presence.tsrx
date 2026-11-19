import { useState } from 'octane'
import { VStack, Text, Pressable } from '@octane-xplat/ui'
import { motion, Presence, MotionConfig } from '@octane-xplat/motion'

function CounterCard() @{
  // 1. Keep local state inside content that can animate out.
  const [count, setCount] = useState(0)

  <motion.View
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ duration: 0.25 }}
  >
    <Pressable onPress={() => setCount(count + 1)}>
      <Text>{`Count: ${count}`}</Text>
    </Pressable>
  </motion.View>
}

/** Toggle twice during exit: the same counter survives; a completed exit resets it. */
export function PresenceDemo() @{
  // 2. Toggle whether the card should remain present.
  const [present, setPresent] = useState(true)

  // 3. Retain the card through its exit and honor the user's motion preference.
  <MotionConfig reducedMotion="user">
    <VStack gap={3}>
      <Pressable onPress={() => setPresent(!present)}>
        <Text>Toggle card</Text>
      </Pressable>
      <Presence present={present}>
        <CounterCard />
      </Presence>
    </VStack>
  </MotionConfig>
}
