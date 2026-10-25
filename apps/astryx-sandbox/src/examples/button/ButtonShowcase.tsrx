// Port of upstream Button/ButtonShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, Stack } from '@octane-xplat/ui'

export function ButtonShowcase() @{
	return (
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Button label="Primary" variant="primary" />
			<Button label="Secondary" variant="secondary" />
			<Button label="Ghost" variant="ghost" />
			<Button label="Destructive" variant="destructive" />
		</Stack>
	)
}
