// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerInput, type ChatComposerTrigger } from '@octane-xplat/ui/chat'
import { createStaticSource } from '@octane-xplat/ui'
import { TypeaheadItem } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'

const COMMANDS: SearchableItem<{ description: string }>[] = [
	{
		id: 'summarize',
		label: 'summarize',
		auxiliaryData: { description: 'Summarize the conversation' },
	},
	{
		id: 'translate',
		label: 'translate',
		auxiliaryData: { description: 'Translate text to another language' },
	},
	{
		id: 'search',
		label: 'search',
		auxiliaryData: { description: 'Search the web or documents' },
	},
	{
		id: 'code',
		label: 'code',
		auxiliaryData: { description: 'Generate or explain code' },
	},
	{
		id: 'help',
		label: 'help',
		auxiliaryData: { description: 'Show available commands' },
	},
]

const commandSource = createStaticSource(COMMANDS)

export function ChatComposerInputSlashCommands() {
	const commandTrigger: ChatComposerTrigger = {
		character: '/',
		searchSource: commandSource,
		renderItem: (item) => (
			<TypeaheadItem
				item={item}
				description={(item.auxiliaryData as { description: string })?.description}
			/>
		),
		onSelect: (item) => ({
			value: `/${item.label}`,
			label: `/${item.label}`,
			variant: 'yellow' as const,
		}),
	}

	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				input={
					<ChatComposerInput triggers={[commandTrigger]} placeholder="Type / for commands..." />
				}
			/>
		</Stack>
	)
}
