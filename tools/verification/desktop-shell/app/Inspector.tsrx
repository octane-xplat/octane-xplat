import { Text } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { View } from '@octane-xplat/ui'
import { closeInspector } from './journey'

export default function Inspector() {
  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text testID="inspector-title">Inspector</Text>
      <Button testID="inspector-close" clickAction={closeInspector}>
        Close
      </Button>
    </View>
  )
}
