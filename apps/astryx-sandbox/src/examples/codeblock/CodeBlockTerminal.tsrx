// Copyright (c) Meta Platforms, Inc. and affiliates.

import { githubDark } from '../syntaxtheme/syntax-presets'
import { CodeBlock } from '@octane-xplat/ui'

const commands = `$ astryx init --features agents
✓ AI agent docs installed → AGENTS.md
$ pnpm astryx component CodeBlock --dense`

export function CodeBlockTerminal() {
	return (
		<>
			<CodeBlock
				syntaxTheme={githubDark}
				code={commands}
				language="bash"
				hasCopyButton
				style={{ width: '100%', maxWidth: 480 }}
			/>
		</>
	)
}
