/** @jsxImportSource @octane-xplat/jsx */
import { View, useAnimation } from '@octane-xplat/ui'

export const animations: Record<string, any> = {}
export function Animated(props: { version: number; keyframes?: boolean }) @{
	const motion = useAnimation(0)
	const opacity = useAnimation(1, 'opacity')
	const width = useAnimation(40, 'width')
	const scale = useAnimation(1, 'scale')
	Object.assign(animations, { motion, opacity, width, scale })

	<View id="animation-root" style={{ width: 300, height: 250, flexDirection: 'column' }}>
		<View id="moving" ref={motion.ref} style={{ width: 40, height: 30 }} />
		<View id="fading" className={props.keyframes ? "held-opacity" : undefined} ref={opacity.ref} style={{ width: 40, height: 30 }} />
		<View id="growing" ref={width.ref} style={{ width: 40, height: 30 }} />
		<View id="scaling" ref={scale.ref} style={{ width: 40, height: 30 }} />
		<View id="translated" style={{ width: 20, height: 20, transform: "translate(3px, 4px)" }} />
	</View>
}
