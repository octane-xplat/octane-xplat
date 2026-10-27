// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer } from '@octane-xplat/ui/chat'
import { Button } from '@octane-xplat/ui'
import { DropdownMenu } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatComposerFooterActions() {
	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Model selector and settings dropdowns
				</Text>
				<ChatComposer
					onSend={(value) => {
						console.log('Sent:', value)
					}}
					footerActions={
						<>
							<DropdownMenu
								button={{
									label: 'Auto',
									variant: 'ghost',
									size: 'md',
									icon: <Icon name="sandbox-chat-sparkles" size={16} />,
									children: 'Auto',
								}}
								menuWidth={200}
								items={[
									{ key: 'Auto', label: 'Auto', type: 'action', onSelect: () => {} },
									{ key: 'Model A', label: 'Model A', type: 'action', onSelect: () => {} },
									{ key: 'Model B', label: 'Model B', type: 'action', onSelect: () => {} },
									{ key: 'Model C', label: 'Model C', type: 'action', onSelect: () => {} },
								]}
							/>
							<DropdownMenu
								button={{
									label: 'Settings',
									variant: 'ghost',
									size: 'md',
									icon: <Icon name="sandbox-cog" size={16} />,
									children: 'Settings',
								}}
								menuWidth={200}
								items={[
									{ key: 'Preferences', label: 'Preferences', type: 'action', onSelect: () => {} },
									{
										key: 'Keyboard shortcuts',
										label: 'Keyboard shortcuts',
										type: 'action',
										onSelect: () => {},
									},
									{ key: 'About', label: 'About', type: 'action', onSelect: () => {} },
								]}
							/>
						</>
					}
					sendActions={
						<Button
							label="Microphone"
							variant="ghost"
							size="md"
							icon={<Icon name="sandbox-chat-mic" />}
							isIconOnly
						/>
					}
				/>
			</Stack>
		</Stack>
	)
}
