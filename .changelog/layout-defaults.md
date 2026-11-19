### Predictable container layouts

**Breaking change**

General-purpose containers such as `View`, bare `Pressable`, and card bodies now place their children in normal block flow. Use `VStack`, `HStack`, or explicit flex or grid styles where you relied on an automatic layout.

Alignment and spacing props alone leave the layout in block mode.

```tsx
import { Pressable, Text, VStack } from '@octane-xplat/ui'

export function AccountChoice() {
  return (
    <Pressable onPress={() => {}}>
      <VStack gap={2}>
        <Text>Personal account</Text>
        <Text>Keep your own saved items.</Text>
      </VStack>
    </Pressable>
  )
}
```

See [container defaults](https://octane-xplat.goddardai.org/primitives#predictable-container-defaults) and [styling screens](https://octane-xplat.goddardai.org/styling).
