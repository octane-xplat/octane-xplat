// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerDrawer } from '@octane-xplat/ui/chat'
import { Token } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'

import type { StyleProp } from '@octane-xplat/ui'

const drawerBorder: StyleProp = {
	border: 'var(--border-width) solid var(--color-border)',
	borderTopLeftRadius: 'var(--radius-chat)',
	borderTopRightRadius: 'var(--radius-chat)',
}

export function ChatComposerDrawerShowcase() {
	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				drawer={
					<ChatComposerDrawer count={4} label="Attachments" style={drawerBorder}>
						<Token label="design-spec.pdf" onRemove={() => {}} />
						<Token label="api-schema.json" onRemove={() => {}} />
						<Token label="screenshot.png" onRemove={() => {}} />
						<Token label="meeting-notes.md" onRemove={() => {}} />
					</ChatComposerDrawer>
				}
				headerActions={
					<Button
						label="Attach"
						variant="ghost"
						size="sm"
						icon={<Icon name="sandbox-chat-paperclip" size={16} />}
						isIconOnly
						clickAction={() => {}}
					/>
				}
			/>
		</Stack>
	)
}
