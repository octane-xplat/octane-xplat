// Port of upstream templates/pages/documentation-technical/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/documentation-technical/.
// GAPS: DropdownMenu items take {type:'action',key,label,onSelect} (upstream
// {label,onClick}); clipboard writes go through public copyText; Selector
// `onChange` → `onValueChange`.
import { useCallback, useState } from 'octane'
import {
	Button, Card, CodeBlock, copyText, Divider, DropdownMenu, Heading, HStack,
	Icon, Layout, LayoutContent, LayoutPanel, List, ListItem, Outline,
	Selector, StackItem, Text, useMediaQuery, VStack,
} from '@octane-xplat/ui'
import type { OutlineItem } from '@octane-xplat/ui'

const OUTLINE_ITEMS: OutlineItem[] = [
	{ id: 'prerequisites', label: 'Prerequisites', level: 2 },
	{ id: 'install-package', label: 'Install the package', level: 2 },
	{ id: 'configure-theming', label: 'Configure theming', level: 2 },
	{ id: 'next-steps', label: 'Next steps', level: 2 },
]

const OUTLINE_OPTIONS = OUTLINE_ITEMS.map((item) => ({
	value: item.id,
	label: item.label,
}))

const outlinePanel = {
	position: 'sticky',
	top: 24,
	alignSelf: 'start',
	paddingBlockStart: 120,
} as const

const AI_PROMPT =
	'Help me get set up with Product Name. Based on my project, do the following: 1. Install @astryxdesign/core and the StyleX compiler. 2. Wrap my app in ThemeProvider. 3. Replace one existing component with an Astryx equivalent. After setup, suggest relevant next steps based on my project.'

export function DocumentationTechnicalTemplate() @{
	const [activeId, setActiveId] = useState<string | undefined>(OUTLINE_ITEMS[0]?.id)
	const isMobile = useMediaQuery('(max-width: 768px)')

	const scrollToId = useCallback((id: string) => {
		setActiveId(id)
		const target = document.getElementById(id)
		if (target != null) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' })
			window.history.pushState(null, '', `#${id}`)
		}
	}, [])

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
					<Outline items={OUTLINE_ITEMS} onActiveIdChange={setActiveId} />
				</LayoutPanel>
			)
		}
		content={
			<LayoutContent isScrollable={false} padding={8}>
				<VStack gap={8}>
					<VStack gap={2}>
						<Text type="display-1">Getting started with Product Name</Text>
						<Text type="supporting" color="secondary">
							Last updated March 30, 2026
						</Text>
						{isMobile ? (
							<Selector
								label="On this page"
								isLabelHidden
								options={OUTLINE_OPTIONS}
								value={activeId}
								onValueChange={(id) => { if (id != null) {scrollToId(id)} }}
								width="100%"
							/>
						) : null}
					</VStack>

					<Card>
						<VStack gap={3}>
							<HStack gap={2} vAlign="center">
								<StackItem size="fill">
									<HStack gap={2} vAlign="center">
										<Icon name="sandbox-sparkles" size={16} color="secondary" />
										<Text type="body" weight="semibold">
											AI Assistance
										</Text>
									</HStack>
								</StackItem>
								<Button
									label="Copy prompt"
									variant="ghost"
									size="sm"
									icon={<Icon name="sandbox-clipboard-document" />}
									clickAction={async () => { await copyText(AI_PROMPT) }}
								/>
								<DropdownMenu
									button={{
										label: 'More options',
										variant: 'ghost',
										size: 'sm',
										isIconOnly: true,
										icon: <Icon name="sandbox-chevron-down" />,
									}}
									items={[
										{ type: 'action', key: 'v0', label: 'Open in v0', onSelect: () => {} },
										{ type: 'action', key: 'claude', label: 'Open in Claude', onSelect: () => {} },
										{ type: 'action', key: 'chatgpt', label: 'Open in ChatGPT', onSelect: () => {} },
										{ type: 'action', key: 'cursor', label: 'Open in Cursor', onSelect: () => {} },
									]}
								/>
							</HStack>
							<Text type="body" color="secondary">
								Help me get set up with Product Name. Based on my project, do
								the following: 1. Install @astryxdesign/core and the StyleX
								compiler. 2. Wrap my app in ThemeProvider. 3. Replace one
								existing component with an Astryx equivalent.
							</Text>
						</VStack>
					</Card>

					<VStack gap={4}>
						<Heading id="prerequisites" level={2}>
							Prerequisites
						</Heading>
						<List density="compact" listStyle="disc">
							<ListItem label="Node.js 18+" />
							<ListItem label="React 18 or 19" />
							<ListItem label="A package manager (npm, yarn, or pnpm)" />
						</List>
					</VStack>

					<Divider />

					<VStack gap={4}>
						<Heading id="install-package" level={2}>
							Install the package
						</Heading>
						<Text type="body">
							Every project starts with installing the core package. This
							gives you access to all components, tokens, and utilities.
						</Text>
						<VStack gap={2}>
							<Text type="body" weight="bold">
								Step 1: Install the core package
							</Text>
							<CodeBlock
								code="npm install @astryxdesign/core"
								language="bash"
								width="100%"
							/>
						</VStack>
						<VStack gap={2}>
							<Text type="body" weight="bold">
								Step 2: Import the precompiled styles
							</Text>
							<Text type="body" color="secondary">
								Astryx ships precompiled CSS, so there is no build plugin to
								configure. Import the reset and component stylesheets once at
								your app entry point.
							</Text>
							<CodeBlock
								code={`import '@astryxdesign/core/reset.css';\nimport '@astryxdesign/core/astryx.css';`}
								language="tsx"
								width="100%"
							/>
						</VStack>
						<VStack gap={2}>
							<Text type="body" weight="bold">
								Step 3: Import your first component
							</Text>
							<CodeBlock
								code={`import { Button } from '@astryxdesign/core/Button';\n\nexport default function App() {\n  return <Button label="Hello Astryx" variant="primary" />;\n}`}
								language="tsx"
								width="100%"
							/>
						</VStack>
					</VStack>

					<Divider />

					<VStack gap={4}>
						<Heading id="configure-theming" level={2}>
							Configure theming
						</Heading>
						<Text type="body">
							Astryx ships with a default theme that works out of the box. To
							customize colors, typography, and spacing, wrap your app in a
							theme provider.
						</Text>
						<CodeBlock
							code={`import { ThemeProvider } from '@astryxdesign/core/Theme';\n\nexport default function App({ children }) {\n  return (\n    <ThemeProvider theme="default">\n      {children}\n    </ThemeProvider>\n  );\n}`}
							language="tsx"
							width="100%"
						/>
						<Text type="body" color="secondary">
							See the theming guide for the full list of customizable tokens.
						</Text>
					</VStack>

					<Divider />

					<VStack gap={4}>
						<Heading id="next-steps" level={2}>
							Next steps
						</Heading>
						<List density="compact" listStyle="disc">
							<ListItem label="Fundamental concepts — How theming, layout, and composition work" />
							<ListItem label="Component API reference — Props, variants, and examples for every component" />
							<ListItem label="Accessibility — Built-in a11y features and ARIA patterns" />
							<ListItem label="CLI tools — Scaffold projects and manage templates" />
							<ListItem label="Design tokens — Colors, spacing, typography, and sizing" />
						</List>
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
