import { defineUniversalComponent, universalComponent } from 'octane/universal/native'
import { cx } from './cx'

/** Compose CSS-backed class names onto an AppKit component factory. */
export function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
): (props: P & { [K in keyof V]?: boolean }, context: any) => any {
	function Styled(props: P & { [K in keyof V]?: boolean }) {
		const classes: any[] = [def.base]
		const rest: any = { ...props }
		for (const key of Object.keys(def.variants ?? {})) {
			if ((props as any)[key]) {classes.push((def.variants as any)[key])}
			delete rest[key]
		}

		if (props.className) {classes.push(props.className)}
		rest.className = cx(classes)
		return universalComponent('macos', Base as any, rest)
	}

	return defineUniversalComponent('macos', Styled)
}
