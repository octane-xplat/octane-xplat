### Predictable container layouts

**Breaking change:** General-purpose containers use block flow across the framework. `View`, bare `Pressable`, card and notice bodies, quotations, item bodies, metadata values, hover-card bodies, focus and safe-area wrappers, scroll/list content, and decorative/effect content hosts no longer implicitly arrange caller children with flex or grid. Named layouts, structured controls, and intentionally inline components keep their own arrangements.

Use an explicit stack where an existing screen relied on an implicit flex column. Alignment and spacing props alone do not select a layout mode; an explicit class or style can still select flex or grid, and removing it restores the default.

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
