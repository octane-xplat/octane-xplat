export type CheckboxScenario = {
	key: string
	props: {
		label: string
		value: boolean | 'indeterminate'
		isDisabled?: boolean
		description?: string
		status?: { type: 'error'; message: string }
		isLabelHidden?: boolean
		size?: 'sm' | 'md'
	}
}

export const checkboxScenarios: CheckboxScenario[] = [
	{ key: 'unchecked', props: { label: 'Accept terms', value: false } },
	{ key: 'checked', props: { label: 'Accept terms', value: true } },
	{ key: 'indeterminate', props: { label: 'Accept terms', value: 'indeterminate' } },
	{ key: 'disabled-unchecked', props: { label: 'Accept terms', value: false, isDisabled: true } },
	{ key: 'disabled-checked', props: { label: 'Accept terms', value: true, isDisabled: true } },
	{ key: 'description', props: { label: 'Accept terms', value: false, description: 'Required to continue' } },
	{ key: 'error', props: { label: 'Accept terms', value: false, status: { type: 'error', message: 'You must accept' } } },
	{ key: 'label-hidden', props: { label: 'Accept terms', value: true, isLabelHidden: true } },
	{ key: 'sm', props: { label: 'Accept terms', value: true, size: 'sm' } },
	{ key: 'md', props: { label: 'Accept terms', value: true, size: 'md' } },
]
