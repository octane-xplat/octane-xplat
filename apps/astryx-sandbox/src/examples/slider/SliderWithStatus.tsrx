// Port of upstream Slider/SliderWithStatus.tsx (Astryx 0.6.4, MIT).
import { Slider, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SliderWithStatus() @{
	const [value1, setValue1] = useState(95)
	const [value2, setValue2] = useState(50)
	const [value3, setValue3] = useState(75)

	<div style={{ width: 300 }}>
		<VStack gap={6}>
			<Slider
				label="CPU Usage"
				value={value1}
				onValueChange={(v) => setValue1(v as number)}
				status={{ type: 'error', message: 'CPU usage is critically high' }}
			/>
			<Slider
				label="Memory"
				value={value2}
				onValueChange={(v) => setValue2(v as number)}
				status={{ type: 'warning', message: 'Memory usage is moderate' }}
			/>
			<Slider
				label="Disk"
				value={value3}
				onValueChange={(v) => setValue3(v as number)}
				status={{ type: 'success', message: 'Disk usage is healthy' }}
			/>
		</VStack>
	</div>
}
