export type TextInputScenario = {
	key: string
	props: {
		label: string
		placeholder?: string
		value?: string
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

export const textInputScenarios: TextInputScenario[] = [
	{ key: 'placeholder', props: { label: 'Email', placeholder: 'you@example.com' } },
	{ key: 'value', props: { label: 'Email', value: 'hello@example.com' } },
	{ key: 'disabled', props: { label: 'Email', value: 'hello@example.com', isDisabled: true } },
	{ key: 'readonly', props: { label: 'Email', value: 'hello@example.com', isReadOnly: true } },
	{ key: 'description', props: { label: 'Email', description: 'We never share it' } },
	{ key: 'required', props: { label: 'Email', isRequired: true } },
	{ key: 'optional', props: { label: 'Nickname', isOptional: true } },
	{
		key: 'error',
		props: {
			label: 'Email',
			value: 'not-an-email',
			status: { type: 'error', message: 'Enter a valid email' },
		},
	},
	{
		key: 'label-hidden',
		props: { label: 'Email', isLabelHidden: true, placeholder: 'you@example.com' },
	},
	{ key: 'sm', props: { label: 'Email', size: 'sm' } },
	{ key: 'lg', props: { label: 'Email', size: 'lg' } },
]
