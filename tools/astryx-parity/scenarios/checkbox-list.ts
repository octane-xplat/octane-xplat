export type CheckboxListScenario = {
	key: string
	props: {
		label: string
		value: string[]
		description?: string
		status?: { type: 'error'; message: string }
		isRequired?: boolean
		isOptional?: boolean
		isLabelHidden?: boolean
		isDisabled?: boolean
		isReadOnly?: boolean
		size?: 'sm' | 'md'
	}
	options: { value: string; label: string; isDisabled?: boolean }[]
	cellWidth?: number
}

const notifications = [
	{ value: 'email', label: 'Email' },
	{ value: 'sms', label: 'SMS' },
	{ value: 'push', label: 'Push' },
]

export const checkboxListScenarios: CheckboxListScenario[] = [
	{ key: 'default', props: { label: 'Notifications', value: ['email'] }, options: notifications },
	{ key: 'none-selected', props: { label: 'Notifications', value: [] }, options: notifications },
	{
		key: 'all-selected',
		props: { label: 'Notifications', value: ['email', 'sms', 'push'] },
		options: notifications,
	},
	{
		key: 'disabled-group',
		props: { label: 'Notifications', value: ['email'], isDisabled: true },
		options: notifications,
	},
	{
		key: 'disabled-option',
		props: { label: 'Notifications', value: ['push'] },
		options: [
			{ value: 'email', label: 'Email' },
			{ value: 'sms', label: 'SMS', isDisabled: true },
			{ value: 'push', label: 'Push' },
		],
	},
	{
		key: 'readonly',
		props: { label: 'Notifications', value: ['sms'], isReadOnly: true },
		options: notifications,
	},
	{
		key: 'description',
		props: { label: 'Notifications', value: [], description: 'Choose how we reach you' },
		options: notifications,
	},
	{
		key: 'required',
		props: { label: 'Notifications', value: [], isRequired: true },
		options: notifications,
	},
	{
		key: 'optional',
		props: { label: 'Notifications', value: [], isOptional: true },
		options: notifications,
	},
	{
		key: 'error',
		props: {
			label: 'Notifications',
			value: [],
			status: { type: 'error', message: 'Pick at least one' },
		},
		options: notifications,
	},
	{
		key: 'label-hidden',
		props: { label: 'Notifications', value: ['push'], isLabelHidden: true },
		options: notifications,
	},
	{
		key: 'sm',
		props: { label: 'Notifications', value: ['email'], size: 'sm' },
		options: notifications,
	},
]
