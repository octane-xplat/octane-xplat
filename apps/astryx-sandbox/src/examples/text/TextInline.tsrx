// Port of upstream Text/TextInline.tsx (Astryx 0.6.4, MIT).
import { Text } from '@octane-xplat/ui'

export function TextInline() @{
	return (
		<Text type="body" className="sb-block">
			Design tokens are <Text type="code">themeable</Text> and shared across every surface.
		</Text>
	)
}
