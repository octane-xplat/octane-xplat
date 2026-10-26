// Port of upstream ButtonGroup/ButtonGroupBasic.tsx (Astryx 0.6.4, MIT).
import { Button, ButtonGroup } from '@octane-xplat/ui'

export function ButtonGroupBasic() @{
	<ButtonGroup label="Text editing actions">
		<Button label="Copy" />
		<Button label="Cut" />
		<Button label="Paste" />
	</ButtonGroup>
}
