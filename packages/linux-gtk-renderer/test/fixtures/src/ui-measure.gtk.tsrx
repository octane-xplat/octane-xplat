/** @jsxImportSource @octane-xplat/jsx */
import { AspectRatio, Text, View, useMeasure } from '@octane-xplat/ui'

export function Measurement(props: { width?: number; alternate?: boolean; observe?: boolean; report: (bounds: any) => void }) @{
	const { ref, bounds } = useMeasure({ observe: props.observe })
	props.report(bounds)

	<View id="measure-root" style={{ width: props.width, height: 400, flexDirection: 'column' }}>
		<AspectRatio id="ratio" ratio={2}><Text>Ratio</Text></AspectRatio>
		<scrollview id="measure-scroll" style={{ height: 100, width: props.width }}>
			<masonview style={{ height: 600, flexDirection: 'column' }}>
				{props.alternate
					? <label id="alternate" ref={ref} style={{ width: 70, height: 40 }} text="New" />
					: <masonview id="measured" ref={ref} style={{ width: 80, height: 30 }} />}
				<masonview style={{ height: 500 }} />
			</masonview>
		</scrollview>
	</View>
}
