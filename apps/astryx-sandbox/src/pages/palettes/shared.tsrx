// Shared page helpers for the palette preview screens — the display-text
// specimen sections upstream inlines per page.
import { Text, VStack } from '@octane-xplat/ui'

export function DisplayTextSection(props: {
	title: string
	family: string
	sizes: { size: number; weight?: number; letterSpacing?: string }[]
}) @{
	return (
		<VStack gap={2}>
			<Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{props.title}</Text>
			<VStack gap={2}>
				{props.sizes.map((s, i) => (
					<Text
						key={i}
						style={{
							fontFamily: props.family,
							fontSize: s.size,
							fontWeight: s.weight ?? 400,
							letterSpacing: s.letterSpacing,
							lineHeight: 1.15,
							color: 'var(--color-text-primary)',
						}}
					>
						Display {i + 1}
					</Text>
				))}
			</VStack>
		</VStack>
	)
}
