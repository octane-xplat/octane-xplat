// Port of upstream Hooks/useContainerRevealHookUsage.tsx (Astryx 0.6.4, MIT).
// Port of Astryx 0.6.4; Copyright (c) Meta Platforms, Inc. (MIT).
import { useContainerReveal, Card, VStack, HStack, Text, Button } from '@octane-xplat/ui'

function FileRow(props: { name: string }) @{
	const { getContainerProps, getContentRevealProps } = useContainerReveal()

	<HStack {...getContainerProps()} gap={3}>
		<VStack>
			<Text>{props.name}</Text>
			<Text color="secondary">Edited 2 hours ago</Text>
		</VStack>
		<HStack {...getContentRevealProps()} gap={1}>
			<Button
				label={`Edit ${props.name}`}
				variant="ghost"
				isIconOnly
				icon="sandbox-pencil-square"
			/>
			<Button label={`Delete ${props.name}`} variant="ghost" isIconOnly icon="sandbox-trash" />
		</HStack>
	</HStack>
}

export function UseContainerRevealHookUsage() @{
	<Card width={420} padding={2}>
		<VStack gap={3}>
			<Text color="secondary">
				Hover a row — or Tab into it — to reveal its actions. On touch they stay visible.
			</Text>
			<FileRow name="report.pdf" />
			<FileRow name="budget.xlsx" />
			<FileRow name="notes.txt" />
		</VStack>
	</Card>
}
