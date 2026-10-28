// Measured parity fixtures — assertions live in Popover.parity.check.ts.
import { useRef } from 'octane'
import { Popover } from './Popover'
import { View } from './View'
import type { ParityFixture } from './parity'

function PopoverLayoutFixture(props: { marker: string }) @{
	const anchor = useRef<any>(null)

	<>
		<View
			className="parity-popover-anchor"
			ref={(view: any) => {
				anchor.current = view
			}}
			style={{ width: 24, height: 20 }}
		/>
		<Popover
			anchor={anchor}
			open
			placement="bottom"
			className={props.marker}
			style={{ width: 48, height: 32, backgroundColor: '#f5f5f5' }}
		>
			<View style={{ width: 48, height: 32 }} />
		</Popover>
	</>
}

export const PARITY: ParityFixture[] = [
	{
		name: 'popover-bottom-frame',
		component: 'Popover',
		renderer: PopoverLayoutFixture,
		props: { marker: 'parity-portal--popover-bottom-frame' },
	},
]
