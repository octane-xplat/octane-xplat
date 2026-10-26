// Port of upstream LayoutFooter/LayoutFooterShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, HStack, Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutPanel } from '@octane-xplat/ui'

export function LayoutFooterShowcase() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={<LayoutHeader hasDivider><Card variant="muted" /></LayoutHeader>}
			start={<LayoutPanel hasDivider width={140}><Card variant="muted" /></LayoutPanel>}
			content={<LayoutContent><Card variant="muted" /></LayoutContent>}
			footer={<LayoutFooter hasDivider><HStack gap={2} hAlign="end"><Button label="Cancel" variant="secondary" /><Button label="Save" variant="primary" /></HStack></LayoutFooter>}
		/>
	</Center>
}
