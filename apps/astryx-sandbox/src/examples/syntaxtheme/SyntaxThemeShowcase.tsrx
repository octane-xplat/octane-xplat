// Copyright (c) Meta Platforms, Inc. and affiliates.

import { oneDarkPro } from './syntax-presets'
import { CodeBlock } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

const sampleCode = `async function save() {
  await api.update(values);
  toast.show('Saved');
}`

export function SyntaxThemeShowcase() {
	return (
		<>
			<Stack direction="vertical" gap={2} style={{ width: 360, maxWidth: '100%' }}>
				<Text type="supporting" weight="bold" color="secondary">
					One Dark Pro preset
				</Text>
				<CodeBlock syntaxTheme={oneDarkPro} code={sampleCode} language="tsx" />
			</Stack>
		</>
	)
}
