// Port of upstream Timestamp/TimestampShowcase.tsx (Astryx 0.6.4, MIT).
import { Timestamp } from '@octane-xplat/ui'

export function TimestampShowcase() @{
	return <Timestamp value="2026-02-19T17:00:00Z" format="date_time" color="primary" />
}
