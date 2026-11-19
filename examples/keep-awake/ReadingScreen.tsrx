/** @jsxImportSource @octane-xplat/jsx */
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

// 1. Mount this component only while the reading screen is open.
export function ReadingScreen() {
  // 2. Hold a keep-awake request until the screen unmounts.
  useKeepAwake()
  // 3. Show the reader's content while the request is active.
  return <Text>Your reading screen stays awake while it is open.</Text>
}
