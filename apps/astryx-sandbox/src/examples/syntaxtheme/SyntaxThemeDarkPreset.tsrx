// Copyright (c) Meta Platforms, Inc. and affiliates.

import { dracula } from './syntax-presets'
import { CodeBlock } from '@octane-xplat/ui'

const code = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}`

export function SyntaxThemeDarkPreset() {
	return (
		<>
			<CodeBlock syntaxTheme={dracula} code={code} language="tsx" title="Dracula preset" />
		</>
	)
}
