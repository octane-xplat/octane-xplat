import {
	Blockquote,
	Citation,
	Code,
	CodeBlock,
	Heading,
	MetadataList,
	MetadataListItem,
	Outline,
	ProgressBar,
	StatusDot,
	Text,
	Thumbnail,
	Timer,
	Timestamp,
	View,
	useOutlineFromMarkdown,
} from '@octane-xplat/ui'

const ARTICLE = `# Release notes\n\n## Highlights\n\n## Fixes`

/** Exercises the content-display family through portable props and composition. */
export function ContentDisplayDemo() @{
	const outline = useOutlineFromMarkdown(ARTICLE)

	<View className="content-display-demo gap-4">
		<Heading level={2}>Content display</Heading>
		<Blockquote cite="Octane release notes">
			A shared component tree for readable product content.
		</Blockquote>
		<Text>
			Install with <Code>pnpm add @octane-xplat/ui</Code> and copy examples with the code block action.
		</Text>
		<CodeBlock
			title="Example"
			language="typescript"
			code={'const value = 42\nconsole.log(value)'}
			hasLineNumbers={true}
			highlightLines={[1]}
		/>
		<MetadataList columns={2}>
			<MetadataListItem label="Status"><StatusDot variant="success" label="Ready" /> Ready</MetadataListItem>
			<MetadataListItem label="Updated"><Timestamp value="2026-10-01T12:00:00Z" format="date_time" /></MetadataListItem>
		</MetadataList>
		<Thumbnail alt="Release artwork" label="Release artwork" onPress={() => console.log('[probe] thumbnail pressed')} />
		<ProgressBar label="Upload" value={68} hasValueLabel={true} marks={[{ value: 50, label: 'Halfway' }]} />
		<Text>Elapsed <Timer startTime={Date.now() - 65000} format="clock" /></Text>
		<Heading level={3}>Article outline</Heading>
		<Outline items={outline} hasScrollOnClick={false} />
		<Citation source={{ title: 'Release notes', url: 'https://example.com/releases' }} number={1} />
	</View>
}
