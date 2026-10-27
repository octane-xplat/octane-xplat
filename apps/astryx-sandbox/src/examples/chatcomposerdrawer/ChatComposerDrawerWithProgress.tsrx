// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerDrawer } from '@octane-xplat/ui/chat'
import { Token } from '@octane-xplat/ui'
import { ProgressBar } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'

export function ChatComposerDrawerWithProgress() {
	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				drawer={
					<ChatComposerDrawer count={3} label="Attachments">
						<Token label="design-spec.pdf" onRemove={() => {}} />
						<Token label="api-schema.json" onRemove={() => {}} />
						<Token label="screenshot.png" onRemove={() => {}} />
					</ChatComposerDrawer>
				}
				headerActions={
					<>
						<Button
							label="Mention"
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chat-at" size={16} />}
							isIconOnly
							clickAction={() => {}}
						/>
						<Button
							label="Attach"
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chat-paperclip" size={16} />}
							isIconOnly
							clickAction={() => {}}
						/>
					</>
				}
				headerContext={
					<Stack direction="horizontal" gap={2} vAlign="center">
						<ProgressBar value={42} label="Context usage" isLabelHidden />
					</Stack>
				}
			/>
		</Stack>
	)
}
