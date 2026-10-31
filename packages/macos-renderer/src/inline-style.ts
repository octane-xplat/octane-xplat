import { normalizeInlineStyle } from '@octane-xplat/css-engine'

/** Normalize before both validation and application, including direct template
 * creation. Never mutate the app's prop bag or authored style object. */
export function normalizeHostStyleProps(props: undefined): undefined
export function normalizeHostStyleProps(props: Record<string, any>): Record<string, any>
export function normalizeHostStyleProps(props: Record<string, any> | undefined): Record<string, any> | undefined
export function normalizeHostStyleProps(props: Record<string, any> | undefined): Record<string, any> | undefined {
	const style = props?.style
	if (style == null || typeof style === 'object' && !Array.isArray(style)) {return props}
	return { ...props, style: normalizeInlineStyle(style) }
}
