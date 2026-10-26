// Port of upstream ProjectCard.tsx — link card with hover elevation.
// `SandboxLink` preserves upstream's LinkProvider injection shape.

import { Heading, Text, Card, VStack } from '@octane-xplat/ui'
import { SandboxLink } from './SandboxLink'
import type { SandboxPage } from '../data/sandboxPages'

export function ProjectCard(props: { page: SandboxPage }) @{
	return (
		<SandboxLink className="sb-card-link" href={props.page.href}>
			<Card className="sb-card">
				<VStack gap={1}>
					<Heading level={3} maxLines={1}>{props.page.name}</Heading>
					<Text type="body" size="sm" color="secondary" maxLines={2}>{props.page.description}</Text>
				</VStack>
			</Card>
		</SandboxLink>
	)
}
