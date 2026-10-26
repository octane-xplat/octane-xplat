### Layout, LayoutHeader, and LayoutContent land from Astryx

`@octane-xplat/ui` now ships Astryx's five-slot region primitive: `Layout`
arranges `header`, `start`, `content`, `end`, and `footer` slots;
`LayoutHeader` adds a padded header band with an optional `hasDivider`
hairline; `LayoutContent` is the scrollable main region. `padding` on the
layout sets the outer-edge padding regions read as their boundary defaults,
and `contentWidth` constrains the aligned content lane.

```tsx
<Layout
	header={
		<LayoutHeader hasDivider padding={6}>
			<Heading level={1}>Page title</Heading>
		</LayoutHeader>
	}
	content={<LayoutContent padding={6}>{body}</LayoutContent>}
/>
```

Padded hosts now publish the Astryx `--container-padding-*` custom
properties so full-bleed children (TabList `isFullBleed`, `Section`,
`ListItem edgeCompensation`) can escape to the container edge — previously
internal `--vx-container-padding-*` reads moved to the upstream names.

[Components](https://octane-xplat.dev/app/components/)
