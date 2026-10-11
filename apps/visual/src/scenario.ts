/** Shared identity and inputs; renderer leaves supply only the stage component. */
export const SWITCH_SCENARIO = {
	id: 'switch',
	title: 'Switch',
	args: { checked: false, stageId: 'switch--unchecked-light' },
	parameters: { appearance: 'light', profile: 'switch-light-96x64@1' },
} as const

export const UncheckedLight = {}
export const CheckedLight = {
	args: { checked: true, stageId: 'switch--checked-light' },
}

export const CAPTURE_PROFILE = {
	id: 'switch-light-96x64@1',
	width: 96,
	height: 64,
	scale: 1,
	crop: { x: 0, y: 0 },
	appearance: 'light',
	format: 'png',
} as const
