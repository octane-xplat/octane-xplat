import { createContext, useContext, useEffect, useState } from 'octane'
import type { MotionConfigProps } from './types'
import { readReducedMotion, observeReducedMotion } from './reduced-motion'

export const ConfigContext = createContext<MotionConfigProps>({ reducedMotion: 'never' })

/** Observe the live system preference, independent of MotionConfig overrides. */
export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(readReducedMotion)
	useEffect(() => {
		const update = () => setReduced(readReducedMotion())
		const off = observeReducedMotion(update)
		update()
		return off
	}, [])

	return reduced
}

/** Inherit transition and reduced-motion defaults within this Octane root. */
export function MotionConfig(props: MotionConfigProps) @{
	const parent = useContext(ConfigContext)
	const value = {
		transition: props.transition ?? parent.transition,
		reducedMotion: props.reducedMotion ?? parent.reducedMotion,
	}

	<ConfigContext value={value}>{props.children}</ConfigContext>
}
