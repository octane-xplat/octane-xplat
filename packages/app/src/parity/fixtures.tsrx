import {
	Absolute,
	Switch,
	Slider,
	Checkbox,
	RadioGroup,
	SegmentedControl,
	Button,
	Pressable,
	Text,
	Heading,
	TextInput,
	TextArea,
	View,
	Grid,
	Stack,
	Spacer,
	Column,
	Row,
	ScrollView,
	ScrollBox,
	Overlay,
	Popover,
	Sheet,
	Drawer,
	FormField,
	FieldGroup,
	InputNumber,
	PinInput,
	Select,
	SelectMenu,
	Combobox,
	InputMenu,
	InputTags,
	InputRating,
	CheckboxGroup,
	Collapsible,
	Accordion,
	DropdownMenu,
	ContextMenu,
	Stepper,
	NavigationMenu,
	CommandPalette,
	Tabs,
	Meter,
	ActivityIndicator,
	RichText,
	RichTextSpan,
	Badge,
	Avatar,
	AvatarGroup,
	User,
	Kbd,
	Link,
	NavLink,
	Icon,
	Separator,
	Skeleton,
	Empty,
	Screen,
	SafeArea,
} from '@octane-xplat/ui';

import { useRef } from 'octane';
import { useSafeAreaInsets } from '@octane-xplat/platform';

// Parity fixtures — one render per prop combo worth measuring. Fixed boxes
// make spacing and layout comparable; text fixtures also record the actual
// font family and face. Assertions live in scripts/parity-checks.mjs.

function SwitchFixture(props: { checked: boolean }) @{
	<Switch checked={props.checked} />
}

function SliderFixture(props: { id?: string; value: number }) @{
	<Slider id={props.id} value={props.value} minValue={0} maxValue={100} />
}

function CheckboxFixture(props: { checked: boolean }) @{
	<Checkbox checked={props.checked} />
}

function TextFixture(props: { size: number; weight: number; lineHeight: number; content: string }) @{
	<Text className="parity-text" style={{ fontSize: props.size, fontWeight: props.weight, lineHeight: props.lineHeight, color: '#0a0a0a' }}>
		{props.content}
	</Text>
}

function TextClassFixture(props: { sizeClass: string; content: string }) @{
	<Text className={`parity-text ${props.sizeClass}`} style={{ color: '#0a0a0a' }}>
		{props.content}
	</Text>
}

function HeadingFixture(props: { level: 1 | 2 | 3 | 4 | 5 | 6; content: string; className?: string }) @{
	<Heading className={`parity-heading ${props.className ?? ''}`} level={props.level} style={{ width: 520 }}>
		{props.content}
	</Heading>
}

function ButtonFixture(props: { width: number; height: number; label: string }) @{
	<Button
		style={{
			width: props.width,
			height: props.height,
			padding: 4,
			backgroundColor: '#f5f5f5',
			borderWidth: 1,
			borderColor: '#666666',
			borderRadius: 4,
		}}
	>
		<Text className="parity-txt">{props.label}</Text>
	</Button>
}

function ButtonNaturalFixture(props: { label: string }) @{
	<Button className="parity-button-natural">
		<Text className="parity-txt">{props.label}</Text>
	</Button>
}

function PressableFixture(props: { width: number; height: number; label: string }) @{
	<Pressable
		className="parity-pressable"
		onPress={() => {}}
		alignItems="center"
		justifyContent="center"
		style={{
			width: props.width,
			height: props.height,
			padding: 4,
			backgroundColor: '#f5f5f5',
			borderWidth: 1,
			borderColor: '#666666',
			borderRadius: 4,
		}}
	>
		<Text className="parity-txt">{props.label}</Text>
	</Pressable>
}

function TextInputFixture(props: { value?: string }) @{
	<TextInput className="parity-textinput" value={props.value} placeholder="Name" style={{ width: 180, height: 32 }} />
}

function TextInputNaturalFixture(props: { value?: string }) @{
	<TextInput className="parity-textinput" value={props.value} placeholder="Name" />
}

function TextAreaFixture(props: { value?: string }) @{
	<TextArea className="parity-textarea" value={props.value} placeholder="Notes" rows={2} style={{ width: 180, height: 48 }} />
}

function TextAreaRowsFixture(props: { value: string; rows?: number }) @{
	<TextArea className="parity-textarea" value={props.value} placeholder="Notes" rows={props.rows} style={{ width: 180 }} />
}

function ViewLayoutFixture() @{
	<View className="parity-view-root" style={{ width: 96, height: 48 }} gap={6}>
		<View className="parity-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function ViewPaddingLayoutFixture() @{
	<View className="parity-padded-view-root" style={{ width: 96, height: 48, padding: 8 }} gap={6}>
		<View className="parity-padded-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-padded-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function GridLayoutFixture() @{
	<Grid
		className="parity-grid-root"
		style={{ width: 96, height: 48 }}
		rows="12, auto, *, *"
		columns="30, 2*, *"
	>
		<View className="parity-grid-fixed" row={0} col={0} style={{ width: 30, height: 12 }} />
		<View className="parity-grid-weighted" row={0} col={1} style={{ width: 44, height: 12 }} />
		<View className="parity-grid-auto" row={1} col={0} style={{ width: 30, height: 10 }} />
		<View className="parity-grid-fill" row={3} col={2} style={{ width: 22, height: 13 }} />
		<View className="parity-grid-automatic" style={{ width: 22, height: 12 }} />
		<View className="parity-grid-col-span" row={1} col={1} colSpan={2} style={{ width: 66, height: 10 }} />
		<View className="parity-grid-row-span" row={2} col={0} rowSpan={2} style={{ width: 30, height: 26 }} />
	</Grid>
}

function StackLayoutFixture() @{
	<Stack className="parity-stack-root" style={{ width: 96, height: 48 }}>
		<View className="parity-stack-base" style={{ width: 48, height: 32 }} />
		<View className="parity-stack-overlay" style={{ width: 20, height: 10 }} />
	</Stack>
}

function ColumnLayoutFixture() @{
	<Column className="parity-column-root" style={{ width: 96, height: 48 }} gap={4} alignItems="center">
		<View className="parity-column-first" style={{ width: 16, height: 8 }} />
		<View className="parity-column-second" style={{ width: 20, height: 12 }} />
	</Column>
}

function RowLayoutFixture() @{
	<Row className="parity-row-root" style={{ width: 96, height: 32 }} gap={8}>
		<View className="parity-row-first" style={{ width: 20, height: 10 }} />
		<View className="parity-row-second" style={{ width: 12, height: 10 }} />
	</Row>
}

function SpacerLayoutFixture() @{
	<Row className="parity-spacer-root" style={{ width: 96, height: 24 }} gap={4}>
		<View className="parity-spacer-leading" style={{ width: 20, height: 10 }} />
		<Spacer className="parity-spacer" />
		<View className="parity-spacer-trailing" style={{ width: 20, height: 10 }} />
	</Row>
}

function ScrollViewLayoutFixture() @{
	<ScrollView className="parity-scroll-root" style={{ width: 96, height: 32 }}>
		<Column className="parity-scroll-content" style={{ width: 96, height: 64 }} gap={4}>
			<View className="parity-scroll-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scroll-second" style={{ width: 24, height: 12 }} />
		</Column>
	</ScrollView>
}

function AbsoluteLayoutFixture() @{
	<Absolute className="parity-absolute-root" style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}>
		<View className="parity-absolute-first" left={8} top={6} style={{ width: 20, height: 10 }} />
		<View className="parity-absolute-second" left={40} top={24} style={{ width: 12, height: 8 }} />
	</Absolute>
}

function ScrollBoxLayoutFixture() @{
	<ScrollBox className="parity-scrollbox-root" style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}>
		<Column className="parity-scrollbox-content" style={{ width: 96, height: 64 }} gap={4}>
			<View className="parity-scrollbox-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scrollbox-second" style={{ width: 24, height: 12 }} />
		</Column>
	</ScrollBox>
}

function DrawerLayoutFixture() @{
	<Drawer
		className="parity-drawer-root"
		open
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
		main={<View className="parity-drawer-main-content" style={{ width: 96, height: 48 }} />}
		drawer={<View className="parity-drawer-panel-content" style={{ width: 40, height: 48 }} />}
	/>
}

function OverlayLayoutFixture(props: { marker: string }) @{
	<Overlay
		open
		shadeCover={false}
		className={props.marker}
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
	>
		<View style={{ width: 96, height: 48 }} />
	</Overlay>
}

function PopoverLayoutFixture(props: { marker: string }) @{
	const anchor = useRef<any>(null);

	<>
		<View
			className="parity-popover-anchor"
			ref={(view: any) => { anchor.current = view; }}
			style={{ width: 24, height: 20 }}
		/>
		<Popover
			anchor={anchor}
			open
			placement="bottom"
			className={props.marker}
			style={{ width: 48, height: 32, backgroundColor: '#f5f5f5' }}
		>
			<View style={{ width: 48, height: 32 }} />
		</Popover>
	</>
}

function SheetLayoutFixture(props: { marker: string }) @{
	<Sheet
		open
		shadeCover={false}
		className={props.marker}
		style={{ width: 96, height: 48, backgroundColor: '#f5f5f5' }}
	>
		<View style={{ width: 96, height: 48 }} />
	</Sheet>
}

function FormFieldFixture() @{
	<FormField className="parity-formfield-root" label="Email" required style={{ width: 180, height: 64, backgroundColor: '#f5f5f5' }}>
		<TextInput placeholder="Email" style={{ width: 160, height: 32 }} />
	</FormField>
}

function FieldGroupFixture() @{
	<FieldGroup className="parity-fieldgroup-root" label="Contact" style={{ width: 180, height: 64, backgroundColor: '#f5f5f5' }}>
		<TextInput placeholder="Email" style={{ width: 160, height: 32 }} />
	</FieldGroup>
}

function InputNumberFixture() @{
	<InputNumber
		className="parity-inputnumber-root"
		value={2}
		min={0}
		max={5}
		step={1}
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function PinInputFixture() @{
	<PinInput
		className="parity-pininput-root"
		length={4}
		value="2648"
		style={{ width: 200, height: 44, backgroundColor: '#f5f5f5' }}
	/>
}

function SelectFixture() @{
	<Select
		className="parity-select-root"
		options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]}
		value="small"
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function SelectMenuFixture() @{
	<SelectMenu
		className="parity-selectmenu-root"
		options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]}
		value={['small']}
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function ComboboxFixture() @{
	<Combobox
		className="parity-combobox-root"
		options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]}
		value="small"
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function InputMenuFixture() @{
	<InputMenu
		className="parity-inputmenu-root"
		options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]}
		value="small"
		style={{ width: 160, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function InputTagsFixture() @{
	<InputTags
		className="parity-inputtags-root"
		value={['north', 'south']}
		placeholder="Add a tag"
		style={{ width: 220, height: 44, backgroundColor: '#f5f5f5' }}
	/>
}

function InputRatingFixture() @{
	<InputRating
		className="parity-rating-root"
		value={3}
		max={5}
		style={{ width: 200, height: 32, backgroundColor: '#f5f5f5' }}
	/>
}

function CheckboxGroupFixture() @{
	<CheckboxGroup
		className="parity-checkboxgroup-root"
		options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }]}
		value={['email']}
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

function RadioGroupFixture() @{
	<RadioGroup
		className="parity-radiogroup-root"
		options={[{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }]}
		value="low"
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

function SegmentedControlFixture() @{
	<SegmentedControl
		className="parity-segmented-root"
		options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]}
		value="day"
		style={{ width: 180, height: 40, backgroundColor: '#f5f5f5' }}
	/>
}

function CollapsibleFixture() @{
	<Collapsible
		className="parity-collapsible-root"
		style={{ width: 180, height: 72, backgroundColor: '#f5f5f5' }}
		trigger={<Text>Details</Text>}
		open={true}
	>
		<View className="parity-collapsible-content" style={{ width: 160, height: 24 }} />
	</Collapsible>
}

function AccordionFixture() @{
	<Accordion
		className="parity-accordion-root"
		style={{ width: 180, height: 88, backgroundColor: '#f5f5f5' }}
		open="profile"
		items={[
			{
				key: 'profile',
				header: 'Profile',
				content: <View className="parity-accordion-content" style={{ width: 160, height: 28 }} />,
			},
			{
				key: 'security',
				header: 'Security',
				content: <View style={{ width: 160, height: 28 }} />,
			},
		]}
	/>
}

function DropdownMenuFixture() @{
	<DropdownMenu
		className="parity-dropdown-trigger"
		style={{ width: 160, height: 32, backgroundColor: '#f5f5f5' }}
		trigger={<Text>Actions</Text>}
		items={[{ key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }]}
	/>
}

function ContextMenuFixture() @{
	<ContextMenu
		className="parity-contextmenu-root"
		style={{ width: 180, height: 56, backgroundColor: '#f5f5f5' }}
		items={[{ key: 'copy', label: 'Copy' }]}
	>
		<View className="parity-contextmenu-target" style={{ width: 144, height: 28 }} />
	</ContextMenu>
}

function StepperFixture() @{
	<Stepper
		className="parity-stepper-root"
		style={{ width: 220, height: 40, backgroundColor: '#f5f5f5' }}
		steps={[
			{ key: 'account', label: 'Account' },
			{ key: 'profile', label: 'Profile' },
			{ key: 'review', label: 'Review' },
		]}
		current={1}
	/>
}

function NavigationMenuFixture() @{
	<NavigationMenu
		className="parity-navmenu-root"
		style={{ width: 220, height: 40, backgroundColor: '#f5f5f5' }}
		items={[
			{ key: 'home', label: 'Home' },
			{ key: 'settings', label: 'Settings', active: true },
		]}
	/>
}

function CommandPaletteFixture() @{
	<CommandPalette
		className="parity-portal--command-palette-open"
		style={{ width: 200, height: 96, backgroundColor: '#f5f5f5' }}
		open={true}
		placeholder="Search actions"
		items={[{ key: 'create', label: 'Create project' }]}
	/>
}

function TabsFixture() @{
	<Tabs
		className="parity-tabs-root"
		style={{ width: 200, height: 104, backgroundColor: '#f5f5f5' }}
		selectedIndex={1}
		tabs={[
			{ title: 'Overview', render: () => <View style={{ width: 200, height: 48 }} /> },
			{
				title: 'Activity',
				render: () => <View className="parity-tabs-pane-child" style={{ width: 200, height: 48 }} />,
			},
		]}
	/>
}

function MeterFixture() @{
	<Meter
		className="parity-meter-root"
		value={65}
		max={100}
		size={48}
		strokeWidth={6}
		color="#1f6feb"
		trackColor="#dbeafe"
		style={{ width: 48, height: 48, backgroundColor: '#f5f5f5' }}
	/>
}

function ActivityIndicatorFixture() @{
	<ActivityIndicator
		className="parity-activity-indicator-root"
		busy={true}
		style={{ width: 24, height: 24 }}
	/>
}

function RichTextFixture() @{
	<RichText
		className="parity-rich-text-root"
		style={{
			width: 220,
			height: 32,
			fontSize: 14,
			fontWeight: 500,
			lineHeight: 20,
			color: '#0a0a0a',
			backgroundColor: '#f5f5f5',
		}}
	>
		<RichTextSpan text="Shared text " />
		<RichTextSpan text="formatted run" style={{ fontWeight: 700 }} />
	</RichText>
}

function BadgeFixture() @{
	<Badge
		className="parity-badge-root"
		style={{ width: 120, height: 32, backgroundColor: '#dbeafe' }}
	>
		<Text>Preview</Text>
	</Badge>
}

function AvatarFixture() @{
	<Avatar
		className="parity-avatar-root"
		fallback="AB"
		alt="Alex Brown"
		size={40}
		style={{ backgroundColor: '#dbeafe' }}
	/>
}

function AvatarGroupFixture() @{
	<AvatarGroup
		className="parity-avatar-group-root"
		max={2}
		size={32}
		style={{ width: 96, height: 40 }}
	>
		<Avatar className="parity-avatar-group-member" fallback="AB" size={32} />
		<Avatar fallback="CD" size={32} />
		<Avatar fallback="EF" size={32} />
	</AvatarGroup>
}

function UserFixture() @{
	<User
		className="parity-user-root"
		name="Alex Brown"
		description="Design lead"
		fallback="AB"
		size={40}
		style={{ width: 220, height: 56, backgroundColor: '#f5f5f5' }}
	/>
}

function KbdFixture() @{
	<Kbd
		className="parity-kbd-root"
		style={{ width: 52, height: 32, backgroundColor: '#f5f5f5' }}
	>
		<Text>⌘K</Text>
	</Kbd>
}

function LinkFixture() @{
	<Link className="parity-link-root" href="/parity">
		<Text>Open parity</Text>
	</Link>
}

function NavLinkFixture() @{
	<NavLink
		className="parity-navlink-root"
		activeClassName="parity-navlink-active"
		route={{ stack: 'root', name: 'parity', params: {} }}
	>
		<Text>Parity</Text>
	</NavLink>
}

function IconFixture() @{
	<Icon className="parity-icon-root" name="tab-home" size={24} color="#1f6feb" />
}

function SeparatorFixture() @{
	<Separator
		className="parity-separator-root"
		orientation="horizontal"
		style={{ width: 160, height: 2, backgroundColor: '#737373' }}
	/>
}

function SkeletonFixture() @{
	<Skeleton
		className="parity-skeleton-root"
		width={140}
		height={18}
		style={{ backgroundColor: '#dbeafe' }}
	/>
}

function EmptyFixture() @{
	<Empty
		className="parity-empty-root"
		icon="tab-home"
		title="No results"
		description="Try another search."
		style={{ width: 220, height: 120, backgroundColor: '#f5f5f5' }}
	/>
}

function ScreenLayoutFixture() @{
	<Screen className="parity-screen-root" style={{ width: '100%', height: '100%' }}>
		<View className="parity-screen-child" style={{ width: 20, height: 10 }} />
	</Screen>
}

function PercentSizeLayoutFixture() @{
	<View className="parity-percent-root" style={{ width: '50%', height: '50%' }} />
}

function SafeAreaLayoutFixture() @{
	const insets = useSafeAreaInsets();
	const width = 96;
	const height = 160;
	const contentWidth = width - insets.left - insets.right;
	const contentHeight = height - insets.top - insets.bottom;

	<Row className="parity-safe-area-fixture" style={{ width: 200, height }} gap={8}>
		<SafeArea className="parity-safe-area-root" style={{ width, height }}>
			<View
				className="parity-safe-area-content"
				style={{ width: contentWidth, height: contentHeight }}
			/>
		</SafeArea>
		<View className="parity-safe-area-reference" style={{ width, height }}>
			<View
				className="parity-safe-area-expected"
				style={{
					width: contentWidth,
					height: contentHeight,
					marginLeft: insets.left,
					marginTop: insets.top,
				}}
			/>
		</View>
	</Row>
}

export interface ParityFixture {
	name: string;
	/** The shared component this fixture measures; child helpers are not counted. */
	component: string;
	/** A top-level universal component; fixture data arrives through props. */
	renderer: (props: any) => any;
	props: Record<string, any>;
	/** Fill context: the stage box keeps align-items:stretch so the
	 *  fixture measures as it would inside a default column. Intrinsic
	 *  fixtures (fixed-width roots like Switch) get align-items:flex-start
	 *  instead — NS stretch clobbers explicit width where web doesn't. */
	wide?: boolean;
	/** Override the default 64-dip fixture box height. */
	height?: number;
	/** Override the default box width for long, unwrapped text measurements. */
	width?: number;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', component: 'Switch', renderer: SwitchFixture, props: { checked: false } },
	{ name: 'switch-on', component: 'Switch', renderer: SwitchFixture, props: { checked: true } },
	{ name: 'slider-0', component: 'Slider', renderer: SliderFixture, props: { value: 0 }, wide: true },
	{ name: 'slider-50', component: 'Slider', renderer: SliderFixture, props: { id: 'probe-slider-50', value: 50 }, wide: true },
	{ name: 'checkbox-off', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: false } },
	{ name: 'checkbox-on', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: true } },
	{ name: 'heading-level-1', component: 'Heading', renderer: HeadingFixture, props: { level: 1, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-2', component: 'Heading', renderer: HeadingFixture, props: { level: 2, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-3', component: 'Heading', renderer: HeadingFixture, props: { level: 3, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-4', component: 'Heading', renderer: HeadingFixture, props: { level: 4, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-5', component: 'Heading', renderer: HeadingFixture, props: { level: 5, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-6', component: 'Heading', renderer: HeadingFixture, props: { level: 6, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-custom-size', component: 'Heading', renderer: HeadingFixture, props: { level: 1, content: 'Shared heading', className: 'text-xl' }, width: 520 },
	{ name: 'text-class-sm', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-sm', content: 'Shared label' } },
	{ name: 'text-class-lg', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-lg', content: 'Shared label' } },
	{ name: 'text-class-xl', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-xl', content: 'Shared label' } },
	{ name: 'text-class-2xl', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-2xl', content: 'Shared label' } },
	{ name: 'text-basic', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 600, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-bold', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 700, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-regular', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-small', component: 'Text', renderer: TextFixture, props: { size: 12, weight: 400, lineHeight: 16, content: 'Shared label' } },
	{ name: 'text-display', component: 'Text', renderer: TextFixture, props: { size: 18, weight: 700, lineHeight: 24, content: 'Shared label' } },
	{ name: 'text-long', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'Shared typography should render the same glyph advances' } },
	{ name: 'text-advance', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'The same type should use the same width across targets.' }, width: 520 },
	{ name: 'button-basic', component: 'Button', renderer: ButtonFixture, props: { width: 220, height: 32, label: 'Go' }, wide: true },
	{ name: 'button-compact', component: 'Button', renderer: ButtonFixture, props: { width: 96, height: 28, label: 'Save' }, wide: true },
	{ name: 'button-long-label', component: 'Button', renderer: ButtonFixture, props: { width: 160, height: 36, label: 'Continue' }, wide: true },
	{ name: 'button-natural', component: 'Button', renderer: ButtonNaturalFixture, props: { label: 'Go' }, width: 220 },
	{ name: 'pressable-basic', component: 'Pressable', renderer: PressableFixture, props: { width: 220, height: 32, label: 'Go' }, wide: true },
	{ name: 'text-input', component: 'TextInput', renderer: TextInputFixture, props: {} },
	{ name: 'text-input-filled', component: 'TextInput', renderer: TextInputFixture, props: { value: 'alec@example.com' } },
	{ name: 'text-input-natural', component: 'TextInput', renderer: TextInputNaturalFixture, props: { value: 'alec@example.com' }, width: 520, wide: true },
	{ name: 'text-area', component: 'TextArea', renderer: TextAreaFixture, props: {} },
	{ name: 'text-area-filled', component: 'TextArea', renderer: TextAreaFixture, props: { value: 'First line\nSecond line' } },
	{ name: 'text-area-rows-2', component: 'TextArea', renderer: TextAreaRowsFixture, props: { value: 'First line\nSecond line', rows: 2 } },
	{ name: 'text-area-rows-default', component: 'TextArea', renderer: TextAreaRowsFixture, props: { value: 'First line\nSecond line' } },
	{ name: 'view-layout', component: 'View', renderer: ViewLayoutFixture, props: {} },
	{ name: 'view-padding-layout', component: 'View', renderer: ViewPaddingLayoutFixture, props: {} },
	{ name: 'grid-layout', component: 'Grid', renderer: GridLayoutFixture, props: {} },
	{ name: 'stack-overlay-layout', component: 'Stack', renderer: StackLayoutFixture, props: {} },
	{ name: 'column-layout', component: 'Column', renderer: ColumnLayoutFixture, props: {} },
	{ name: 'row-layout', component: 'Row', renderer: RowLayoutFixture, props: {} },
	{ name: 'spacer-layout', component: 'Spacer', renderer: SpacerLayoutFixture, props: {} },
	{ name: 'scroll-view-layout', component: 'ScrollView', renderer: ScrollViewLayoutFixture, props: {} },
	{ name: 'absolute-layout', component: 'Absolute', renderer: AbsoluteLayoutFixture, props: {} },
	{ name: 'scroll-box-layout', component: 'ScrollBox', renderer: ScrollBoxLayoutFixture, props: {} },
	{ name: 'drawer-open-frame', component: 'Drawer', renderer: DrawerLayoutFixture, props: {} },
	{ name: 'overlay-fixed-frame', component: 'Overlay', renderer: OverlayLayoutFixture, props: { marker: 'parity-portal--overlay-fixed-frame' } },
	{ name: 'popover-bottom-frame', component: 'Popover', renderer: PopoverLayoutFixture, props: { marker: 'parity-portal--popover-bottom-frame' } },
	{ name: 'sheet-fixed-frame', component: 'Sheet', renderer: SheetLayoutFixture, props: { marker: 'parity-portal--sheet-fixed-frame' } },
	{ name: 'form-field-basic', component: 'FormField', renderer: FormFieldFixture, props: {} },
	{ name: 'field-group-basic', component: 'FieldGroup', renderer: FieldGroupFixture, props: {} },
	{ name: 'input-number-value', component: 'InputNumber', renderer: InputNumberFixture, props: {} },
	{ name: 'pin-input-filled', component: 'PinInput', renderer: PinInputFixture, props: {} },
	{ name: 'select-value', component: 'Select', renderer: SelectFixture, props: {} },
	{ name: 'select-menu-value', component: 'SelectMenu', renderer: SelectMenuFixture, props: {} },
	{ name: 'combobox-value', component: 'Combobox', renderer: ComboboxFixture, props: {} },
	{ name: 'input-menu-value', component: 'InputMenu', renderer: InputMenuFixture, props: {} },
	{ name: 'input-tags-values', component: 'InputTags', renderer: InputTagsFixture, props: {}, wide: true },
	{ name: 'input-rating-selected', component: 'InputRating', renderer: InputRatingFixture, props: {} },
	{ name: 'checkbox-group-selected', component: 'CheckboxGroup', renderer: CheckboxGroupFixture, props: {} },
	{ name: 'radio-group-selected', component: 'RadioGroup', renderer: RadioGroupFixture, props: {} },
	{ name: 'segmented-control-selected', component: 'SegmentedControl', renderer: SegmentedControlFixture, props: {} },
	{ name: 'collapsible-open', component: 'Collapsible', renderer: CollapsibleFixture, props: {} },
	{ name: 'accordion-one-open', component: 'Accordion', renderer: AccordionFixture, props: {} },
	{ name: 'dropdown-menu-trigger', component: 'DropdownMenu', renderer: DropdownMenuFixture, props: {} },
	{ name: 'context-menu-target', component: 'ContextMenu', renderer: ContextMenuFixture, props: {} },
	{ name: 'stepper-middle-active', component: 'Stepper', renderer: StepperFixture, props: {} },
	{ name: 'navigation-menu-active', component: 'NavigationMenu', renderer: NavigationMenuFixture, props: {} },
	{ name: 'command-palette-open', component: 'CommandPalette', renderer: CommandPaletteFixture, props: {}, height: 112 },
	{ name: 'tabs-second-selected', component: 'Tabs', renderer: TabsFixture, props: {}, height: 120 },
	{ name: 'meter-progress', component: 'Meter', renderer: MeterFixture, props: {} },
	{ name: 'activity-indicator-busy', component: 'ActivityIndicator', renderer: ActivityIndicatorFixture, props: {} },
	{ name: 'rich-text-fixed-run', component: 'RichText', renderer: RichTextFixture, props: {}, height: 48 },
	{ name: 'badge-basic', component: 'Badge', renderer: BadgeFixture, props: {} },
	{ name: 'avatar-fallback', component: 'Avatar', renderer: AvatarFixture, props: {} },
	{ name: 'avatar-group-overflow', component: 'AvatarGroup', renderer: AvatarGroupFixture, props: {} },
	{ name: 'user-row', component: 'User', renderer: UserFixture, props: {} },
	{ name: 'kbd-shortcut', component: 'Kbd', renderer: KbdFixture, props: {} },
	{ name: 'link-fixed-target', component: 'Link', renderer: LinkFixture, props: {} },
	{ name: 'nav-link-active', component: 'NavLink', renderer: NavLinkFixture, props: {} },
	{ name: 'icon-registered-glyph', component: 'Icon', renderer: IconFixture, props: {} },
	{ name: 'separator-horizontal', component: 'Separator', renderer: SeparatorFixture, props: {} },
	{ name: 'skeleton-basic', component: 'Skeleton', renderer: SkeletonFixture, props: {} },
	{ name: 'empty-state', component: 'Empty', renderer: EmptyFixture, props: {}, height: 136 },
	{ name: 'screen-layout', component: 'Screen', renderer: ScreenLayoutFixture, props: {} },
	{ name: 'percent-size-layout', component: 'View', renderer: PercentSizeLayoutFixture, props: {} },
	{ name: 'safe-area-layout', component: 'SafeArea', renderer: SafeAreaLayoutFixture, props: {}, height: 168 },
];
