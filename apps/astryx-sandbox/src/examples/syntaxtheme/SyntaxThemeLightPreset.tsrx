// Copyright (c) Meta Platforms, Inc. and affiliates.

import { githubLight } from './syntax-presets'
import { CodeBlock } from '@octane-xplat/ui'

const code = `const status = response.ok ? 'success' : 'error';
console.log({status});`

export function SyntaxThemeLightPreset() {
	return (
		<>
			<CodeBlock syntaxTheme={githubLight} code={code} language="tsx" title="GitHub Light preset" />
		</>
	)
}
