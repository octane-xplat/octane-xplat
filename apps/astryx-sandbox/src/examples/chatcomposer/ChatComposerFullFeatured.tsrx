// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState, useRef, useEffect } from 'octane'
import { ChatComposer, ChatComposerDrawer, ChatComposerInput } from '@octane-xplat/ui/chat'
import { Token } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { DropdownMenu } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { ProgressBar } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatComposerFullFeatured() {
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => clearTimeout(timer.current), [])
	const [isStreaming, setIsStreaming] = useState(false)

	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<Text type="supporting" color="secondary">
				All slots populated
			</Text>
			<ChatComposer
				onSend={(value) => {
					console.log('Sent:', value)
					setIsStreaming(true)
					clearTimeout(timer.current)
					timer.current = setTimeout(() => setIsStreaming(false), 3000)
				}}
				isStopShown={isStreaming}
				onCancel={() => {
					clearTimeout(timer.current)
					setIsStreaming(false)
				}}
				placeholder="Ask me anything..."
				input={<ChatComposerInput style={{ minHeight: 44 }} />}
				drawer={
					<ChatComposerDrawer count={5}>
						<Token label="design-spec.pdf" onRemove={() => {}} />
						<Token label="requirements.docx" onRemove={() => {}} />
						<Token label="wireframes.fig" onRemove={() => {}} />
						<Token label="api-spec.yaml" onRemove={() => {}} />
						<Token label="user-research.csv" onRemove={() => {}} />
					</ChatComposerDrawer>
				}
				headerActions={
					<>
						<Button
							label="Mention"
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chat-at" />}
							isIconOnly
						/>
						<Button
							label="Attach file"
							variant="ghost"
							size="sm"
							icon={<Icon name="sandbox-chat-paperclip" />}
							isIconOnly
						/>
					</>
				}
				headerContext={<ProgressBar label="Context window" value={50} isLabelHidden />}
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
	)
}
