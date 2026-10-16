// Measured parity fixtures — assertions live in Banner.parity.check.ts.
import { Banner } from './Banner'
import { Text } from './Text'
import type { ParityFixture } from './parity'

function BannerFixture() @{
	<Banner
		className="parity-banner-root"
		style={{ width: 220, height: 48, backgroundColor: '#f5f5f5' }}
		icon="tab-home"
		onDismiss={() => {}}
	>
		<Text>Saved successfully.</Text>
	</Banner>
}

export const PARITY: ParityFixture[] = [
	{ name: 'banner-dismissible', component: 'Banner', renderer: BannerFixture, props: {} },
]
