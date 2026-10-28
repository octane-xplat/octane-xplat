/** Shared Button scenario data — consumed by both renderers, no JSX. */

export type ButtonScenario = {
	key: string
	props: {
		label: string
		variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
		size: 'sm' | 'md' | 'lg'
		isDisabled?: boolean
		isLoading?: boolean
	}
	/** Constrains the cell inline; only the long-label case sets it. */
	cellWidth?: number
}

const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const
const sizes = ['sm', 'md', 'lg'] as const

export const buttonScenarios: ButtonScenario[] = [
	...variants.flatMap((variant) =>
		sizes.map((size) => ({
			key: `${variant}-${size}`,
			props: { label: 'Button', variant, size },
		})),
	),
	...variants.map((variant) => ({
		key: `${variant}-md-disabled`,
		props: { label: 'Button', variant, size: 'md' as const, isDisabled: true },
	})),
	{
		key: 'primary-md-loading',
		props: { label: 'Button', variant: 'primary', size: 'md', isLoading: true },
	},
	{
		key: 'long-label',
		props: {
			label: 'A considerably longer button label',
			variant: 'secondary',
			size: 'md',
		},
		cellWidth: 120,
	},
]
