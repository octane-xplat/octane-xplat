/**
 * styled() — decision #7. Web side: DOM codegen lowers JSX in nested
 * functions fine, so the factory is a plain component.
 */
export function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
) {
	function Styled(props: P & { [K in keyof V]?: boolean }) @{
		const cls: any[] = [def.base];
		const rest: any = { ...props };
		for (const k of Object.keys(def.variants ?? {})) {
			if ((props as any)[k]) cls.push((def.variants as any)[k]);
			delete rest[k];
		}

		if (props.className) cls.push(props.className);

		<Base {...rest} className={cls} />
	}

	return Styled;
}
