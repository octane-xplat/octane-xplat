// Port of upstream InputGroup/InputGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { InputGroup, InputGroupText, TextInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function InputGroupShowcase() @{
	const [price, setPrice] = useState('')
	const [url, setUrl] = useState('')

	<Stack direction="vertical" gap={4} style={{ maxWidth: 400, width: '100%' }}>
		<InputGroup label="Price">
			<InputGroupText>$</InputGroupText>
			<TextInput
				label="Amount"
				isLabelHidden
				value={price}
				onChange={setPrice}
				placeholder="0.00"
			/>
		</InputGroup>
		<InputGroup label="Website">
			<InputGroupText>https://</InputGroupText>
			<TextInput label="URL" isLabelHidden value={url} onChange={setUrl} placeholder="example" />
			<InputGroupText>.com</InputGroupText>
		</InputGroup>
	</Stack>
}
