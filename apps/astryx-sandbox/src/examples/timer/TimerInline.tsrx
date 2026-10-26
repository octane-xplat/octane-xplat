// Port of upstream Timer/TimerInline.tsx (Astryx 0.6.4, MIT).
import { Text, Timer } from '@octane-xplat/ui'

export function TimerInline() @{
	<Text type="body" color="primary">Processing for <Timer type="inherit" color="inherit" /></Text>
}
