// Port of upstream Selector/SelectorWithStatus.tsx (Astryx 0.6.4, MIT).
import { Selector, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorWithStatus() @{
	const [env, setEnv] = useState<string | null>(null)
	const [region, setRegion] = useState<string | null>(null)
	const [theme, setTheme] = useState<string | null>('dark')

	<Stack direction="vertical" gap={4} style={{ width: 300 }}>
		<Selector
			label="Environment"
			options={[
				{ value: 'production', label: 'Production' },
				{ value: 'staging', label: 'Staging' },
				{ value: 'development', label: 'Development' },
			]}
			value={env}
			onValueChange={setEnv}
			status={{ type: 'error', message: 'Please select an environment' }}
			placeholder="Choose environment"
		/>
		<Selector
			label="Region"
			options={[
				{ value: 'us-east', label: 'US East' },
				{ value: 'us-west', label: 'US West' },
				{ value: 'eu-central', label: 'EU Central' },
			]}
			value={region}
			onValueChange={setRegion}
			status={{ type: 'warning', message: 'Cross-region deployments may have higher latency' }}
			placeholder="Choose region"
		/>
		<Selector
			label="Theme"
			options={[
				{ value: 'light', label: 'Light' },
				{ value: 'dark', label: 'Dark' },
				{ value: 'auto', label: 'Auto' },
			]}
			value={theme}
			onValueChange={setTheme}
			status={{ type: 'success', message: 'Theme preference saved' }}
			placeholder="Choose theme"
		/>
	</Stack>
}
