export type TextAreaScenario = {
	key: string
	props: {
		label: string
		placeholder?: string
		value?: string
		rows?: number
		isDisabled?: boolean
		isReadOnly?: boolean
		description?: string
		isRequired?: boolean
		isOptional?: boolean
		status?: { type: 'error'; message: string }
		isLabelHidden?: boolean
		size?: 'sm' | 'md' | 'lg'
	}
	cellWidth?: number
}

export const textAreaScenarios: TextAreaScenario[] = [
	{ key: 'placeholder', props: { label: 'Notes', placeholder: 'Add a comment' } },
	{ key: 'value', props: { label: 'Notes', value: 'First line\nSecond line', rows: 3 } },
	{ key: 'rows', props: { label: 'Notes', rows: 4 } },
	{ key: 'disabled', props: { label: 'Notes', value: 'Locked', isDisabled: true } },
	{ key: 'readonly', props: { label: 'Notes', value: 'Read only', isReadOnly: true } },
	{ key: 'description', props: { label: 'Notes', description: 'Markdown supported' } },
	{ key: 'required', props: { label: 'Notes', isRequired: true } },
	{ key: 'optional', props: { label: 'Notes', isOptional: true } },
	{ key: 'error', props: { label: 'Notes', value: 'x', status: { type: 'error', message: 'Add more detail' } } },
	{ key: 'label-hidden', props: { label: 'Notes', isLabelHidden: true, placeholder: 'Add a comment' } },
	{ key: 'sm', props: { label: 'Notes', size: 'sm' } },
	{ key: 'lg', props: { label: 'Notes', size: 'lg' } },
]
