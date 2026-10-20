import { defineUniversalComponent, universalComponent } from 'octane/universal/native'
import type { UniversalComponent } from 'octane/universal';
import type { ClassValue, StyledDef, StyledVariant, StyledVariantSelection } from './props';
import { resolveStyledClasses } from './styled-variants';

/**
 * styled() — decision #7, Tamagui-shaped but CSS-backed. base/variants are
 * class strings composed into className; the leaf decides what those classes
 * mean per platform. A class value is a boolean variant (the prop is a
 * flag); an option→class record is an enumerated variant (the prop takes an
 * option name); defaultVariants applies when the prop is omitted.
 *
 *   const Btn = styled(Pressable, {
 *   	base: 'btn',
 *   	variants: { danger: 'bg-danger', size: { sm: 'btn-sm', lg: 'btn-lg' } },
 *   });
 *   <Btn danger size="sm" />  →  className=['btn','bg-danger','btn-sm']
 *
 * Universal constraint (Exp 16): component elements require the
 * compiler-stamped UNIVERSAL_COMPONENT mark and JSX/`@{ }` only lowers at
 * module level — so a component factory can't be authored with JSX. This
 * leaf stamps the mark itself via defineUniversalComponent and returns
 * universalComponent(...) elements directly. If upstream exposes a blessed
 * factory path, switch to it (driver-level fix candidate).
 */
export function styled<P extends { className?: ClassValue }, V extends Record<string, StyledVariant>>(
	Base: (props: P) => any,
	def: StyledDef<V>,
): (props: P & StyledVariantSelection<V>, context: any) => any {
	function Styled(props: P & StyledVariantSelection<V>) {
		const { classes, rest } = resolveStyledClasses(def, props);
		rest.className = classes;
		return universalComponent('nativescript', Base as unknown as UniversalComponent<any>, rest);
	}

	return defineUniversalComponent('nativescript', Styled);
}
