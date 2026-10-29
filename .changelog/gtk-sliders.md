### Adjust values and ranges on GTK

Slider is available from the GTK UI root, with local or controlled values,
keyboard and pointer input, range thumbs, marks and formatted readouts.

```tsx
import { Slider } from '@octane-xplat/ui'

export function Volume() {
  return <Slider label="Volume" width={280} min={0} max={100}
    defaultValue={25} step={5} valueDisplay="tooltip" />
}
```

[Linux GTK sliders](https://octane-xplat.goddardai.org/linux-gtk#sliders)
