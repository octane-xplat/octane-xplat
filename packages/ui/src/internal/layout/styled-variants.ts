import type { StyledClass, StyledDef, StyledVariant } from '../../props'

/** Extract the variant-controlled props and compose their class values in
 *  definition order: a boolean variant applies its class when truthy, an
 *  enumerated variant (an option→class record) applies the selected
 *  option's class, and `defaultVariants` supplies the value when a variant
 *  prop is omitted. Consumed keys are deleted from the returned rest bag so
 *  variant props never leak to the base component. `className` is appended
 *  last. */
export function resolveStyledClasses<V extends Record<string, StyledVariant>>(
	def: StyledDef<V>,
	props: Record<string, any>,
): { classes: StyledClass[]; rest: any } {
	const classes: StyledClass[] = [def.base]
	const rest = { ...props }
	for (const key of Object.keys(def.variants ?? {})) {
		const variant = def.variants![key]
		const value = props[key] ?? (def.defaultVariants as Record<string, unknown> | undefined)?.[key]
		if (isEnumVariant(variant)) {
			if (value != null && value !== false) {
				classes.push(variant[value as string])
			}
		} else if (value) {
			classes.push(variant)
		}

		delete rest[key]
	}

	if (props.className) {
		classes.push(props.className)
	}

	return { classes, rest }
}

function isEnumVariant(variant: StyledVariant): variant is Record<string, StyledClass> {
	return typeof variant === 'object' && variant !== null && !Array.isArray(variant)
}
