import { Text } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { VStack } from '@octane-xplat/ui'
import { closeInspector } from './journey'

export default function Inspector() {
  return (
    <VStack padding={4} gap={2}>
      <Text testID="inspector-title">Inspector</Text>
      <Button testID="inspector-close" clickAction={closeInspector}>
        Close
      </Button>
    </VStack>
  )
}
