// Measured parity fixtures — assertions live in Section.parity.check.ts.
import { Section } from './Section'
import { View } from './View'
import type { ParityFixture } from './parity'

function SectionColumnFixture() @{
	<Section className="parity-section-root" padding={0} style={{ width: 96 }}>
		<View className="parity-section-first" style={{ width: 16, height: 8 }} />
		<View className="parity-section-second" style={{ width: 20, height: 12 }} />
	</Section>
}

export const PARITY: ParityFixture[] = [
	{ name: 'section-column', component: 'Section', renderer: SectionColumnFixture, props: {} },
]
