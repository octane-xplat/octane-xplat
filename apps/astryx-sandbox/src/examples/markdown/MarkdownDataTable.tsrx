// Copyright (c) Meta Platforms, Inc. and affiliates.

import { Center } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'

const content = [
	'## Comparison Table',
	'',
	'| Feature | React | Vue | Svelte |',
	'|:--------|:-----:|:---:|-------:|',
	'| Virtual DOM | Yes | Yes | No |',
	'| Bundle Size | ~40KB | ~30KB | ~2KB |',
	'| TypeScript | Native | Plugin | Native |',
	'| Learning Curve | Medium | Easy | Easy |',
].join('\n')

export function MarkdownDataTable() {
	return (
		<Center width="100%" style={{ maxWidth: 450 }}>
			<Markdown text={content} />
		</Center>
	)
}
