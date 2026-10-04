export namespace JSX {
	export type Element = unknown

	export interface IntrinsicAttributes {
		key?: string | number
	}

	export interface HostProps {
		id?: string
		key?: string | number
		ref?: unknown
		className?: string
		style?: Record<string, unknown>
		children?: unknown
		flexGrow?: number
		textAlignment?: string
		onTap?: (event?: any) => void
		accessibilityLabel?: string
		accessibilityRole?: string
		accessibilityHint?: string
		accessibilityValue?: string
		accessibilityState?: Record<string, unknown>
		accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	}

	export interface IntrinsicElements {
		stack: HostProps & {
			children?: unknown
			spacing?: number
		}
		label: HostProps & {
			text?: string | number
			fontSize?: number
			whiteSpace?: string
			maxLines?: number
			textOverflow?: string
		}
		button: HostProps & {
			title?: string
			enabled?: boolean
			onPress?: () => void
		}
		flexboxlayout: Record<string, unknown>
		gridlayout: Record<string, unknown>
		absolutelayout: Record<string, unknown>
		stacklayout: Record<string, unknown>
		rootlayout: Record<string, unknown>
		scrollview: Record<string, unknown>
		textfield: Record<string, unknown>
		textview: Record<string, unknown>
		image: Record<string, unknown>
		span: Record<string, unknown>
		formattedstring: Record<string, unknown>
		pager: Record<string, unknown>
		webview: Record<string, unknown>
		cameraplus: Record<string, unknown>
		xplatvideo: Record<string, unknown>
		canvasview: Record<string, unknown>
		svgview: Record<string, unknown>
		[key: string]: any
	}
}
