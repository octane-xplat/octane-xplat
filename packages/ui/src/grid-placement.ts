import type { LayoutChildProps } from './props'

export type GridChildPlacement = Pick<LayoutChildProps, 'row' | 'col' | 'rowSpan' | 'colSpan'>

const placements = new WeakMap<object, GridChildPlacement>()

/** Keep the authored Grid placement next to its mounted NativeScript view. */
export function rememberGridChildPlacement(view: unknown, props: GridChildPlacement): void {
	if ((typeof view !== 'object' || view === null) && typeof view !== 'function') {
		return
	}

	const placement: GridChildPlacement = {}
	for (const key of ['row', 'col', 'rowSpan', 'colSpan'] as const) {
		if (props[key] !== undefined) {
			placement[key] = props[key]
		}
	}

	if (Object.keys(placement).length) {
		placements.set(view as object, placement)
	} else {
		placements.delete(view as object)
	}
}

export function gridChildPlacement(view: unknown): GridChildPlacement {
	return typeof view === 'object' && view !== null ? placements.get(view) ?? {} : {}
}
