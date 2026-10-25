// Template route screen — renders the ported example when one exists, the
// honest pending placeholder otherwise. Interim chrome: upstream wraps
// templates in PreviewShell (tree nav, palette, source view); that preview
// surface is a later unit's scope, so this frame just names the example and
// its upstream source.

import { Heading, Text, VStack, View, Divider } from '@octane-xplat/ui'
import { templateRow } from '../coverage/coverage'
import { exampleFor } from '../examples/registry'
import { SandboxLink } from '../shell/SandboxLink'
import { PendingScreen } from '../shell/PendingScreen'
import { SandboxShell } from '../shell/SandboxShell'

export function TemplateScreen(props: { params: { name: string } }) @{
	const row = templateRow(props.params.name)
	const example = exampleFor(props.params.name)

	if (!row) {
		return (
			<SandboxShell>
				<View className="sb-template-frame">
					<VStack gap={3}>
						<Heading level={1}>Unknown template</Heading>
						<Text className="sb-type-body sb-color-secondary">
							“{props.params.name}” is not one of the 714 pinned template routes.
						</Text>
						<SandboxLink href="/templates/">Back to templates</SandboxLink>
					</VStack>
				</View>
			</SandboxShell>
		)
	}

	if (!example) {
		return (
			<SandboxShell>
				<View className="sb-template-frame">
					<PendingScreen row={row} />
				</View>
			</SandboxShell>
		)
	}

	return (
		<SandboxShell>
			<View className="sb-template-frame">
				<VStack gap={1}>
					<Heading level={1}>{row.doc?.displayName ?? row.name}</Heading>
					<Text className="sb-pending-meta">{row.route} · {row.source}</Text>
				</VStack>
				<View className="sb-template-stage">{example}</View>
			</View>
		</SandboxShell>
	)
}
