// Copyright (c) Meta Platforms, Inc. and affiliates.

import { CodeBlock } from '@octane-xplat/ui'
import { VStack } from '@octane-xplat/ui'

export function CodeBlockBashCommand() {
	return (
		<VStack gap={4} style={{ width: '100%', maxWidth: 400 }}>
			<CodeBlock
				code="npm install @astryxdesign/core"
				language="bash"
				hasCopyButton
				style={{ width: '100%' }}
			/>
			<CodeBlock
				code="yarn add @astryxdesign/theme-neutral"
				language="bash"
				hasCopyButton
				style={{ width: '100%' }}
			/>
		</VStack>
	)
}
