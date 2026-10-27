// Copyright (c) Meta Platforms, Inc. and affiliates.

import { Markdown } from '@octane-xplat/ui/markdown'
import { Center } from '@octane-xplat/ui'

const content = [
	'# Markdown Demo',
	'',
	'Renders **markdown** with *design-system-consistent* styling.',
	'',
	'## Features',
	'',
	'- Headings mapped to the Astryx type scale',
	'- **Bold**, *italic*, and ~~strikethrough~~ text',
	'- [Links](https://example.com) with external detection',
	'',
	'> Block quote indented text',
].join('\n')

export function MarkdownShowcase() {
	return (
		<Center width={400}>
			<Markdown text={content} />
		</Center>
	)
}
