import { useState } from 'octane'
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { HStack, Text, View } from '@octane-xplat/ui'

export function FileInputDemo() @{
	const [value, setValue] = useState<FileInputFile[] | null>([])

	<View className="gap-4 p-4">
		<Text className="text-lg font-semibold">File entry</Text>
		<FileInput
			label="Attachments"
			description="Choose one or more files. The platform picker opens automatically."
			mode="dropzone"
			isMultiple
			accept="image/*,.pdf"
			value={value}
			onChange={(next) => setValue(Array.isArray(next) ? next : next ? [next] : [])}
		/>
		<HStack className="flex-wrap gap-2">
			<Text>Selected: {value?.length ?? 0}</Text>
		</HStack>
	</View>
}
