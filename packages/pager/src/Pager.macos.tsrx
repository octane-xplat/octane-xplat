/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useRef, useState } from 'octane'
import { createPortal, type UniversalRenderable } from 'octane/universal/native'
import type { PagerProps } from './props'

interface PageBinding {
	id: number
	generation: number
	target: unknown
	item: any
	index: number
}

function PageContent(props: {
	render: (item: any, index: number) => any
	item: any
	index: number
}) {
	return <>{props.render(props.item, props.index)}</>
}

function PagePortal(props: {
	key?: number
	page: PageBinding
	render: (item: any, index: number) => any
}) {
	const page = props.page
	return createPortal(
		(
			<PageContent render={props.render} item={page.item} index={page.index} />
		) as UniversalRenderable,
		page.target,
	)
}

/** Pager — the AppKit host's `pager` element: a horizontal NSScrollView
 *  whose clip-sized page hosts snap to the settled page (the web leaf's
 *  scroll-snap model). Page content is a portal from the declaring tree —
 *  provider context follows each page, same as the recycled-cell portal on
 *  mobile. `page` writes scroll/settle programmatically; only user swipes
 *  echo back through `onPageChange` (the element's settle report is compared
 *  against the tracked index, muting the echo — same rule as web). */
export function Pager(props: PagerProps) @{
	const [pages, setPages] = useState<PageBinding[]>([])
	// The page the leaf believes it is on — seeded by `page`/`defaultPage`,
	// updated by controlled writes and settled swipes. A settle that lands on
	// `current` is programmatic — it never reports back through onPageChange.
	const current = useRef(props.page ?? props.defaultPage ?? 0)

	const onTarget = useCallback((event: PageBinding & { type: 'bind' | 'release' }) => {
		setPages((list) => {
			const existing = list.find((page) => page.id === event.id)
			if (event.type === 'release') {
				return existing?.generation === event.generation
					? list.filter((page) => page.id !== event.id)
					: list
			}

			if (
				existing?.generation === event.generation &&
				existing.index === event.index &&
				Object.is(existing.item, event.item)
			) {
				return list
			}

			return [...list.filter((page) => page.id !== event.id), event]
		})
	}, [])

	const onPageChange = useCallback(
		(index: number) => {
			if (index !== current.current) {
				current.current = index
				props.onPageChange?.(index)
			}
		},
		[props.onPageChange],
	)

	@if (props.items.length > 0) {
		<>
			<pager
				id={props.id}
				className={['vx-pager', props.className]}
				style={props.style}
				items={props.items}
				renderItem={props.renderItem}
				selectedIndex={props.page ?? props.defaultPage ?? 0}
				onSelectedIndexChange={(e: any) => onPageChange(e?.value ?? e?.index ?? 0)}
				__onCellTarget={onTarget}
				accessible={props.accessible}
				accessibilityRole={props.accessibilityRole ?? 'adjustable'}
				accessibilityLabel={props.accessibilityLabel}
				accessibilityHint={props.accessibilityHint}
				accessibilityValue={props.accessibilityValue}
				accessibilityState={props.accessibilityState}
				accessibilityLiveRegion={props.accessibilityLiveRegion}
			/>
			{pages.map((page) => (
				<PagePortal key={page.id} page={page} render={props.renderItem} />
			))}
		</>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
