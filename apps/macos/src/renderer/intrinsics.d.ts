export namespace JSX {
	export type Element = unknown

	export interface IntrinsicAttributes {
		key?: string | number
	}

	export interface IntrinsicElements {
		stack: {
			children?: unknown
			spacing?: number
		}
		label: {
			text?: string | number
			fontSize?: number
		}
		button: {
			title?: string
			enabled?: boolean
			onPress?: () => void
		}
	}
}
