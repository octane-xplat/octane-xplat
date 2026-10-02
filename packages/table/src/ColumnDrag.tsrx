import { useRef } from 'octane'
import { Pressable, HStack as Row, Text, View } from '@octane-xplat/ui'
import { dragTarget, moveColumn, resizedWidth } from './grid-layout'

/** Pan handlers use shared gesture payloads; no browser resize listeners. */
export function ColumnDrag(props: {
	table: any
	column: any
	resize?: boolean
	reorder?: boolean
	direction?: 'ltr' | 'rtl'
	id?: string
	state: any
}) {
	void props.state
	const drag = useRef<{
		size: number
		sizing: Record<string, number>
		order: string[]
		columns: any[]
	} | null>(null)

	const begin = () => {
		drag.current = {
			size: props.column.getSize(),
			sizing: { ...props.table.store.get().columnSizing },
			order: props.table.getAllLeafColumns().map((column: any) => column.id),
			columns: props.table.getVisibleLeafColumns().map((column: any) => {
				const size = column.getSize()
				return { id: column.id, getSize: () => size }
			}),
		}
	}

	const onPan = (event: any, resize: boolean) => {
		if (event.state === 'began') {
			begin()
			return
		}

		const start = drag.current
		if (!start) return
		if (event.state === 'cancelled') {
			if (resize)
				props.table.setColumnSizing((old: Record<string, number>) => {
					const next = { ...old }
					if (start.sizing[props.column.id] == null) delete next[props.column.id]
					else next[props.column.id] = start.sizing[props.column.id]

					return next
				})

			drag.current = null
			return
		}

		const dx = event.dx * (props.direction === 'rtl' ? -1 : 1)
		if (resize && Number.isFinite(dx)) {
			props.table.setColumnSizing((old: any) => ({
				...old,
				[props.column.id]: resizedWidth(props.column, start.size + dx),
			}))
		}

		if (event.state === 'ended') {
			if (!resize) {
				const target = dragTarget(start.columns, props.column.id, dx)
				props.table.setColumnOrder(moveColumn(start.order, props.column.id, target))
			}

			drag.current = null
		}
	}

	const adjust = (delta: number) =>
		props.table.setColumnSizing((old: any) => ({
			...old,
			[props.column.id]: resizedWidth(props.column, props.column.getSize() + delta),
		}))

	return (
		<Row className="vx-datagrid-handles">
			{props.reorder ? (
				<View
					id={props.id ? `${props.id}-drag` : undefined}
					className="vx-datagrid-handle"
					onPan={(event) => onPan(event, false)}
					accessibilityLabel={`Drag ${props.column.id} to reorder`}
				>
					<Text>↔</Text>
				</View>
			) : null}
			{props.resize ? (
				<>
					<Pressable
						id={props.id ? `${props.id}-narrow` : undefined}
						className="vx-datagrid-handle"
						onPress={() => adjust(-10)}
						accessibilityLabel={`Narrow ${props.column.id}`}
					>
						<Text>−</Text>
					</Pressable>
					<View
						id={props.id ? `${props.id}-resize` : undefined}
						className="vx-datagrid-handle"
						onPan={(event) => onPan(event, true)}
						accessibilityLabel={`Drag to resize ${props.column.id}`}
					>
						<Text>│</Text>
					</View>
					<Pressable
						id={props.id ? `${props.id}-widen` : undefined}
						className="vx-datagrid-handle"
						onPress={() => adjust(10)}
						accessibilityLabel={`Widen ${props.column.id}`}
					>
						<Text>+</Text>
					</Pressable>
				</>
			) : null}
		</Row>
	)
}
