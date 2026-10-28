export type SwitchScenario = {
	key: string
	props: {
		label: string
		value: boolean
		isDisabled?: boolean
		description?: string
		isLabelHidden?: boolean
		isLoading?: boolean
		size?: 'sm' | 'md'
	}
}

export const switchScenarios: SwitchScenario[] = [
	{ key: 'off', props: { label: 'Notifications', value: false } },
	{ key: 'on', props: { label: 'Notifications', value: true } },
	{ key: 'disabled-off', props: { label: 'Notifications', value: false, isDisabled: true } },
	{ key: 'disabled-on', props: { label: 'Notifications', value: true, isDisabled: true } },
	{
		key: 'description',
		props: { label: 'Notifications', value: false, description: 'Email me updates' },
	},
	{ key: 'label-hidden', props: { label: 'Notifications', value: true, isLabelHidden: true } },
	{ key: 'sm', props: { label: 'Notifications', value: true, size: 'sm' } },
	{ key: 'loading', props: { label: 'Notifications', value: true, isLoading: true } },
]
