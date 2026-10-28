// Port of upstream Dialog/DialogFullscreenDialog.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import {
	Button,
	Card,
	Dialog,
	DialogHeader,
	HStack,
	ScrollableArea,
	Text,
	VStack,
} from '@octane-xplat/ui'

const SECTIONS = [
	{
		title: 'Getting started',
		body: 'Create your first project by clicking New Project in the sidebar. Choose a template or start from scratch.',
	},
	{
		title: 'Team members',
		body: 'Invite collaborators from Settings > Team. Each member can have Admin, Editor, or Viewer permissions.',
	},
	{
		title: 'Billing',
		body: 'Free plans include up to 3 projects. Upgrade to Pro for unlimited projects and priority support.',
	},
	{
		title: 'API access',
		body: 'Generate API keys from Settings > Developer. Rate limits are 1,000 requests per minute on free plans.',
	},
	{
		title: 'Data export',
		body: 'Export your data anytime from Settings > Data. Exports are available as CSV or JSON within 24 hours.',
	},
]

export function DialogFullscreenDialog() @{
	const [isOpen, setIsOpen] = useState(false)
	return (
		<Card>
			<VStack gap={3}>
				<VStack gap={1}>
					<Text type="body" style={{ fontWeight: 600 }}>
						Help &amp; Documentation
					</Text>
					<Text type="supporting" color="secondary">
						5 articles · Last updated Apr 2026
					</Text>
				</VStack>
				<Button
					label="Open documentation"
					variant="secondary"
					clickAction={() => setIsOpen(true)}
				/>
			</VStack>
			<Dialog isOpen={isOpen} onOpenChange={setIsOpen} variant="fullscreen">
				<VStack>
					<DialogHeader
						title="Documentation"
						subtitle="Everything you need to get started"
						onOpenChange={setIsOpen}
					/>
					<ScrollableArea style={{ padding: 'var(--spacing-4)' }}>
						<VStack gap={4}>
							{SECTIONS.map((s) => (
								<VStack key={s.title} gap={1}>
									<Text type="body" style={{ fontWeight: 600 }}>
										{s.title}
									</Text>
									<Text type="body">{s.body}</Text>
								</VStack>
							))}
						</VStack>
					</ScrollableArea>
					<HStack justify="end" style={{ padding: 'var(--spacing-4)' }}>
						<Button label="Close" variant="primary" clickAction={() => setIsOpen(false)} />
					</HStack>
				</VStack>
			</Dialog>
		</Card>
	)
}
