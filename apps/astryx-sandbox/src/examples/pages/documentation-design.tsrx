// Port of upstream templates/pages/documentation-design/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/documentation-design/.
// The upstream page statically renders the Button component's detail view;
// the component catalog data lives in sibling docs templates. Outline is a
// public component. Table `width: pixel(125)` → number.
import { useState } from 'octane'
import {
	Avatar, Badge, Banner, Button, Card, Center, CodeBlock, Dialog,
	DialogHeader, Divider, Heading, HStack, Icon, Layout, LayoutContent,
	LayoutPanel, Outline, Section, Selector, StackItem, Tab, TabList, Table,
	Text, Token, Tooltip, useMediaQuery, VStack, pixel } from '@octane-xplat/ui'
import type { OutlineItem } from '@octane-xplat/ui'

const tabListFlush = { marginInlineStart: '-12px' } as const
const outlinePanel = {
	position: 'sticky',
	top: 24,
	alignSelf: 'start',
	paddingBlockStart: 120,
} as const

const COMPONENT_OUTLINE_ITEMS: OutlineItem[] = [
	{ id: 'usage', label: 'Usage', level: 2 },
	{ id: 'best-practices', label: 'Best practices', level: 3 },
	{ id: 'examples', label: 'Examples', level: 2 },
]

const COMPONENT_OUTLINE_OPTIONS = COMPONENT_OUTLINE_ITEMS.map((item) => ({
	value: item.id,
	label: item.label,
}))

const DOCS = {
	name: 'Button',
	usage:
		'Buttons provide visual cues for actions and events. These fundamental components allow users to commit actions and navigate a page flow. Use a Button when a user needs to submit a form, start a new task or action, or trigger a new UI element to appear on the page.',
	bestPractices: [
		{
			type: 'do',
			text: 'Convey clear action hierarchy: Each surface should only have 1 primary button. A majority of buttons should be in default or flat style.',
		},
		{
			type: 'do',
			text: 'Promote clarity: Consider labels alongside icons where appropriate.',
		},
		{
			type: 'dont',
			text: 'Overuse primary or special buttons: Overusing colored buttons will result in a page with less intentionality, create visual confusion and a lack of page hierarchy.',
		},
	],
	examples: [
		{
			title: 'Semantics',
			description:
				'We have four semantic buttons types: flat, default, primary, and destructive. Flat buttons are used to limit visual prominence, whereas primary emphasizes a single action. Use destructive for deletions that trigger dialog confirmations.',
			code: `<Button label="Flat" variant="ghost" />\n<Button label="Default" variant="secondary" />\n<Button label="Primary" variant="primary" />\n<Button label="Destructive" variant="destructive" />`,
		},
		{
			title: 'Default button with badge',
			description:
				'Buttons can include a badge to highlight new or updated actions.',
			code: `<Button\n  label="Button"\n  variant="secondary"\n/>`,
		},
	],
}

const EXAMPLE_PREVIEWS = [
	<HStack key="semantics" gap={3} vAlign="center">
		<Button label="Flat" variant="ghost" clickAction={() => {}} />
		<Button label="Default" variant="secondary" clickAction={() => {}} />
		<Button label="Primary" variant="primary" clickAction={() => {}} />
		<Button label="Destructive" variant="destructive" clickAction={() => {}} />
	</HStack>,
	<Button key="badge" label="Button" variant="secondary" clickAction={() => {}} />,
]

const COMPONENT_PREVIEW = (
	<Button
		label="Button"
		variant="secondary"
		icon={<Icon name="sandbox-plus" />}
		endContent={<Badge label="New" variant="neutral" />}
		clickAction={() => {}}
	/>
)

export function DocumentationDesignTemplate() @{
	const [exampleTabs, setExampleTabs] = useState<Record<string, string>>({})
	const [activeId, setActiveId] = useState<string | undefined>(
		COMPONENT_OUTLINE_ITEMS[0]?.id,
	)
	const isMobile = useMediaQuery('(max-width: 768px)')

	const scrollToId = (id: string) => {
		setActiveId(id)
		const target = document.getElementById(id)
		if (target != null) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' })
			window.history.pushState(null, '', `#${id}`)
		}
	}

	<Layout
		height="auto"
		contentWidth={960}
		end={
			isMobile ? undefined : (
				<LayoutPanel
					isScrollable={false}
					label="On this page"
					role="complementary"
					style={outlinePanel}
				>
					<Outline
						items={COMPONENT_OUTLINE_ITEMS}
						onActiveIdChange={setActiveId}
					/>
				</LayoutPanel>
			)
		}
		content={
			<LayoutContent isScrollable={false} padding={8}>
				<VStack gap={8}>
					<VStack gap={2}>
						<Heading type="display-1" level={1}>{DOCS.name}</Heading>
						<Text type="supporting" color="secondary">
							March 30, 2026 · Updated 5:40 p.m. PST
						</Text>
						{isMobile ? (
							<Selector
								label="On this page"
								isLabelHidden
								options={COMPONENT_OUTLINE_OPTIONS}
								value={activeId}
								onValueChange={(v) => scrollToId(v ?? 'button')}
								width="100%"
							/>
						) : null}
					</VStack>

					<Card variant="muted" padding={0}>
						<Center height={360}>
							{COMPONENT_PREVIEW}
						</Center>
					</Card>

					<VStack gap={4}>
						<Heading id="usage" level={2}>
							Usage
						</Heading>
						<Text type="large" weight="normal">
							{DOCS.usage}
						</Text>
						<Heading id="best-practices" level={3}>
							Best practices
						</Heading>
						<Table
							data={DOCS.bestPractices as unknown as Record<string, unknown>[]}
							dividers="none"
							columns={[
								{
									key: 'type',
									header: 'Guidance',
									width: pixel(125),
									renderCell: (item: Record<string, unknown>) => (
										<Badge
											label={item.type === 'do' ? 'Do' : 'Dont'}
											variant={item.type === 'do' ? 'success' : 'error'}
										/>
									),
								},
								{
									key: 'text',
									header: 'Practices',
									renderCell: (item: Record<string, unknown>) => (
										<Text type="body">
											{item.text as string}
										</Text>
									),
								},
							]}

						/>
					</VStack>

					<Divider />

					<VStack gap={4}>
						<Heading id="examples" level={2}>
							Examples
						</Heading>
						<Text type="large" weight="normal">
							Explore common configurations, variations, and states for this
							component.
						</Text>
					</VStack>
					<VStack gap={8}>
						{DOCS.examples.map((example, i) => {
							const tabKey = `button-${i}`
							const activeTab = exampleTabs[tabKey] ?? 'description'
							return (
								<Card key={i} padding={0}>
									<Section padding={3} variant="transparent">
										<HStack gap={3} vAlign="center">
											<StackItem size="fill">
												<Text type="body" weight="medium">
													{example.title}
												</Text>
											</StackItem>
											<HStack gap={1} vAlign="center">
												<Button
													label="Open in Craft"
													variant="ghost"
													size="sm"
													icon={<Icon name="sandbox-arrow-top-right-on-square" size={16} />}
													clickAction={() => {}}
												/>
												<Button
													label="Send to CLI"
													variant="ghost"
													size="sm"
													clickAction={() => {}}
												/>
												<Button
													label="Fullscreen"
													variant="ghost"
													size="sm"
													isIconOnly
													icon={<Icon name="sandbox-arrows-pointing-out" size={16} />}
													clickAction={() => {}}
												/>
											</HStack>
										</HStack>
									</Section>
									<Center height={280}>
										{EXAMPLE_PREVIEWS[i] ?? (
											<Text type="supporting" color="secondary">
												Preview coming soon
											</Text>
										)}
									</Center>
									<Section variant="muted" padding={3} dividers={['top']}>
										<VStack gap={3}>
											<TabList
												value={activeTab}
												onChange={(value) =>
													setExampleTabs((prev) => ({
														...prev,
														[tabKey]: value,
													}))
												}
												size="sm"
												style={tabListFlush}
											>
												<Tab value="description" label="Description" />
												<Tab value="code" label="Code" />
											</TabList>
											{activeTab === 'description' ? (
												<Text type="body">{example.description}</Text>
											) : (
												<CodeBlock
													code={example.code}
													language="tsx"
													width="100%"
												/>
											)}
										</VStack>
									</Section>
								</Card>
							)
						})}
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
