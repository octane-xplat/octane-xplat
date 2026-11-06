### Restore platform leaves for explicit `.tsrx` imports on native

On native targets, an unsuffixed import written with its extension —
`import { Card } from './Card.tsrx'`, the spelling the TSRX contract requires —
resolved the literal shared file and skipped `Card.windows.tsrx`,
`Card.ios.tsrx` and `Card.mobile.tsrx`. Windows apps lost every Pressable-based
accessibility peer (Button, Link, ListItem rows, Tab, Selector and menu
triggers had no focus, Invoke or accessible name for UI Automation), and
iOS/Android bundles missed `.mobile` variants such as Tooltip and HoverCard.
The native preset again treats the authored extension as the contract name and
probes the platform chain on its stem, matching
[platform files](https://octane-xplat.goddardai.org/module-resolution).

```ts
import { Card } from './Card.tsrx'
// The Windows build selects Card.windows.tsrx; the checker reads Card.tsrx.
```
