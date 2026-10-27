// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerDrawer } from '@octane-xplat/ui/chat'
import { Token } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'

export function ChatComposerDrawerCollapsible() {
	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				drawer={
					<ChatComposerDrawer count={6} label="Files">
						<Token label="design-spec.pdf" onRemove={() => {}} />
						<Token label="api-schema.json" onRemove={() => {}} />
						<Token label="screenshot.png" onRemove={() => {}} />
						<Token label="meeting-notes.md" onRemove={() => {}} />
						<Token label="test-results.csv" onRemove={() => {}} />
						<Token label="deploy-log.txt" onRemove={() => {}} />
					</ChatComposerDrawer>
				}
			/>
		</Stack>
	)
}
