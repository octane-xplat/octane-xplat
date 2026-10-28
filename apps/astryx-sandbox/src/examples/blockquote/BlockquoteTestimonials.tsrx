// Port of upstream Blockquote/BlockquoteTestimonials.tsx (Astryx 0.6.4, MIT).
import { Blockquote, Card, Grid, GridSpan } from '@octane-xplat/ui'

export function BlockquoteTestimonials() @{
	<Grid columns={2} style={{ maxWidth: 600, gap: 12 }}>
		<Card padding={4}>
			<Blockquote cite="Sarah K., Lead Engineer">
				Shipping UI has never been this fast. Our team went from design to
				production in a single afternoon.
			</Blockquote>
		</Card>
		<Card padding={4}>
			<Blockquote cite="Marcus T., Product Designer">
				The token system means every new screen just looks right — no manual
				color or spacing decisions.
			</Blockquote>
		</Card>
		<GridSpan columns={2}>
			<Card padding={4}>
				<Blockquote cite="Priya L., Engineering Manager">
					Onboarding a new engineer used to take a week of design review. Now
					they're shipping accessible, polished components on day one.
				</Blockquote>
			</Card>
		</GridSpan>
	</Grid>
}
