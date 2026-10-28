// Port of upstream templates/pages/ai-chat-landing/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/ai-chat-landing/.
// GAPS: upstream `createStaticSource` is folded into an inline searchSource
// object (same contract); `TypeaheadItem` is not a public export — trigger
// menu rows render as plain VStack label+description; `useChatDictation`
// requires SpeechRecognition wiring and is omitted where unsupported by the
// host, matching upstream's own feature-detect fallback.
import { useRef, useState } from 'octane'
import {
	ClickableCard, DropdownMenu, Grid, Heading, HStack, Icon, Layout,
	LayoutContent, StackItem, Text, ToggleButton, ToggleButtonGroup, Token,
	VStack,
} from '@octane-xplat/ui'
import {
	ChatComposer, ChatComposerDrawer, ChatComposerInput,
} from '@octane-xplat/ui/chat'
import type {
	ChatComposerInputHandle, ChatComposerTrigger,
	ChatComposerTriggerItem,
} from '@octane-xplat/ui/chat'

const pageStyle = { minHeight: '100%' } as const
const composerInput = { minHeight: 84 } as const

const CATEGORY_SUGGESTIONS: Record<string, { heading: string; body: string; prompt: string }[]> = {
	writing: [
		{ heading: 'Draft a professional email', body: 'Compose a clear, polished email for any audience', prompt: 'Help me draft a professional email' },
		{ heading: 'Improve my writing', body: 'Enhance the clarity, tone, and flow of my text', prompt: 'Review and improve the following text:' },
		{ heading: 'Create a project proposal', body: 'Write a proposal with goals, timeline, and deliverables', prompt: 'Help me write a project proposal for' },
		{ heading: 'Summarize a document', body: 'Condense a long document into key takeaways', prompt: 'Summarize the following document into key points:' },
	],
	coding: [
		{ heading: 'Debug my code', body: 'Find and fix issues in a code snippet', prompt: 'Help me debug the following code:' },
		{ heading: 'Write a function', body: 'Generate a well-typed function with error handling', prompt: 'Write a function that' },
		{ heading: 'Explain this code', body: 'Break down complex code into understandable pieces', prompt: 'Explain what the following code does:' },
		{ heading: 'Review my pull request', body: 'Check for bugs, performance, and best practices', prompt: 'Review this code for bugs and improvements:' },
	],
	research: [
		{ heading: 'Compare options', body: 'Analyze pros and cons of different approaches', prompt: 'Compare the pros and cons of' },
		{ heading: 'Explain a concept', body: 'Break down a complex topic in simple terms', prompt: 'Explain the concept of' },
		{ heading: 'Find best practices', body: 'Research standards and recommended approaches', prompt: 'What are the best practices for' },
		{ heading: 'Summarize findings', body: 'Compile research into a structured overview', prompt: 'Summarize the key findings on' },
	],
	creative: [
		{ heading: 'Brainstorm ideas', body: 'Generate creative concepts for a project', prompt: 'Brainstorm ideas for' },
		{ heading: 'Write a story', body: 'Create an engaging narrative with characters', prompt: 'Write a short story about' },
		{ heading: 'Design a concept', body: 'Explore product or visual design ideas', prompt: 'Help me design a concept for' },
		{ heading: 'Create a tagline', body: 'Craft a memorable phrase for a brand or product', prompt: 'Create a catchy tagline for' },
	],
}

const CATEGORIES = [
	{ key: 'writing', label: 'Writing', icon: 'sandbox-pencil-square' },
	{ key: 'coding', label: 'Coding', icon: 'sandbox-code-bracket' },
	{ key: 'research', label: 'Research', icon: 'sandbox-magnifying-glass' },
	{ key: 'creative', label: 'Creative', icon: 'sandbox-light-bulb' },
] as const

const MODE_OPTIONS = [
	{ key: 'auto', label: 'Auto', icon: 'sandbox-sparkles' },
	...CATEGORIES,
	{ key: 'sensitive', label: 'Sensitive', icon: 'sandbox-lock-closed' },
] as const

const TOKEN_MODES: Record<string, string> = {
	sensitive: '/sensitive',
	deep: '/deep-mode',
}

const MENTION_ITEMS: ChatComposerTriggerItem<{ role: string }>[] = [
	{ id: 'cindy', label: 'Cindy Zhang', auxiliaryData: { role: 'Design Systems' } },
	{ id: 'alex', label: 'Alex Johnson', auxiliaryData: { role: 'Frontend' } },
	{ id: 'sam', label: 'Sam Rivera', auxiliaryData: { role: 'Backend' } },
	{ id: 'jordan', label: 'Jordan Lee', auxiliaryData: { role: 'Product' } },
	{ id: 'taylor', label: 'Taylor Kim', auxiliaryData: { role: 'Design' } },
	{ id: 'morgan', label: 'Morgan Chen', auxiliaryData: { role: 'Infrastructure' } },
]

const COMMAND_ITEMS: ChatComposerTriggerItem<{ description: string }>[] = [
	{ id: 'summarize', label: 'summarize', auxiliaryData: { description: 'Summarize the conversation' } },
	{ id: 'translate', label: 'translate', auxiliaryData: { description: 'Translate text to another language' } },
	{ id: 'search', label: 'search', auxiliaryData: { description: 'Search the web or documents' } },
	{ id: 'code', label: 'code', auxiliaryData: { description: 'Generate or explain code' } },
	{ id: 'help', label: 'help', auxiliaryData: { description: 'Show available commands' } },
]

const staticSource = <T extends ChatComposerTriggerItem>(items: T[]) => ({
	search: (query: string) =>
		items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
	bootstrap: () => items,
})

const renderTriggerItem = (item: ChatComposerTriggerItem) => (
	<VStack gap={0} padding={1}>
		<Text type="body">{item.label}</Text>
		<Text type="supporting" color="secondary">
			{Object.values(item.auxiliaryData ?? {})[0]}
		</Text>
	</VStack>
)

const mentionTrigger: ChatComposerTrigger = {
	character: '@',
	searchSource: staticSource(MENTION_ITEMS),
	renderItem: renderTriggerItem,
	onSelect: (item) => ({ value: `@${item.id}`, label: item.label, variant: 'blue' }),
}

const commandTrigger: ChatComposerTrigger = {
	character: '/',
	searchSource: staticSource(COMMAND_ITEMS),
	renderItem: renderTriggerItem,
	onSelect: (item) => ({ value: `/${item.label}`, label: `/${item.label}`, variant: 'yellow' }),
}

const composerTriggers = [mentionTrigger, commandTrigger]

export function AIChatLandingTemplate() @{
	const [mode, setMode] = useState<string | null>('auto')
	const [category, setCategory] = useState<string | null>(null)
	const [attachments, setAttachments] = useState<string[]>([
		'project_brief.pdf',
		'wireframes_v2.fig',
		'api_spec.yaml',
		'user_research.csv',
		'brand_guidelines.pdf',
	])
	const composerInputRef = useRef<ChatComposerInputHandle | null>(null)

	const activeMode = MODE_OPTIONS.find((m) => m.key === mode) ?? MODE_OPTIONS[0]
	const suggestions = category ? CATEGORY_SUGGESTIONS[category] : null

	const applySuggestion = (prompt: string) => {
		const input = composerInputRef.current
		if (!input) {return}
		input.focus()
		input.insertText(prompt)
	}

	const insertMention = (item: (typeof MENTION_ITEMS)[number]) => {
		const input = composerInputRef.current
		if (!input) {return}
		input.focus()
		input.insertToken({ value: `@${item.id}`, label: item.label, variant: 'blue' })
	}

	const insertModeToken = (label: string) => {
		composerInputRef.current?.focus()
		composerInputRef.current?.insertToken({ value: label, label, variant: 'orange' })
	}

	<Layout
		height="fill"
		contentWidth={720}
		padding={6}
		content={
			<LayoutContent>
				<VStack gap={8} vAlign="center" style={pageStyle}>
					<VStack gap={1}>
						<HStack gap={2} vAlign="center">
							<Icon name="sandbox-sparkles" size={20} color="accent" />
							<Text type="large">Hi, Andrew</Text>
						</HStack>
						<Heading type="display-2" level={1}>
							Where should we start?
						</Heading>
					</VStack>

					<ChatComposer
						onSend={() => {}}
						placeholder="Ask anything"
						input={
							<ChatComposerInput
								ref={composerInputRef}
								triggers={composerTriggers}
								style={composerInput}
								onFiles={(files) =>
									setAttachments((prev) => [...prev, ...files.map((f) => f.name)])
								}
							/>
						}
						drawer={
							attachments.length > 0 ? (
								<ChatComposerDrawer count={attachments.length}>
									{attachments.map((name) => (
										<Token
											key={name}
											label={name}
											onRemove={() =>
												setAttachments((prev) => prev.filter((n) => n !== name))
											}
										/>
									))}
								</ChatComposerDrawer>
							) : undefined
						}
						headerActions={
							<DropdownMenu
								button={{
									label: 'Reference',
									variant: 'ghost',
									size: 'sm',
									icon: <Icon name="sandbox-at-symbol" size={16} />,
									isIconOnly: true,
								}}
								hasChevron={false}
								menuWidth={240}
								items={MENTION_ITEMS.map((item) => ({
									type: 'action' as const,
									key: item.id,
									label: item.label,
									description: item.auxiliaryData?.role,
									onSelect: () => insertMention(item),
								}))}
							/>
						}
						footerActions={
							<>
								<DropdownMenu
									button={{
										label: activeMode.label,
										variant: 'ghost',
										size: 'md',
										icon: <Icon name={activeMode.icon} size={16} />,
									}}
									menuWidth={200}
									items={MODE_OPTIONS.flatMap((opt) => {
										const menuItem = {
											type: 'action' as const,
											key: opt.key,
											label: opt.label,
											icon: <Icon name={opt.icon} size={16} />,
											onSelect: () => {
												const tokenLabel = TOKEN_MODES[opt.key]
												if (tokenLabel) {
													insertModeToken(tokenLabel)
												} else {
													setMode(opt.key)
												}
											},
										}
										return opt.key === 'sensitive'
											? [{ type: 'separator' as const, key: 'd' }, menuItem]
											: [menuItem]
									}) as never}
								/>
								<DropdownMenu
									button={{
										label: 'Settings',
										variant: 'ghost',
										size: 'md',
										icon: <Icon name="sandbox-cog-6-tooth" size={16} />,
									}}
									menuWidth={200}
									items={[
										{ type: 'action', key: 'prefs', label: 'Preferences', onSelect: () => {} },
										{ type: 'action', key: 'keys', label: 'Keyboard shortcuts', onSelect: () => {} },
										{ type: 'action', key: 'about', label: 'About', onSelect: () => {} },
									]}
								/>
							</>
						}
					/>

					<VStack gap={6} padding={3}>
						<ToggleButtonGroup
							label="Category"
							value={category}
							onChange={(v) => setCategory(v ?? '')}
							size="lg"
						>
							{CATEGORIES.map((cat) => (
								<ToggleButton
									key={cat.key}
									value={cat.key}
									label={cat.label}
									icon={<Icon name={cat.icon} size={16} />}
								/>
							))}
						</ToggleButtonGroup>

						{suggestions ? (
							<Grid columns={{ minWidth: 280 }} style={{ gap: 'var(--spacing-3)' }}>
								{suggestions.map((suggestion) => (
									<ClickableCard
										key={suggestion.heading}
										label={suggestion.heading}
										variant="muted"
										padding={3}
										onPress={() => {
											applySuggestion(suggestion.prompt)
											setMode(category)
										}}
									>
										<VStack gap={0.5}>
											<Heading level={4}>{suggestion.heading}</Heading>
											<Text type="body" color="secondary" size="xsm">
												{suggestion.body}
											</Text>
										</VStack>
									</ClickableCard>
								))}
							</Grid>
						) : null}
					</VStack>
				</VStack>
			</LayoutContent>
		}
	/>
}
