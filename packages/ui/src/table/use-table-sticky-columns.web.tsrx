// Sticky-columns plugin — port of upstream
// plugins/stickyColumns/useTableStickyColumns.tsx (Astryx 0.6.4, MIT), web
// leaf. Pinned cells get inline `insetInlineStart/End` offsets plus sticky
// classes; a scroll/ResizeObserver listener on the scroll wrapper flips the
// `--table-sticky-shadow-start/end` custom properties that gate the edge
// shadows (scrolling never re-renders — variables only).

import { useRef } from 'octane'
import type {
	TablePlugin,
	HeaderCellRenderProps,
	BodyCellRenderProps,
	ScrollWrapperRenderProps,
	UseTableStickyColumnsConfig,
} from './types'

import type { TableColumn } from '../props'
import { resolveStickySide } from './sticky-column-offsets'

// Scroll-state CSS variables set on the scroll container by the layout ref;
// the cell ::after shadows read them so each edge's shadow only shows when
// content is hidden behind it.
const SHADOW_VAR_START = '--table-sticky-shadow-start'
const SHADOW_VAR_END = '--table-sticky-shadow-end'

// Stable empty default so an unset start/end doesn't allocate a fresh array.
const EMPTY: string[] = []

/**
 * Pins a contiguous run of columns to the start and/or end edge of the
 * table's horizontal scroll container. Offsets accumulate the resolved pixel
 * widths (pixel value, proportional minWidth, or DEFAULT_MIN_COLUMN_WIDTH).
 */
export function useTableStickyColumns<T extends Record<string, unknown>>(
	config: UseTableStickyColumnsConfig,
): TablePlugin<T> {
	const { startKeys, endKeys } = config
	const start = startKeys ?? EMPTY
	const end = endKeys ?? EMPTY

	const hasStart = start.length > 0
	const hasEnd = end.length > 0

	// Live snapshot of the resolved config, read inside the transforms and the
	// scroll-shadow callback — consumers typically pass fresh array literals
	// each render, so array identity must not enter any memo deps.
	const stateRef = useRef({ start, end, hasStart, hasEnd })
	stateRef.current = { start, end, hasStart, hasEnd }

	// Scroll-aware shadows: toggle CSS variables on the scroll container so
	// each edge's shadow only paints when hidden content sits behind it.
	const detachRef = useRef<(() => void) | null>(null)
	const attachScrollShadow = (el: any) => {
		detachRef.current?.()
		detachRef.current = null
		if (!el) {
			return
		}

		const update = () => {
			const { hasStart: hs, hasEnd: he } = stateRef.current
			const maxScroll = el.scrollWidth - el.clientWidth
			const hasOverflow = maxScroll > 1
			// RTL-safe scroll position: spec-compliant browsers report a NEGATIVE
			// scrollLeft under RTL, so Math.abs collapses both conventions to a
			// distance-from-inline-start. No-op under LTR.
			const pos = Math.abs(el.scrollLeft)
			if (hs) {
				el.style.setProperty(SHADOW_VAR_START, hasOverflow && pos > 1 ? '1' : '0')
			}

			if (he) {
				el.style.setProperty(SHADOW_VAR_END, hasOverflow && pos < maxScroll - 1 ? '1' : '0')
			}
		}

		el.addEventListener('scroll', update, { passive: true })
		const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
		resizeObserver?.observe(el)
		update()
		detachRef.current = () => {
			el.removeEventListener('scroll', update)
			resizeObserver?.disconnect()
		}
	}

	return {
		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>,
		): HeaderCellRenderProps {
			const { start: s, end: e } = stateRef.current
			const side = resolveStickySide(props.columns as any, column.key, s, e)
			if (!side) {
				return props
			}

			const offsetStyle =
				side.edge === 'start'
					? { insetInlineStart: `${side.offset}px` }
					: { insetInlineEnd: `${side.offset}px` }

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: { ...props.htmlProps.style, ...offsetStyle },
				},
				classes: [
					...props.classes,
					'vx-table-cell--sticky',
					'vx-table-cell--sticky-header',
					side.edge === 'start' ? 'vx-table-cell--sticky-start' : 'vx-table-cell--sticky-end',
				],
			}
		},

		transformBodyCell(props: BodyCellRenderProps, column: TableColumn<T>): BodyCellRenderProps {
			const { start: s, end: e } = stateRef.current
			const side = resolveStickySide(props.columns as any, column.key, s, e)
			if (!side) {
				return props
			}

			const offsetStyle =
				side.edge === 'start'
					? { insetInlineStart: `${side.offset}px` }
					: { insetInlineEnd: `${side.offset}px` }

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: { ...props.htmlProps.style, ...offsetStyle },
				},
				classes: [
					...props.classes,
					'vx-table-cell--sticky',
					'vx-table-cell--sticky-body',
					side.edge === 'start' ? 'vx-table-cell--sticky-start' : 'vx-table-cell--sticky-end',
				],
			}
		},

		transformScrollWrapper(props: ScrollWrapperRenderProps): ScrollWrapperRenderProps {
			if (!stateRef.current.hasStart && !stateRef.current.hasEnd) {
				return props
			}

			// Compose with any ref a prior plugin set on the scroll container.
			const existingRef = props.htmlProps.ref
			const mergedRef = (node: any) => {
				attachScrollShadow(node)
				if (typeof existingRef === 'function') {
					existingRef(node)
				} else if (existingRef != null) {
					existingRef.current = node
				}
			}

			return {
				...props,
				htmlProps: { ...props.htmlProps, ref: mergedRef },
			}
		},
	}
}

export type { UseTableStickyColumnsConfig }
