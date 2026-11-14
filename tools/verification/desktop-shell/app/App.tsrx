import 'octane/signals'
import { useStore } from '@octane-xplat/ui/data'
import { Button } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { TextInput } from '@octane-xplat/ui'
import { VStack } from '@octane-xplat/ui'
import { name$, statusText, submitName, menuCount$, lastError$, statusSuffix$ } from './journey'

export default function App() {
  const name = useStore(name$)
  const count = useStore(menuCount$)
  const lastError = useStore(lastError$)
  const suffix = useStore(statusSuffix$)

  return (
    <VStack padding={4} gap={2}>
      <TextInput
        testID="journey-name"
        placeholder="Type a name"
        style={{ width: 320 }}
        value={name}
        onChange={(value: string) => name$.set(value)}
      />
      <Button testID="journey-submit" clickAction={() => submitName(name)}>
        Submit
      </Button>
      <Text testID="journey-status">{statusText() + suffix}</Text>
      <Text testID="journey-count">Count: {count}</Text>
      <Text testID="journey-error">{lastError}</Text>
    </VStack>
  )
}
