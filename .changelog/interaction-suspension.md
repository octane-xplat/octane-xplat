### Pause input in part of a screen

Attach a `useInteractionScope$` scope to a view and call `suspend()` to cancel gestures and pause supported input inside it. Each caller releases its own lock. Input resumes when the last lock is released. iOS supports eligible native subtrees, including scrolling. Web can pause input in non-scrolling subtrees. Check the result before relying on suspension.

```tsx
import { useRef } from 'octane'
import { Button, Text, View, useInteractionScope$ } from '@octane-xplat/ui'
import type { Suspension } from '@octane-xplat/ui'

export function PausablePanel() {
  const scope = useInteractionScope$()
  const lock = useRef<Suspension | null>(null)
  return (
    <View>
      <Button label="Pause input" onPress={() => {
        if (lock.current) return
        const result = scope.suspend()
        if (result.ok) lock.current = result.lease
      }} />
      <Button label="Resume input" onPress={() => {
        lock.current?.release()
        lock.current = null
      }} />
      <View interactionScope={scope}><Text>Panel content</Text></View>
    </View>
  )
}
```

[Interaction scopes and platform limits](https://octane-xplat.goddardai.org/gestures#suspend-a-scope-without-changing-overflow)
