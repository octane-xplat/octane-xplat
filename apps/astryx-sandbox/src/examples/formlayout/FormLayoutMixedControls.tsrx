// Port of upstream FormLayout/FormLayoutMixedControls.tsx (Astryx 0.6.4, MIT).
import { FormLayout, TextInput, TextArea, Selector, DateInput, CheckboxInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString } from '@octane-xplat/ui'

export function FormLayoutMixedControls() @{
	const [title, setTitle] = useState('')
	const [category, setCategory] = useState<string | null>(null)
	const [dueDate, setDueDate] = useState<ISODateString | null>(null)
	const [description, setDescription] = useState('')
	const [urgent, setUrgent] = useState<boolean | 'indeterminate'>(false)
	<div style={{width: 520}}>
		<FormLayout>
			<TextInput label="Task title" isRequired value={title} onChange={setTitle} placeholder="What needs to be done?" />
			<Selector label="Category" options={[
				{ value: 'bug', label: 'Bug' },
				{ value: 'feature', label: 'Feature' },
				{ value: 'docs', label: 'Documentation' },
			]} value={category} onValueChange={setCategory} placeholder="Select category" />
			<DateInput label="Due date" isOptional value={dueDate} onChange={setDueDate} />
			<TextArea label="Description" value={description} onChange={setDescription} placeholder="Details…" />
			<CheckboxInput label="Mark as urgent" value={urgent} onChange={setUrgent} />
		</FormLayout>
	</div>
}
