// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { ChatComposer, ChatComposerInput, type ChatComposerTrigger } from '@octane-xplat/ui/chat'
import { createStaticSource } from '@octane-xplat/ui'
import { TypeaheadItem } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

const USERS: SearchableItem<{ role: string }>[] = [
	{ id: 'cindy', label: 'Cindy Zhang', auxiliaryData: { role: 'Design Systems' } },
	{ id: 'alex', label: 'Alex Johnson', auxiliaryData: { role: 'Frontend' } },
	{ id: 'sam', label: 'Sam Rivera', auxiliaryData: { role: 'Backend' } },
	{ id: 'jordan', label: 'Jordan Lee', auxiliaryData: { role: 'Product' } },
]

const userSource = createStaticSource(USERS)

export function ChatComposerInputMentionTrigger() {
	const [value, setValue] = useState('')

	const mentionTrigger: ChatComposerTrigger = {
		character: '@',
		searchSource: userSource,
		renderItem: (item) => (
			<TypeaheadItem item={item} description={(item.auxiliaryData as { role: string })?.role} />
		),
		onSelect: (item) => ({
			value: `@${item.id}`,
			label: item.label,
			variant: 'blue' as const,
		}),
	}

	return (
		<Stack direction="vertical" gap={3} width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => setValue('')}
				input={
					<ChatComposerInput
						value={value}
						onChange={setValue}
						triggers={[mentionTrigger]}
						placeholder="Type @ to mention someone..."
					/>
				}
			/>
			<Text type="supporting" color="secondary">
				Value: {JSON.stringify(value)}
			</Text>
		</Stack>
	)
}
