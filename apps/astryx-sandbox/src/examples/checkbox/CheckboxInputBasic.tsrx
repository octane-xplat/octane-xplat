// Port of upstream CheckboxInput/CheckboxInputBasic.tsx (Astryx 0.6.4, MIT).
import { CheckboxInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxInputBasic() @{
	const [checked, setChecked] = useState<boolean | 'indeterminate'>(true)
	const [unchecked, setUnchecked] = useState<boolean | 'indeterminate'>(false)
	const [disabled, setDisabled] = useState<boolean | 'indeterminate'>(false)
	const [indeterminate, setIndeterminate] = useState<boolean | 'indeterminate'>('indeterminate')
	<Stack direction="vertical" gap={4}>
		<CheckboxInput label="Checked" description="This checkbox is currently on." value={checked} onChange={setChecked} />
		<CheckboxInput label="Unchecked" description="This checkbox is currently off." value={unchecked} onChange={setUnchecked} />
		<CheckboxInput label="Disabled" description="This checkbox cannot be changed." value={disabled} onChange={setDisabled} isDisabled />
		<CheckboxInput label="Indeterminate" description="This checkbox represents a partial selection." value={indeterminate} onChange={setIndeterminate} />
	</Stack>
}
