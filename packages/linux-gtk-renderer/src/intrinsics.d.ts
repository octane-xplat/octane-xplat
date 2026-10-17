// JSX intrinsic surface for the `gtk` renderer — the implemented subset of
// the shared native vocabulary. `@jsxImportSource @octane-xplat/linux-gtk`
// binds this module for `.gtk.*` files. The index signature keeps tags the
// driver does not yet implement compilable; unknown tags fail at create time
// with a named driver error, never silently.
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
		testID?: string
		automationText?: string
		width?: number
		height?: number
		flexGrow?: number
		enabled?: boolean
		visible?: boolean
		opacity?: number
		horizontalAlignment?: string
		verticalAlignment?: string
		accessibilityLabel?: string
		accessibilityRole?: string
		accessibilityHint?: string
		accessibilityValue?: string
		accessibilityState?: Record<string, unknown>
		accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
		onTap?: (event?: any) => void
		onClick?: (event?: any) => void
		onPress?: (event?: any) => void
		onDoubleTap?: (event?: any) => void
		onLongPress?: (event?: any) => void
		onChange?: (event?: any) => void
		onTextChange?: (event?: any) => void
		onCheckedChange?: (event?: any) => void
		onValueChange?: (event?: any) => void
		onSubmit?: (event?: any) => void
		onReturnPress?: (event?: any) => void
		onFocus?: (event?: any) => void
		onBlur?: (event?: any) => void
		onLoaded?: (event?: any) => void
		onUnloaded?: (event?: any) => void
		onScroll?: (event?: any) => void
	}

	export interface IntrinsicElements {
		stacklayout: HostProps & {
			spacing?: number
			orientation?: 'horizontal' | 'vertical'
		}
		stack: HostProps & {
			spacing?: number
			orientation?: 'horizontal' | 'vertical'
		}
		flexboxlayout: HostProps & {
			spacing?: number
			gap?: number
			rowGap?: number
			columnGap?: number
			flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
			alignItems?: string
			justifyContent?: string
		}
		absolutelayout: HostProps
		gridlayout: HostProps & {
			rowSpacing?: number
			columnSpacing?: number
		}
		label: HostProps & {
			text?: string | number
			value?: string | number
			xalign?: number
			textAlignment?: 'left' | 'center' | 'right'
			textWrap?: boolean
			whiteSpace?: 'normal' | 'nowrap'
			textOverflow?: 'clip' | 'ellipsis'
			selectable?: boolean
		}
		button: HostProps & {
			text?: string
			label?: string
			title?: string
		}
		scrollview: HostProps & {
			orientation?: 'horizontal' | 'vertical'
		}
		textfield: HostProps & {
			value?: string
			text?: string
			placeholder?: string
			hint?: string
			secure?: boolean
			editable?: boolean
		}
		switch: HostProps & {
			checked?: boolean
		}
		slider: HostProps & {
			value?: number
			minValue?: number
			maxValue?: number
		}
		progress: HostProps & {
			value?: number
			maxValue?: number
		}
		activityindicator: HostProps & {
			busy?: boolean
		}
		contentview: HostProps
		proxyviewcontainer: HostProps
		rootlayout: HostProps
		span: HostProps & { text?: string; value?: string }
		formattedstring: HostProps
		'#text': { value?: string }
		[key: string]: any
	}
}
