import { useState } from 'octane'
import {
	View,
	Text,
	HStack,
	Pressable,
	Icon,
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLink,
	useClipboard,
} from '@octane-xplat/ui'

import { docsIcons } from './icons'

/** A copyable prompt for handing a documented task to a coding agent. */
export function AgentPrompt(props: { prompt: string }) @{
	const [expanded, setExpanded] = useState(false)
	const [failed, setFailed] = useState(false)
	const clipboard = useClipboard({
		getItems: () => props.prompt,
		onCopy: (success) => {
			setFailed(!success)
			if (!success) {
				setExpanded(true)
			}
		},
	})

	const copy = async () => {
		await clipboard.copy()
	}

	<View id="agent-prompt" className="agent-prompt" accessibilityLabel="Agent Prompt">
		<HStack className="agent-prompt-header">
			<HStack className="agent-prompt-label">
				<Icon name="docs-code" registry={docsIcons} size={16} />
				<Text>Agent Prompt</Text>
			</HStack>
			<HStack className="agent-prompt-tools">
				<Pressable
					className="agent-prompt-icon-button"
					accessibilityLabel="Copy prompt"
					onPress={copy}
				>
					<Icon name={clipboard.isCopied && !failed ? 'xplat-check' : 'xplat-copy'} size={16} />
				</Pressable>
				<DropdownMenu
					button={{
						label: 'Open prompt actions',
						isIconOnly: true,
						icon: 'xplat-chevron-down',
						className: 'agent-prompt-icon-button agent-prompt-actions',
						variant: 'ghost',
					}}
					hasChevron={false}
					label="Prompt actions"
					alignment="end"
					menuWidth={170}
					menuClassName="agent-prompt-menu"
				>
					<DropdownMenuItem label="Copy prompt" onSelect={copy} />
					<DropdownMenuLink
						label="Open in ChatGPT"
						href={`https://chatgpt.com/?q=${encodeURIComponent(props.prompt)}`}
						target="_blank"
					/>
				</DropdownMenu>
			</HStack>
		</HStack>
		<View className="agent-prompt-body">
			<View className={expanded ? 'agent-prompt-text is-expanded' : 'agent-prompt-text'}>
				<Text className="agent-prompt-copy">{props.prompt}</Text>
			</View>
			<Text
				className={failed ? 'agent-prompt-status is-error' : 'agent-prompt-status'}
				accessibilityRole="status"
				accessibilityLiveRegion="polite"
			>
				{failed
					? 'Could not copy. Select the prompt text to copy it.'
					: clipboard.isCopied
						? 'Prompt copied'
						: ''}
			</Text>
			<Pressable
				className="agent-prompt-expand"
				accessibilityState={{ expanded }}
				onPress={() => setExpanded(!expanded)}
			>
				<Text>{expanded ? 'Show less' : 'Show more'}</Text>
			</Pressable>
		</View>
	</View>
}
