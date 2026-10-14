# Stack, HStack, VStack, and StackItem

Current exports: `Stack`, `HStack`, `VStack`, `StackItem`.

**Design: Use one alignment model and make spacing units explicit.**

Stack offers hAlign/vAlign alongside justify/align, with broadly overlapping value unions. Prefer justifyContent and alignItems for the main and cross axes; keep HStack/VStack as convenient presets. gap=2 currently means eight dips, while other components use two dips. Use numbers for layout units and a separate token spelling.

Proposed shape (illustrative):

```ts
type ProposedStackProps = {
	direction?: 'row' | 'column'
	justifyContent?: 'start' | 'center' | 'end' | 'space-between'
	alignItems?: 'start' | 'center' | 'end' | 'stretch'
	gap?: number | { spacingToken: string }
}
```

**Design: Replace StackItem size and crossAlignSelf with familiar flex properties.**

size="fill" is not a size, and crossAlignSelf introduces a new name for alignSelf. Exposing flexGrow, flexShrink, flexBasis, and alignSelf lets an agent reuse its flexbox model. Keep scroll ownership on the scroll component so nesting does not require learning two scrolling APIs.

Proposed shape (illustrative):

```ts
type ProposedStackItemProps = {
	flexGrow?: number
	flexShrink?: number
	flexBasis?: number | 'auto'
	alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch'
}
```

Evidence: [src/props.ts:120](../../../../packages/ui/src/props.ts#L120), [src/props.ts:169](../../../../packages/ui/src/props.ts#L169), [src/props.ts:200](../../../../packages/ui/src/props.ts#L200).

[Audit index](../../README.md)
