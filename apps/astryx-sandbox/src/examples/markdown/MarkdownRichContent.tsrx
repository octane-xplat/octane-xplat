// Copyright (c) Meta Platforms, Inc. and affiliates.

import { Center } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'

const content = [
	'# Markdown Demo',
	'',
	'Renders **markdown** with *Astryx* styling.',
	'',
	'## Features',
	'',
	'- **Bold**, *italic*, `code`',
	'- [Links](https://example.com)',
	'',
	'```typescript',
	'interface User {name: string;}',
	'```',
	'',
	'- [x] Parser',
	'- [ ] Stories',
].join('\n')

export function MarkdownRichContent() {
	return (
		<Center width="100%" style={{ maxWidth: 450 }}>
			<Markdown text={content} />
		</Center>
	)
}
