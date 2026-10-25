// Port of upstream Theme/useThemeHookUsage.tsx (Astryx 0.6.4, MIT).
// useTheme resolves concrete token values for a non-CSS-painted bar chart.
// Upstream draws <svg><rect> — SVG intrinsics don't render on the shared
// renderer, so the bars are positioned divs painted with the same resolved
// token values (recorded adaptation; contract preserved).
import { useTheme, Card, HStack, VStack, Text, View } from '@octane-xplat/ui'

export function UseThemeHookUsage() @{
	const { name, mode, token } = useTheme()
	const accent = token('--color-accent')
	const muted = token('--color-accent-muted')
	const text = token('--color-text-primary')

	return (
		<Card width={360} padding={4}>
			<VStack gap={3}>
				<Text className="sb-type-body" style={{ fontWeight: 700 }}>
					{name} · {mode}
				</Text>
				<View
					accessibilityLabel="Themed bar chart"
					style={{ width: 300, height: 120, position: 'relative' }}
				>
					<View className="sb-chart-bar" style={{ position: 'absolute', left: 24, top: 20, width: 64, height: 80, borderRadius: 8, backgroundColor: accent }} />
					<View className="sb-chart-bar" style={{ position: 'absolute', left: 118, top: 48, width: 64, height: 52, borderRadius: 8, backgroundColor: muted }} />
					<View className="sb-chart-bar" style={{ position: 'absolute', left: 212, top: 32, width: 64, height: 68, borderRadius: 8, backgroundColor: accent, opacity: 0.72 }} />
					<Text style={{ position: 'absolute', left: 24, top: 104, fontSize: 12, color: text }}>
						Resolved token values
					</Text>
				</View>
				<HStack gap={2}>
					<Text className="sb-type-code">--color-accent</Text>
					<Text className="sb-type-code sb-color-secondary">{accent}</Text>
				</HStack>
			</VStack>
		</Card>
	)
}
