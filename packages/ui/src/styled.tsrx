import { defineUniversalComponent, universalComponent } from 'octane/universal/native';

/**
 * styled() — decision #7, Tamagui-shaped but CSS-backed. base/variants are
 * class strings composed into className; the leaf decides what those classes
 * mean per platform.
 *
 *   const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });
 *   <DangerBtn danger />  →  className=['btn','bg-danger']
 *
 * Universal constraint (Exp 16): component elements require the
 * compiler-stamped UNIVERSAL_COMPONENT mark and JSX/`@{ }` only lowers at
 * module level — so a component factory can't be authored with JSX. This
 * leaf stamps the mark itself via defineUniversalComponent and returns
 * universalComponent(...) elements directly. If upstream exposes a blessed
 * factory path, switch to it (driver-level fix candidate).
 */
export function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
) {
	function Styled(props: P & { [K in keyof V]?: boolean }) {
		const cls: any[] = [def.base];
		const rest: any = { ...props };
		for (const k of Object.keys(def.variants ?? {})) {
			if ((props as any)[k]) cls.push((def.variants as any)[k]);
			delete rest[k]; // variant flags are consumed — don't leak to the leaf
		}

		if (props.className) cls.push(props.className);
		rest.className = cls;
		return universalComponent('nativescript', Base as any, rest);
	}

	return defineUniversalComponent('nativescript', Styled);
}
