// Layout/LayoutHeader/LayoutContent composed from public parts — the Layout
// part family is a recorded framework gap, so page chrome is composed at app
// level with the same visual contract (padded header + divider + padded
// content).

import { Heading, Divider, View } from '@octane-xplat/ui'

export function PageLayout(props: { title: string; children?: any }) @{
	return (
		<View className="sb-page">
			<View className="sb-page-header">
				<Heading level={1}>{props.title}</Heading>
			</View>
			<View className="sb-page-content">{props.children}</View>
		</View>
	)
}
