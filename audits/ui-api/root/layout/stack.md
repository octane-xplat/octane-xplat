# Stack, HStack, VStack, and StackItem

Current exports: `Stack`, `HStack`, `VStack`, `StackItem`.

**Design: Use one alignment model and make spacing units explicit.**

Stack offers hAlign/vAlign alongside justify/align, with broadly overlapping value unions. Choose one alignment vocabulary through D6 rather than automatically replacing Astryx hAlign/vAlign with CSS names; keep HStack/VStack as convenient presets. gap=2 currently means eight dips, while other components use two dips. Use numbers for layout units and a separate token spelling.

Proposed shape (illustrative):

```ts
type ProposedStackProps = {
	direction?: 'row' | 'column'
	justifyContent?: 'start' | 'center' | 'end' | 'space-between'
	alignItems?: 'start' | 'center' | 'end' | 'stretch'
	gap?: number | { spacingToken: string }
}
```

**Design: Give StackItem size and alignment precise meanings under the preferred vocabulary.**

Clarify whether size="fill" controls dimensions or flex growth, and constrain alignment to supported choices. Prefer Astryx terminology where comparable; CSS flex names are fallback candidates, not automatically approved replacements. Keep scroll ownership on the scroll component so nesting does not require learning two scrolling APIs.

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
