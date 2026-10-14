# Android Icon selector and modifier

Current exports: `Icon`, `modifier`.

**Design: Name the icon helper selectDrawableIcon and keep native modifiers explicit.**

The capitalized Icon.select object is easy to mistake for the root Icon component. A lowercase OS-specific helper exposes the actual operation and resource format. Share typed modifier construction with iOS, but keep arbitrary nativeProperty writes visibly outside the portable UI contract.

Proposed shape (illustrative):

```ts
type ProposedSelectDrawableIcon = (name: string) => string
```

Evidence: [src/android/icon.android.ts:1](../../../packages/ui/src/android/icon.android.ts#L1), [src/modifier-factories.ts:8](../../../packages/ui/src/modifier-factories.ts#L8).

[Audit index](../README.md)
