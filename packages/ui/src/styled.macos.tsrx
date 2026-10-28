import { defineUniversalComponent, universalComponent } from 'octane/universal/native'
import type { UniversalComponent } from 'octane/universal'
import type { ClassValue, StyledDef, StyledVariant, StyledVariantSelection } from './props'
import { resolveStyledClasses } from './styled-variants'
import { cx } from '@octane-xplat/lib'

/** Compose CSS-backed class names onto an AppKit component factory. */
export function styled<
	P extends { className?: ClassValue },
	V extends Record<string, StyledVariant>,
>(
	Base: (props: P) => any,
	def: StyledDef<V>,
): (props: P & StyledVariantSelection<V>, context: any) => any {
	function Styled(props: P & StyledVariantSelection<V>) {
		const { classes, rest } = resolveStyledClasses(def, props)
		rest.className = cx(classes)
		return universalComponent('macos', Base as unknown as UniversalComponent<any>, rest)
	}

	return defineUniversalComponent('macos', Styled)
}
