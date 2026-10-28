### Use icons on GTK

GTK screens can use Icon with the framework glyphs, custom icon registries,
and scoped IconRegistryProvider sets. SVG sources load through the GTK host,
including files and URLs, without browser globals.

```tsx
import { Icon } from '@octane-xplat/ui'

export function SearchIcon() {
  return <Icon name="xplat-search" size={20} accessibilityLabel="Search" />
}
```

[GTK setup and source requirements](https://octane-xplat.goddardai.org/platform/linux-gtk)
