# iOS Icon selector and modifier

Current exports: `Icon`, `modifier`.

**Design: Use lowercase helper names for icon selection and explicit native modifiers.**

Icon here is an object with select(), whereas root Icon is a JSX component. Prefer selectSystemIcon or systemIcon so the import predicts its shape. Keep modifier.nativeProperty as an explicitly unsafe escape hatch, but type known style properties instead of making every modifier an arbitrary property bag.

Proposed shape (illustrative):

```ts
type ProposedSystemIconChoice = {
	ios: string
	android: string
}
type ProposedSelectSystemIcon = (choice: ProposedSystemIconChoice) => string
```

Evidence: [src/ios/icon.ios.ts:1](../../../packages/ui/src/ios/icon.ios.ts#L1), [src/modifier-factories.ts:8](../../../packages/ui/src/modifier-factories.ts#L8).

[Audit index](../README.md)
