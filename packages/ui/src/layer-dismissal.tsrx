import { createContext, useContext, useEffect, useRef } from 'octane'
import { captureLayerFocus } from './layer-keys'
import { isTopLayer, registerLayer, shouldCloseLayer } from './layer-stack'

export const LayerDepthContext = createContext(0)
export const LayerDepthProvider: any = LayerDepthContext

/** Internal depth is passed explicitly into separately mounted native roots. */
export function useLayerDismissal(options: {
	active: boolean
	dismiss(): void
	behavior?: 'close' | 'block'
	contains?(target: any): boolean
	isPresent?(): boolean
	restoreFocus?: boolean
	getFocusTarget?(): any
}) {
	const depth = useContext(LayerDepthContext)
	const latest = useRef(options)
	latest.current = options
	const token = useRef<object>({})

	const wasActive = useRef(false)

	useEffect(() => {
		if (!options.active) {
			wasActive.current = false
			return
		}

		if (!wasActive.current) {
			token.current = {}
			wasActive.current = true
		}

		const restore = captureLayerFocus(() => latest.current.getFocusTarget?.())
		const remove = registerLayer({ token: token.current, depth,
			get behavior() { return latest.current.behavior ?? 'close' },
			dismiss: () => latest.current.dismiss(),
			contains: (target) => latest.current.contains?.(target) ?? false,
			isPresent: () => latest.current.active && (latest.current.isPresent?.() ?? true),
		})

		return () => {
			const wasTop = isTopLayer(token.current, true)
			remove()
			if (wasTop && latest.current.restoreFocus !== false) {
				restore()
			}
		}
	}, [options.active, depth])

	return {
		depth: depth + 1,
		shouldClose: (retiring = false) => shouldCloseLayer(token.current, retiring),
	}
}
