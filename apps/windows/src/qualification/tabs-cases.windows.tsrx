/** @jsxImportSource @octane-xplat/jsx */
import { useLinkedState } from 'octane'
import { Button, Tab, TabList, Text, View } from '@octane-xplat/ui'

/** Keep the actual TabList/Tab composition for native peer inspection. The
 * parent owns selection; commands only replace props or mount state. */
export function TabCases(props: {
	revision: number
	disabled: boolean
	onActivate: (source: string, fixtureRevision?: number) => void
}): unknown @{
	const [selected, setSelected] = useLinkedState(props.revision, (): string =>
		props.revision === 1 ? 'third' : 'first',
	)

	<View className="core20-viewport">
		<Button label="Before tabs" clickAction={() => props.onActivate('tabs-before')} />
		<TabList
			id="core20-tab-list"
			role="tablist"
			layout="fill"
			value={selected}
			onChange={(next) => {
				props.onActivate(`tab-selection:${next}`, props.revision)
				if (props.revision !== 2) {
					setSelected(next)
				}
			}}
		>
			<Tab
				id="core20-tab-first"
				value="first"
				label={`First ${props.revision}`}
				panelId="core20-tab-panel-first"
			/>
			<Tab id="core20-tab-disabled" value="disabled" label="Unavailable" isDisabled />
			<Tab
				id="core20-tab-third"
				value="third"
				label={`Third ${props.revision}`}
				panelId="core20-tab-panel-third"
				isDisabled={props.disabled}
			/>
		</TabList>
		<Text id="core20-tabs-state">{`Tabs selected ${selected}`}</Text>
		<Text
			id={`core20-tab-panel-${selected}`}
		>{`Panel ${selected} revision ${props.revision}`}</Text>
		<Button label="After tabs" clickAction={() => props.onActivate('tabs-after')} />
	</View>
}
