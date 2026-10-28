### AppKit overflow-tab keyboard source support

TabMenu now joins its tab strip's focus order and opens first/last options with
Down/Up. The popup reuses menu focus, typeahead, selection and Tab-return intent;
empty overflow lists disable the trigger. Parent selection remains authoritative.

```tsx
import { TabList, Tab, TabMenu } from '@octane-xplat/ui'

export function Sections(props: { value: string; change(value: string): void }) {
	return <TabList role="tablist" value={props.value} onChange={props.change}>
		<Tab value="overview" label="Overview" />
		<TabMenu label="More" options={[{ value: 'settings', label: 'Settings' }]} />
	</TabList>
}
```

Native keys/ref/focus/return, accessibility and packaging remain unqualified.
Focused-row repair source ownership is also present; native delivery remains unqualified. See [AppKit overflow tabs](https://octane-xplat.goddardai.org/app/components#overflow-tabs-on-appkit).
