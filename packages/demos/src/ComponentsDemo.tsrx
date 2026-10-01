import { useState } from 'octane';
import {
	Accordion, Alert, Avatar, AvatarGroup, Badge, Banner, Breadcrumbs, Button,
	Card, CheckboxInput, CheckboxList, Chip, Collapsible, CommandPalette,
	ContextMenu, DropdownMenu, EmptyState, FieldGroup, Field, Heading,
	NumberInput, InputRating, Typeahead, Tokenizer, createStaticSource, Kbd, NavigationMenu, Pagination,
	PinInput, ProgressGroup, RadioList, HStack, Selector, Divider, Skeleton,
	Stepper, Table, Text, Timeline, TreeList, User, View, registerIcons,
} from '@octane-xplat/ui';

registerIcons({
	'menu-dot': { svg: 'M12 5v.01M12 12v.01M12 19v.01' },
});

const demoSelectionSource = createStaticSource([
	{ id: 'apple', label: 'Apple' },
	{ id: 'banana', label: 'Banana' },
	{ id: 'cherry', label: 'Cherry' },
]);

/** Phase-1 self-drawn components — one row per component, plain usage. */
export function ComponentsDemo() @{
	const [checked, setChecked] = useState(true);
	const [radio, setRadio] = useState('a');
	const [lastMenu, setLastMenu] = useState('—');
	const [lastCtx, setLastCtx] = useState('—');
	const [num, setNum] = useState(2);
	const [pin, setPin] = useState('');
	const [fruit, setFruit] = useState<string | string[] | null>('apple');
	const [assignee, setAssignee] = useState<{ id: string; label: string } | null>({ id: 'apple', label: 'Apple' });
	const [tags, setTags] = useState<Array<{ id: string; label: string }>>([{ id: 'one', label: 'One' }]);
	const [rating, setRating] = useState(3);
	const [checks, setChecks] = useState<string[]>(['x']);
	const [page, setPage] = useState(4);
	const [step, setStep] = useState(1);
	const [nav, setNav] = useState('home');
	const [cmdk, setCmdk] = useState(false);

	const menuItems = [
		{ key: 'edit', label: 'Edit', onSelect: () => setLastMenu('edit') },
		{ key: 'dup', label: 'Duplicate', onSelect: () => setLastMenu('dup') },
		{ key: 'del', label: 'Delete', disabled: true, onSelect: () => setLastMenu('del') },
	];

	<View className="controls-demo gap-4">
		<Heading level={2}>Components</Heading>

		<View className="controls-section">
			<Text className="font-bold">Button</Text>
			<HStack className="items-center gap-4">
				<Button className="btn btn-secondary" onPress={() => setLastMenu('pressed')}>
					<Text>Press me</Text>
				</Button>
				<Button className="btn" loading={true}><Text>Loading</Text></Button>
				<Button className="btn" disabled={true}><Text>Disabled</Text></Button>
			</HStack>
		</View>

		<View className="controls-section">
			<Text className="font-bold">CheckboxInput + RadioList</Text>
			<CheckboxInput checked={checked} onCheckedChange={setChecked} label="Checked" />
			<RadioList
				options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma', isDisabled: true }]}
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
			<HStack className="items-center gap-4">
				<DropdownMenu trigger={<Text className="chip">Menu ▾</Text>} items={menuItems} />
				<Text className="text-sm text-muted">{'last: ' + lastMenu}</Text>
			</HStack>
			<ContextMenu items={menuItems.map((i) => ({ ...i, onSelect: () => setLastCtx(i.key) }))}>
				<View className="cell"><Text>Right-click / long-press me ({lastCtx})</Text></View>
			</ContextMenu>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Badge / Divider / Skeleton</Text>
			<HStack className="items-center gap-4">
				<Badge className="chip"><Text>Badge</Text></Badge>
				<Badge className="chip chip-on"><Text>Active</Text></Badge>
			</HStack>
			<Divider />
			<Skeleton width={160} height={16} />
			<Skeleton width={220} height={16} />
		</View>

		<View className="controls-section">
			<Text className="font-bold">Fields</Text>
			<FieldGroup label="Sign up">
				<Tokenizer label="Tags" searchSource={demoSelectionSource} value={tags} onChange={setTags} placeholder="Add tag…" hasCreate={true} />
				<Field label="Quantity" status={num > 5 ? { type: 'error', message: 'Too many' } : undefined}>
					<NumberInput value={num} onValueChange={setNum} min={0} max={9} />
				</Field>
				<Field label="PIN">
					<PinInput length={4} value={pin} onValueChange={setPin} />
					<Text>Clearing a cell also clears the following cells.</Text>
				</Field>
			</FieldGroup>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Selector / Rating / CheckboxList</Text>
			<Selector
				options={[{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry', isDisabled: true }]}
				value={fruit}
				onValueChange={setFruit}
				placeholder="Pick a fruit"
				searchable={true}
			/>
			<Typeahead label="Fruit" searchSource={demoSelectionSource} value={assignee} onChange={setAssignee} placeholder="Pick a fruit" />
			<InputRating value={rating} onValueChange={setRating} />
			<CheckboxList
				options={[{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }]}
				value={checks}
				onValueChange={setChecks}
			/>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Wayfinding</Text>
			<Breadcrumbs items={[{ label: 'Home', onSelect: () => setNav('home') }, { label: 'Library', onSelect: () => setNav('lib') }, { label: 'Book' }]} />
			<Pagination page={page} pageCount={12} onPageChange={setPage} />
			<Stepper
				steps={[{ key: 'cart', label: 'Cart' }, { key: 'ship', label: 'Ship' }, { key: 'pay', label: 'Pay' }]}
				current={step}
				onStepChange={setStep}
			/>
			<NavigationMenu
				items={[
					{ key: 'home', label: 'Home', active: nav === 'home', onSelect: () => setNav('home') },
					{ key: 'lib', label: 'Library', active: nav === 'lib', onSelect: () => setNav('lib') },
					{ key: 'off', label: 'Off', disabled: true },
				]}
			/>
			<Button className="btn btn-secondary" onPress={() => setCmdk(true)}><Text>Command palette</Text></Button>
			<CommandPalette open={cmdk} onOpenChange={setCmdk} items={menuItems} />
		</View>

		<View className="controls-section">
			<Text className="font-bold">Data display</Text>
			<Table
				columns={[{ key: 'name', label: 'Name' }, { key: 'qty', label: 'Qty', width: 50, align: 'right' }]}
				rows={[{ name: 'Apples', qty: 4 }, { name: 'Pears', qty: 2 }, { name: 'Figs', qty: 9 }]}
			/>
			<Timeline items={[
				{ key: 'a', title: 'Ordered', time: '09:12' },
				{ key: 'b', title: 'Shipped', time: '11:40' },
				{ key: 'c', title: 'Delivered', time: '15:03' },
			]} />
			<TreeList
				nodes={[
					{ key: 'src', label: 'src', children: [{ key: 'app', label: 'App.tsrx' }, { key: 'ui', label: 'ui', children: [{ key: 'btn', label: 'Button.tsrx' }] }] },
					{ key: 'docs', label: 'docs' },
				]}
				defaultExpanded={['src']}
			/>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Callouts</Text>
			<Alert tone="info" title="Heads up"><Text>Something worth knowing.</Text></Alert>
			<Alert tone="error" title="Failed"><Text>Could not save.</Text></Alert>
			<Banner onDismiss={() => setNav('dismissed')}><Text>Dismissible banner (last: {nav})</Text></Banner>
			<Card header={<Text className="font-bold">Card header</Text>} footer={<Text className="text-sm text-muted">footer</Text>}>
				<Text>Card body.</Text>
			</Card>
			<HStack className="items-center gap-4">
				<Chip selected={checked} onSelect={() => setChecked(!checked)}><Text>Chip</Text></Chip>
				<Chip onRemove={() => setNav('chip-removed')}><Text>Removable</Text></Chip>
				<Kbd><Text>⌘K</Text></Kbd>
			</HStack>
			<EmptyState title="Nothing here" description="Try adding an item">
				<Button className="btn btn-secondary"><Text>Add item</Text></Button>
			</EmptyState>
			<User name="Alec Larson" description="Framework author" fallback="AL" />
			<ProgressGroup items={[{ key: 'a', label: 'Build', value: 70 }, { key: 'b', label: 'Test', value: 35 }]} />
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
