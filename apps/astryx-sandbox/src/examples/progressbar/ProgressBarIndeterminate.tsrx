// Port of upstream ProgressBar/ProgressBarIndeterminate.tsx (Astryx 0.6.4, MIT).
import { ProgressBar } from '@octane-xplat/ui'

export function ProgressBarIndeterminate() @{
	return <ProgressBar isIndeterminate label="Loading..." style={{ width: 300 }} />
}
