/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { FieldGroup, ListItem, Pressable, Row, Text, View } from '@octane-xplat/ui';
import { RecyclerView } from '@octane-xplat/ui/android';

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
		<ListItem id={'list-row-' + item.id} className="list-demo-row list-demo-notice">
			<ListItem.Leading><Text className="list-demo-badge">Info</Text></ListItem.Leading>
			<ListItem.Content>
				<Text className="list-demo-title">{item.title}</Text>
				<ListItem.Supporting>{item.detail}</ListItem.Supporting>
			</ListItem.Content>
			<ListItem.Trailing><Text>›</Text></ListItem.Trailing>
		</ListItem>
	} @else {
		<ListItem
			id={'list-row-' + item.id}
			className="list-demo-row list-demo-event"
			leading={<Text className="list-demo-badge">Event</Text>}
			title={item.title}
			supportingText={item.detail}
			trailing={<Text>›</Text>}
		/>
	}
};

/** Android platform list — RecyclerView cell recycling. The shared `ui`
 *  surface has no List; this leaf's siblings cover the other targets. */
export function ListDemo() @{
	const [items, setItems] = useState<DemoRow[]>(INITIAL_ROWS);
	const reverseRows = () => setItems([...items].reverse());
	const appendRows = () => setItems((current) => [
		...current,
		...Array.from({ length: 5 }, (_, offset) => {
			const number = current.length + offset + 1;
			return {
				id: 'event-' + number,
				kind: number % 3 === 0 ? 'notice' as const : 'event' as const,
				title: number % 3 === 0 ? 'New notice ' + number : 'Added event ' + number,
				detail: number % 3 === 0 ? 'Loaded as the list neared its end.' : 'More content loaded near the end.',
			};
		}),
	]);

	<View className="vx-app flex-1 gap-4">
		<Row className="list-demo-toolbar">
			<Pressable id="list-demo-reverse" className="btn bg-primary" onPress={reverseRows}>
				<Text className="text-onprimary">Reverse rows</Text>
			</Pressable>
			<Text>{items.length + ' rows · scroll to load more'}</Text>
		</Row>
		<FieldGroup label="Preferences">
			<ListItem title="Email updates" supportingText="Weekly event highlights" trailing={<Text>On</Text>} />
		</FieldGroup>
		<RecyclerView
			id="list-demo-list"
			className="list flex-1"
			items={items}
			onEndReached={appendRows}
			renderItem={renderDemoRow}
		/>
	</View>
}
