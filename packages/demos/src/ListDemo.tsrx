import { useState } from 'octane';
import { FieldGroup, Item, List, ListItem, Pressable, HStack, ScrollableArea, Text, View } from '@octane-xplat/ui';

type DemoRow = {
	id: string;
	kind: 'event' | 'notice';
	title: string;
	detail: string;
};

const INITIAL_ROWS: DemoRow[] = [
	{ id: 'event-1', kind: 'event', title: 'Doors open', detail: '6:30 PM' },
	{ id: 'notice-1', kind: 'notice', title: 'Welcome', detail: 'The List demo is ready.' },
	{ id: 'event-2', kind: 'event', title: 'Opening set', detail: '7:00 PM' },
	{ id: 'event-3', kind: 'event', title: 'Main set', detail: '8:15 PM' },
	{ id: 'notice-2', kind: 'notice', title: 'Water station', detail: 'Available by the entrance.' },
	{ id: 'event-4', kind: 'event', title: 'Encore', detail: '9:30 PM' },
];

const renderDemoRow = (item: DemoRow) => @{
	@if (item.kind === 'notice') {
		<Item id={'list-row-' + item.id} className="list-demo-row list-demo-notice">
			<Item.Leading><Text className="list-demo-badge">Info</Text></Item.Leading>
			<Item.Content>
				<Text className="list-demo-title">{item.title}</Text>
				<Item.Supporting>{item.detail}</Item.Supporting>
			</Item.Content>
			<Item.Trailing><Text>›</Text></Item.Trailing>
		</Item>
	} @else {
		<Item
			id={'list-row-' + item.id}
			className="list-demo-row list-demo-event"
			leading={<Text className="list-demo-badge">Event</Text>}
			title={item.title}
			supportingText={item.detail}
			trailing={<Text>›</Text>}
		/>
	}
};

/** Shared content list — rows render in the tree; native recycling lives in
 *  the UITableView / RecyclerView platform components. */
export function ListDemo() @{
	const [items, setItems] = useState<DemoRow[]>(INITIAL_ROWS);
	const [updates, setUpdates] = useState(true);
	const reverseRows = () => setItems([...items].reverse());
	const appendRows = () => setItems((current) => [
		...current,
		...Array.from({ length: 5 }, (_, offset) => {
			const number = current.length + offset + 1;
			return {
				id: 'event-' + number,
				kind: number % 3 === 0 ? 'notice' as const : 'event' as const,
				title: number % 3 === 0 ? 'New notice ' + number : 'Added event ' + number,
				detail: number % 3 === 0 ? 'Loaded via the append button.' : 'More content loaded.',
			};
		}),
	]);

	<View className="vx-app flex-1 gap-4">
		<HStack className="list-demo-toolbar">
			<Pressable id="list-demo-reverse" className="btn bg-primary" onPress={reverseRows}>
				<Text className="text-onprimary">Reverse rows</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={appendRows}>
				<Text>Append 5</Text>
			</Pressable>
			<Text>{items.length + ' rows'}</Text>
		</HStack>
		<List id="list-demo-content" listStyle="decimal" density="compact" hasDividers header={<Text>Upcoming events</Text>}>
			{items.slice(0, 3).map((item) => (
				<ListItem
					key={item.id}
					label={item.title}
					description={item.detail}
					startContent={<Text className="list-demo-badge">{item.kind === 'notice' ? 'Info' : 'Event'}</Text>}
				/>
			))}
		</List>
		<FieldGroup label="Preferences">
			<Item id="list-demo-updates" title="Email updates" supportingText="Weekly event highlights" accessibilityLabel="Toggle email updates" onPress={() => setUpdates(!updates)} trailing={<Text>{updates ? 'On' : 'Off'}</Text>} />
			<Item id="list-demo-disabled" title="Managed setting" accessibilityLabel="Managed setting" disabled onPress={() => setUpdates(!updates)} supportingText="Changes disabled" />
		</FieldGroup>
		<ScrollableArea id="list-demo-list" className="list flex-1">
			{items.map(renderDemoRow)}
		</ScrollableArea>
	</View>
}
