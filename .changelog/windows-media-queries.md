### Add Windows input-aware media-query candidates

The experimental Windows `useMediaQuery` leaf samples pointer, hover and
animation preferences instead of assuming a touch-only device. Hybrid devices
can match both `any-pointer` accuracies. The existing streaming-text hook can
observe the Windows reduced-motion preference through this leaf.

```tsx
import { useMediaQuery } from '@octane-xplat/ui'

export function useCompactTouchLayout() {
  return useMediaQuery('(max-width: 1024px) and (pointer: coarse) and (hover: none)')
}
```

Actual NativeScript hook execution and WinRT projection remain unverified;
live device/settings changes and secondary-window behavior are unqualified.
[Windows media-query boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#media-query-candidate)
