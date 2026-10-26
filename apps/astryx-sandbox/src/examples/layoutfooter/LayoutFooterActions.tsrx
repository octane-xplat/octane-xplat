// Port of upstream LayoutFooter/LayoutFooterActions.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, HStack, Layout, LayoutContent, LayoutFooter } from '@octane-xplat/ui'

export function LayoutFooterActions() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			content={<LayoutContent><Card variant="muted" /></LayoutContent>}
			footer={<LayoutFooter hasDivider><HStack gap={2} hAlign="end"><Button label="Cancel" variant="secondary" /><Button label="Save" variant="primary" /></HStack></LayoutFooter>}
		/>
	</Center>
}
