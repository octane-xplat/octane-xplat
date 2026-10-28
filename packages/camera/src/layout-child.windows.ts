import type { CameraViewProps } from './props'
import { mergeStyle } from './style-merge'

/** Windows twins of the layout-child helpers — the unsuffixed module
 *  resolves the platform escape bag through `isIOS`, which has no Windows
 *  branch. Pure helpers are re-declared here to keep divergence at the file
 *  boundary. */

export function layoutChildProps(
	props: CameraViewProps,
	baseStyle: Record<string, any> | string | undefined = props.style,
) {
	const style: Record<string, any> = { ...(typeof baseStyle === 'object' ? baseStyle : {}) }
	if (props.row !== undefined) {
		style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`
	} else if (props.rowSpan !== undefined) {
		style.gridRow = `span ${props.rowSpan}`
	}
	if (props.col !== undefined) {
		style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`
	} else if (props.colSpan !== undefined) {
		style.gridColumn = `span ${props.colSpan}`
	}
	if (props.dock !== undefined) {
		style.position = style.position ?? 'absolute'
		if (props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom') {
			style.left = style.left ?? 0
		}

		if (props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom') {
			style.right = style.right ?? 0
		}

		if (props.dock === 'top' || props.dock === 'left' || props.dock === 'right') {
			style.top = style.top ?? 0
		}

		if (props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right') {
			style.bottom = style.bottom ?? 0
		}
	}
	for (const key of ['left', 'top', 'flexGrow', 'flexShrink', 'alignSelf', 'order'] as const) {
		if (props[key] !== undefined) {
			style[key] = props[key]
		}
	}
	if ((props.left !== undefined || props.top !== undefined) && props.dock === undefined) {
		style.position = style.position ?? 'absolute'
	}
	return { style: typeof baseStyle === 'string' ? mergeStyle(style, baseStyle) : style }
}

export function applyEscapeProps(view: any, props: { windows?: any }): void {
	if (view && props.windows) {
		Object.assign(view, props.windows)
	}
}

const nativeRoles: Record<string, string> = {
	button: 'button',
	link: 'link',
	search: 'search',
	image: 'image',
	heading: 'header',
	adjustable: 'adjustable',
	summary: 'summary',
	text: 'text',
	none: 'none',
	progressbar: 'progressBar',
	checkbox: 'checkbox',
	switch: 'switch',
	radio: 'radioButton',
	spinbutton: 'spinButton',
	tab: 'button',
}

export function nativeAccessibilityRole(role?: string): string | undefined {
	return role ? nativeRoles[role] : undefined
}

export function nativeAccessibilityState(
	state?: CameraViewProps['accessibilityState'],
): string | undefined {
	if (state?.disabled) {
		return 'disabled'
	}

	if (state?.selected) {
		return 'selected'
	}

	if (state?.checked === true) {
		return 'checked'
	}

	if (state?.checked === false) {
		return 'unchecked'
	}

	return undefined
}
