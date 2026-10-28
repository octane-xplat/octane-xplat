/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ClassValue, StyledDef, StyledVariant, StyledVariantSelection } from './props'
import { resolveStyledClasses } from './styled-variants'

/**
 * styled() — decision #7. Web side: DOM codegen lowers JSX in nested
 * functions fine, so the factory is a plain component.
 */
export function styled<
	P extends { className?: ClassValue },
	V extends Record<string, StyledVariant>,
>(Base: (props: P) => any, def: StyledDef<V>) {
	function Styled(props: P & StyledVariantSelection<V>) @{
		const { classes, rest } = resolveStyledClasses(def, props)

		<Base {...rest} className={classes} />
	}

	return Styled
}
