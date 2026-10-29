### Keep ratings in one labelled field

Shared native and web ratings now own their field label and width. Only the
chosen score is marked checked, while the preceding glyphs stay filled.
Named scores use grouped keyboard input, and duplicate selections stay quiet.

```tsx
import { InputRating } from '@octane-xplat/ui'

export function TripRating() {
  return <InputRating label="Trip rating" width={280} defaultValue={3} icon="☆" />
}
```

[Rating fields](https://octane-xplat.goddardai.org/linux-gtk#ratings)
