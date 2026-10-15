import { createContext, useContext } from 'octane'
import type { SafeAreaEdge } from './props'

/** Per-edge system insets, in dips. */
export interface InsetEdges {
	top: number
	right: number
	bottom: number
	left: number
}

const NONE: InsetEdges = { top: 0, right: 0, bottom: 0, left: 0 }

/** Insets ancestor `SafeArea` containers already applied as padding.
 *  Nested containers subtract them so each edge is consumed once;
 *  `KeyboardAvoiding` reads the consumed bottom edge. */
export const ConsumedInsetsContext = createContext<InsetEdges>(NONE)

/** JSX provider — universal-renderer contexts are callables, not
 *  `.Provider` members (same aliasing as FieldProvider/DialogProvider). */
export const ConsumedInsetsProvider: any = ConsumedInsetsContext

const ALL_EDGES: readonly SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']
const NO_EDGES: readonly SafeAreaEdge[] = []

/** A `SafeArea`'s effective edge set — `edges` wins over the deprecated
 *  `ignoreSafeArea` toggle when both are set. */
export function resolveSafeAreaEdges(
	edges?: readonly SafeAreaEdge[],
	ignoreSafeArea?: boolean,
): readonly SafeAreaEdge[] {
	return edges ?? (ignoreSafeArea ? NO_EDGES : ALL_EDGES)
}

/** Split `measured` insets between a container's own padding and the
 *  record it provides to descendants. Selected edges pad by what remains
 *  after `consumed`, then count as consumed below; unselected edges pass
 *  their remaining inset through untouched. */
export function consumeInsets(
	measured: InsetEdges,
	consumed: InsetEdges,
	edges: readonly SafeAreaEdge[],
): { applied: InsetEdges; provided: InsetEdges } {
	const pick = (edge: keyof InsetEdges) =>
		edges.includes(edge) ? Math.max(0, measured[edge] - consumed[edge]) : 0

	const applied: InsetEdges = {
		top: pick('top'),
		right: pick('right'),
		bottom: pick('bottom'),
		left: pick('left'),
	}

	return {
		applied,
		provided: {
			top: consumed.top + applied.top,
			right: consumed.right + applied.right,
			bottom: consumed.bottom + applied.bottom,
			left: consumed.left + applied.left,
		},
	}
}

/** Insets ancestors already consumed (dips). `KeyboardAvoiding` subtracts
 *  the consumed bottom edge from the keyboard inset so the two never
 *  double-count. */
export function useConsumedInsets(): InsetEdges {
	return useContext(ConsumedInsetsContext)
}
