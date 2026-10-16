/** @jsxImportSource @octane-xplat/macos-renderer */
import { createPortal, type UniversalRenderable } from 'octane/universal/native'
import { useCallback, useState } from 'octane'

/** @internal Compiler-owned tab content; refs still expose the raw logical handle. */
export function __PortalTabItem(props: any) {
	const [target, setTarget] = useState<any>(null)
	const onTarget = useCallback((host: any) => setTarget(host), [])
	const { children, ...attributes } = props
	return (
		<>
			<tabviewitem {...attributes} __portalContent={true} __onContentTarget={onTarget} />
			{target ? createPortal(children as UniversalRenderable, target) : null}
		</>
	)
}

interface CellBinding {
	id: number
	generation: number
	target: unknown
	item: any
	index: number
}

function CellContent(props: {
	key?: number
	render: (item: any, index: number) => any
	item: any
	index: number
}) {
	return <>{props.render(props.item, props.index)}</>
}

function CellPortal(props: {
	key?: number
	cell: CellBinding
	render: (item: any, index: number) => any
}) {
	const cell = props.cell
	return createPortal(
		(
			<CellContent
				key={cell.generation}
				render={props.render}
				item={cell.item}
				index={cell.index}
			/>
		) as UniversalRenderable,
		cell.target,
	)
}

/** @internal Recycled native hosts share the declaring list's Octane tree. */
export function __PortalList(props: any) {
	const [cells, setCells] = useState<CellBinding[]>([])
	const onTarget = useCallback((event: CellBinding & { type: 'bind' | 'release' }) => {
		setCells((current) => {
			const existing = current.find((cell) => cell.id === event.id)
			if (event.type === 'release') {
				return existing?.generation === event.generation
					? current.filter((cell) => cell.id !== event.id)
					: current
			}
			if (
				existing?.generation === event.generation &&
				existing.index === event.index &&
				Object.is(existing.item, event.item)
			)
				return current
			return [...current.filter((cell) => cell.id !== event.id), event]
		})
	}, [])
	return (
		<>
			<listview {...props} __onCellTarget={props.renderItem ? onTarget : undefined} />
			{cells.map((cell) => (
				<CellPortal key={cell.id} cell={cell} render={props.renderItem} />
			))}
		</>
	)
}
