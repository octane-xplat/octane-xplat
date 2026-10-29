### Rate items on GTK

InputRating is available from the GTK UI root, with local or controlled scores,
grouped keyboard/pointer input, field state and text or registered glyphs.

```tsx
import { InputRating } from '@octane-xplat/ui'

export function TripRating() {
  return <InputRating label="Trip rating" width={280} max={5} defaultValue={3} />
}
```

[Linux GTK ratings](https://octane-xplat.goddardai.org/linux-gtk#ratings)
