/** @jsxImportSource @octane-xplat/jsx */
import {
	Alert,
	Banner,
	Blockquote,
	Card,
	Chip,
	Citation,
	Code,
	CodeBlock,
	EmptyState,
	FieldLabel,
	FieldStatus,
	Heading,
	Item,
	Kbd,
	Link,
	List,
	ListItem,
	MetadataList,
	MetadataListItem,
	Meter,
	Outline,
	Pagination,
	ProgressBar,
	ProgressGroup,
	Skeleton,
	StatusDot,
	Step,
	Stepper,
	Text,
	Timeline,
	Timer,
	Timestamp,
	Toolbar,
	View,
	VisuallyHidden,
	styled,
} from '@octane-xplat/ui'

const StyledBox = styled(View, {
	base: 'vx-styled-probe',
	variants: { tone: { brand: 'vx-styled-probe--brand' } },
})

export function Probe() @{
	<View style={{ gap: 4, padding: 12 }}>
		<Kbd id="kbd">⌘K</Kbd>
		<Heading id="heading" level={2}>Title</Heading>
		<Code id="code">inline()</Code>
		<CodeBlock id="codeblock" code={'const x = 1'} />
		<ProgressBar id="pbar" label="Loading" value={40} />
		<StatusDot id="sdot" variant="success" label="OK" />
		<Citation id="cite" number={1} source={{ title: 'Docs', url: 'https://example.com' }} />
		<Outline id="outline" items={[{ id: 'h1', label: 'Intro', level: 1 }, { id: 'h2', label: 'Deep', level: 2 }]} />
		<Blockquote id="quote">Quoted text</Blockquote>
		<Timestamp id="ts" value="2024-01-02T03:04:05Z" />
		<Timer id="timer" />
		<Skeleton id="skel" style={{ width: 80, height: 16 }} />
		<VisuallyHidden id="vh">Hidden label</VisuallyHidden>
		<Chip id="chip">Tag</Chip>
		<Alert id="alert" tone="info">Notice</Alert>
		<Banner id="banner">Promo</Banner>
		<EmptyState id="empty" title="Nothing here" />
		<Meter id="meter" value={0.6} />
		<ProgressGroup id="pgroup" items={[{ key: 'a', label: 'Load', value: 50 }]} />
		<MetadataList id="mlist" label={{ position: 'top' }}>
			<MetadataListItem id="mli" label="Key">Value</MetadataListItem>
		</MetadataList>
		<Timeline id="tl" items={[{ key: 'a', title: 'Start' }, { key: 'b', title: 'End' }]} />
		<Item id="item">Item text</Item>
		<List id="list">
			<ListItem id="li" label="Row one" />
		</List>
		<Toolbar id="toolbar" label="Tools" />
		<Stepper id="stepper">
			<Step id="step" step={1}>First</Step>
		</Stepper>
		<Pagination id="pages" page={2} pageCount={5} />
		<FieldLabel id="flabel" label="Name" />
		<FieldStatus id="fstatus" type="error" message="Required" />
		<Link id="link" href="https://example.com">Site</Link>
		<Card id="card"><Text>Card body</Text></Card>
		<StyledBox id="styled" tone="brand" />
	</View>
}
