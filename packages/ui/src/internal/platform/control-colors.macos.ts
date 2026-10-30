export type ControlColors = {
	border: string
	onPrimary: string
	primary: string
	surface: string
}

export function controlColors(dark: boolean): ControlColors {
	return dark
		? { border: '#2e2e2e', onPrimary: '#171717', primary: '#ededed', surface: '#0a0a0a' }
		: { border: '#eaeaea', onPrimary: '#fafafa', primary: '#171717', surface: '#ffffff' }
}
