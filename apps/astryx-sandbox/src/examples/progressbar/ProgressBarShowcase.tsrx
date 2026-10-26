// Port of upstream ProgressBar/ProgressBarShowcase.tsx (Astryx 0.6.4, MIT).
import { ProgressBar } from '@octane-xplat/ui'

export function ProgressBarShowcase() @{
	return <ProgressBar value={60} label="Progress" style={{ width: 300 }} />
}
