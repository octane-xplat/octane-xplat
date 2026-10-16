// Measured parity fixtures — assertions live in Icon.parity.check.ts.
import { Icon } from './Icon'
import type { ParityFixture } from './parity'

function IconFixture() @{
	<Icon className="parity-icon-root" name="tab-home" size={24} color="#1f6feb" />
}

export const PARITY: ParityFixture[] = [
	{ name: 'icon-registered-glyph', component: 'Icon', renderer: IconFixture, props: {} },
]
