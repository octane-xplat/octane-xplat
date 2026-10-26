// Template route screen — renders the ported example (or the honest pending
// placeholder) inside the PreviewShell chrome, matching upstream's
// (fullscreen) template wrappers: tree nav, command palette, source view,
// copy, viewport widths. ?embed=1 renders the content bare for the preview
// iframe.

import { Heading, Text, VStack, View } from '@octane-xplat/ui'
import { templateRow } from '../coverage/coverage'
import { exampleFor } from '../examples/registry'
import { SandboxLink } from '../shell/SandboxLink'
import { PendingScreen } from '../shell/PendingScreen'
import { PreviewShell } from '../shell/PreviewShell'
import { SandboxShell } from '../shell/SandboxShell'

export function TemplateScreen(props: { params: { name: string } }) @{
	const row = templateRow(props.params.name)

	if (!row) {
		return (
			<SandboxShell>
				<View className="sb-template-frame">
					<VStack gap={3}>
						<Heading level={1}>Unknown template</Heading>
						<Text type="body" color="secondary">
							“{props.params.name}” is not one of the 714 pinned template routes.
						</Text>
						<SandboxLink href="/templates/">Back to templates</SandboxLink>
					</VStack>
				</View>
			</SandboxShell>
		)
	}

	const Example = exampleFor(props.params.name)

	return (
		<PreviewShell row={row}>
			{Example ? <Example /> : <PendingScreen row={row} />}
		</PreviewShell>
	)
}
