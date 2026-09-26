import { useState } from 'octane';
import {
	Accordion, Avatar, AvatarGroup, Badge, Breadcrumb, Button, Checkbox,
	CheckboxGroup, Collapsible, CommandPalette, ContextMenu, DropdownMenu,
	FieldGroup, FormField, Heading, InputNumber, InputRating, InputTags,
	NavigationMenu, Pagination, PinInput, RadioGroup, Row, Select,
	Separator, Skeleton, Stepper, Text, View, registerIcons,
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
	const [num, setNum] = useState(2);
	const [pin, setPin] = useState('');
	const [fruit, setFruit] = useState<string | string[]>('apple');
	const [tags, setTags] = useState<string[]>(['one']);
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
			<Text className="font-bold">Fields</Text>
			<FieldGroup label="Sign up">
				<FormField label="Name" hint="As it appears on your badge">
					<InputTags value={tags} onValueChange={setTags} placeholder="Add tag…" />
				</FormField>
				<FormField label="Quantity" error={num > 5 ? 'Too many' : undefined}>
					<InputNumber value={num} onValueChange={setNum} min={0} max={9} />
				</FormField>
				<FormField label="PIN">
					<PinInput length={4} value={pin} onValueChange={setPin} />
				</FormField>
			</FieldGroup>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Select / Rating / CheckboxGroup</Text>
			<Select
				options={[{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry', disabled: true }]}
				value={fruit}
				onValueChange={setFruit}
				placeholder="Pick a fruit"
				searchable={true}
			/>
			<InputRating value={rating} onValueChange={setRating} />
			<CheckboxGroup
				options={[{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }]}
				value={checks}
				onValueChange={setChecks}
			/>
		</View>

		<View className="controls-section">
			<Text className="font-bold">Wayfinding</Text>
			<Breadcrumb items={[{ label: 'Home', onSelect: () => setNav('home') }, { label: 'Library', onSelect: () => setNav('lib') }, { label: 'Book' }]} />
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
