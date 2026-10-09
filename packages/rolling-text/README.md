# @octane-xplat/rolling-text

A single-line label whose text **rolls** when its value changes — like a
departure-board or slot-machine counter. Characters that stay the same keep
their place; only the changed ones roll out and in. Works on web, iOS and
Android.

```tsx
import { RollingText } from '@octane-xplat/rolling-text'

function CartBadge({ count }: { count: number }) {
	return (
		<RollingText
			value={`${count} items`}
			transition={{ duration: 0.25 }}
			accessibilityLabel={`${count} items in your cart`}
		/>
	)
}
```

`value` is an already-formatted string — RollingText never formats for you.
Mount shows the initial value instantly; equal values do nothing.

## Options

| Prop            | Values                              | Default             | What it does                                                                                |
| --------------- | ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `rollBy`        | `'grapheme'` \| `'word'`            | `'grapheme'`        | Roll per character or per word. Word mode keeps joined scripts and kerning whole.           |
| `direction`     | `'up'` \| `'down'`                  | `'up'`              | Which way the old text rolls out.                                                           |
| `updatePolicy`  | `'interrupt'` \| `'latest'`         | `'interrupt'`       | Mid-roll update handling: snap and restart, or finish the run and roll to the newest value. |
| `transition`    | `{ duration, delay }`               | `{ duration: 0.3 }` | Per-cell timing in seconds (same convention as `@octane-xplat/motion`).                     |
| `reducedMotion` | `'user'` \| `'always'` \| `'never'` | `'user'`            | `'user'` follows the system reduce-motion setting live and settles text instantly.          |

The label also accepts `className`, `style`, `id`, `testID`,
`accessibilityLabel`, `accessibilityLiveRegion`, layout-child props
(`flexGrow`, `row`, `dock`, …) and `ios`/`android`/`web` escape bags, applied
to the container.

## What screen readers hear

The whole current value is the accessible name — it updates immediately, even
while a roll is queued or reduced. The animated glyphs are hidden from the
accessibility tree, so there is never a mix of old and new text. Pass
`accessibilityLiveRegion="polite"` if a change should be announced.

## Limits

- **One line.** The row clips to a single line; long values overflow rather
  than wrap.
- **Fonts:** keep cells on one font/size per label — a mid-roll font change
  can offset the roll distance by a frame.
- **Runtimes without `Intl.Segmenter`** (older JSC): ASCII values still roll
  per character; anything else rolls as one whole label rather than splitting
  emoji or accented characters mid-cluster.
- **Very long values** (over 256 units) roll as one whole label.
- Roll distance is read from the row's current height — the first update
  before initial layout falls back to a fade.
- macOS/Windows/Linux leaves are not implemented yet — the package exports
  web and native targets only.

Derived from Scritto's survivor matching and slot-text's update policy — see
[UPSTREAM.md](./UPSTREAM.md) for provenance and licenses.
