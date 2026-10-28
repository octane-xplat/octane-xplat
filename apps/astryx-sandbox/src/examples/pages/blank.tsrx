// Port of upstream templates/pages/blank/page.tsx (Astryx 0.6.4, MIT) — route /templates/blank/.
import { Layout, LayoutContent, Text } from '@octane-xplat/ui'

export function BlankTemplate() @{
	<Layout
		content={
			<LayoutContent>
				<Text type="large">New Page</Text>
			</LayoutContent>
		}
	/>
}
