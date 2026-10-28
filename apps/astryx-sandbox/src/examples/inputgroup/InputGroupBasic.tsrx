// Port of upstream InputGroup/InputGroupBasic.tsx (Astryx 0.6.4, MIT).
import { InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function InputGroupBasic() @{
	const [price, setPrice] = useState('')

	<div style={{ width: 320 }}>
		<InputGroup label="Price">
			<InputGroupText>$</InputGroupText>
			<TextInput
				label="Amount"
				isLabelHidden
				value={price}
				onChange={setPrice}
				placeholder="0.00"
			/>
			<InputGroupText>USD</InputGroupText>
		</InputGroup>
	</div>
}
