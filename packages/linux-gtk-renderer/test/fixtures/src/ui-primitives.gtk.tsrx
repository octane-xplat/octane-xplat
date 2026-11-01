/** @jsxImportSource @octane-xplat/jsx */
import {
	View,
	Text,
	Pressable,
	Stack,
	VStack,
	HStack,
	StackItem,
	Grid,
	GridSpan,
	Center,
	Section,
	Layout,
	LayoutHeader,
	LayoutContent,
	LayoutFooter,
	LayoutPanel,
	Absolute,
	Spacer,
	Badge,
	Divider,
	ColorSwatch,
	SizeContext,
	SizeProvider,
	useSize,
} from '@octane-xplat/ui'

import { useContext } from 'octane'

export const events: any[] = []
function SizeReadout() @{
	const size = useSize()
	const explicit = useSize('sm')
	const inherited = useContext(SizeContext)

	<Text id="size-result">{`${size}:${explicit}:${inherited}`}</Text>
}

export function App(props: {
	disabled: boolean
	version: number
	horizontal: boolean
	gridWidth?: number
}) @{
	<View id="primitives" className="fixture-root">
		<Pressable
			id="gesture"
			disabled={props.disabled}
			className="gesture"
			onPress={() => events.push(['press', props.version])}
			onPressIn={() => events.push(['in', props.version])}
			onPressOut={() => events.push(['out', props.version])}
			onPan={(e) => events.push(['pan', props.version, e])}
			onSwipe={(e) => events.push(['swipe', props.version, e.direction])}
		>
			<Text>Drag me</Text>
		</Pressable>
		<Stack id="flow" direction={props.horizontal ? 'horizontal' : 'vertical'} gap={2}>
			<Text id="alpha">Alpha</Text>
			<Text id="beta">Beta</Text>
		</Stack>
		<VStack id="vertical">
			<StackItem id="stack-item">
				<Text>Vertical</Text>
			</StackItem>
		</VStack>
		<HStack id="horizontal">
			<Text>Horizontal</Text>
			<Spacer id="spacer" />
		</HStack>
		<Grid
			id="grid"
			rows="30px 40px"
			columns="1fr 1fr"
			style={props.gridWidth == null ? undefined : { width: props.gridWidth }}
		>
			<GridSpan id="span" columns={2}>
				<Text>Grid</Text>
			</GridSpan>
			<Text id="grid-a">One</Text>
			<Text id="grid-b">Two</Text>
		</Grid>
		<Center id="center">
			<Text>Centered</Text>
		</Center>
		<Section id="section" padding={2}>
			<Text>Section</Text>
		</Section>
		<Layout
			id="layout"
			height="auto"
			header={
				<LayoutHeader id="header">
					<Text>Header</Text>
				</LayoutHeader>
			}
			footer={
				<LayoutFooter id="footer">
					<Text>Footer</Text>
				</LayoutFooter>
			}
			start={
				<LayoutPanel id="panel">
					<Text>Panel</Text>
				</LayoutPanel>
			}
		>
			<LayoutContent id="content">
				<Text>Content</Text>
			</LayoutContent>
		</Layout>
		<Absolute id="absolute">
			<Text>Overlay slot</Text>
		</Absolute>
		<Badge id="badge" label="Ready" />
		<Divider id="divider" label="Details" />
		<ColorSwatch id="swatch" color="#123456" />
		<SizeProvider value="lg">
			<SizeReadout />
		</SizeProvider>
	</View>
}
