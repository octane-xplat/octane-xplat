import { useState } from 'octane';
import {
	Accordion, Avatar, AvatarGroup, Badge, Button, Checkbox, Collapsible,
	ContextMenu, DropdownMenu, Heading, RadioGroup, Row, Separator,
	Skeleton, Text, View, registerIcons,
} from '@octane-xplat/ui';

registerIcons({
	'menu-dot': { svg: 'M12 5v.01M12 12v.01M12 19v.01' },
});

/** Phase-1 self-drawn components — one row per component, plain usage. */
export function ComponentsDemo() @{
	const [checked, setChecked] = useState(true);
	const [radio, setRadio] = useState('a');
	const [lastMenu, setLastMenu] = useState('—');
	const [lastCtx, setLastCtx] = useState('—');

	const menuItems = [
		{ key: 'edit', label: 'Edit', onSelect: () => setLastMenu('edit') },
		{ key: 'dup', label: 'Duplicate', onSelect: () => setLastMenu('dup') },
		{ key: 'del', label: 'Delete', disabled: true, onSelect: () => setLastMenu('del') },
	];

	<View className="controls-demo gap-4">
		<Heading level={2}>Components</Heading>

		<View className="controls-section">
			<Text className="font-bold">Button</Text>
			<Row className="items-center gap-4">
				<Button className="btn btn-secondary" onPress={() => setLastMenu('pressed')}>
					<Text>Press me</Text>
				</Button>
				<Button className="btn" loading={true}><Text>Loading</Text></Button>
				<Button className="btn" disabled={true}><Text>Disabled</Text></Button>
			</Row>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Checkbox + RadioGroup</Text>
			<Checkbox checked={checked} onCheckedChange={setChecked} label="Checked" />
			<RadioGroup
				options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma', disabled: true }]}
				value={radio}
				onValueChange={setRadio}
			/>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Collapsible + Accordion</Text>
			<Collapsible trigger={<Text className="chip">Toggle section</Text>}>
				<Text>Collapsible body — hidden until toggled.</Text>
			</Collapsible>
			<Accordion
				items={[
					{ key: 'one', header: <Text className="chip">One</Text>, content: <Text>First panel.</Text> },
					{ key: 'two', header: <Text className="chip">Two</Text>, content: <Text>Second panel.</Text> },
				]}
			/>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Menus</Text>
			<Row className="items-center gap-4">
				<DropdownMenu trigger={<Text className="chip">Menu ▾</Text>} items={menuItems} />
				<Text className="text-sm text-muted">{'last: ' + lastMenu}</Text>
			</Row>
			<ContextMenu items={menuItems.map((i) => ({ ...i, onSelect: () => setLastCtx(i.key) }))}>
				<View className="cell"><Text>Right-click / long-press me ({lastCtx})</Text></View>
			</ContextMenu>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Badge / Separator / Skeleton</Text>
			<Row className="items-center gap-4">
				<Badge className="chip"><Text>Badge</Text></Badge>
				<Badge className="chip chip-on"><Text>Active</Text></Badge>
			</Row>
			<Separator />
			<Skeleton width={160} height={16} />
			<Skeleton width={220} height={16} />
		</View>

		<View className="controls-section">
			<Text className="font-bold">Avatars</Text>
			<AvatarGroup max={3}>
				<Avatar fallback="AL" />
				<Avatar fallback="BK" />
				<Avatar fallback="CD" />
				<Avatar fallback="EF" />
			</AvatarGroup>
		</View>
	</View>
}
