// Port of upstream templates/pages/kanban-board/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/kanban-board/.
// GAPS: pointer drag-and-drop is rebuilt on DOM events (same hit-testing
// contract: column rect + card midpoint); Octane exposes no dnd primitive for
// this pattern — noted as an app-level implementation, not a framework sub.
import { useMemo, useRef, useState } from 'octane'
import {
	Badge, Button, Card, EmptyState, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, Link, Selector, StackItem, Text, VStack,
} from '@octane-xplat/ui'

type ColumnId = 'todo' | 'in-progress' | 'in-review' | 'done'
type Priority = 'high' | 'medium' | 'low'

interface WorkItem {
	id: string
	column: ColumnId
	ref: string
	priority: Priority
	title: string
	description: string
	lastEdited: string
	dueDate: string
}

interface ColumnMeta {
	id: ColumnId
	title: string
	variant: string
	tooltip: string
	emptyTitle: string
	emptyDescription: string
	emptyIcon: string
}

interface DropTarget {
	column: ColumnId
	index: number
}

interface DragState {
	id: string
	width: number
	height: number
	offsetX: number
	offsetY: number
	pointerX: number
	pointerY: number
	target: DropTarget | null
}

const COLUMNS: ColumnMeta[] = [
	{ id: 'todo', title: 'To-do', variant: 'neutral', tooltip: 'Items assigned to this sprint, waiting to be picked up.', emptyTitle: 'To-do is empty', emptyDescription: 'Items pulled into this sprint appear here.', emptyIcon: 'sandbox-inbox' },
	{ id: 'in-progress', title: 'In progress', variant: 'accent', tooltip: 'Items currently in progress.', emptyTitle: 'Nothing in progress', emptyDescription: 'Items being worked on appear here.', emptyIcon: 'sandbox-arrow-path' },
	{ id: 'in-review', title: 'In review', variant: 'warning', tooltip: 'Items waiting for your review.', emptyTitle: 'Nothing in review', emptyDescription: 'Items awaiting your review appear here.', emptyIcon: 'sandbox-clipboard-document-check' },
	{ id: 'done', title: 'Done', variant: 'success', tooltip: 'Items that have been handled.', emptyTitle: 'Nothing done yet', emptyDescription: 'Completed items appear here.', emptyIcon: 'sandbox-check-circle' },
]

const PRIORITY_META: Record<Priority, { label: string; variant: 'error' | 'warning' | 'teal' }> = {
	high: { label: 'High', variant: 'error' },
	medium: { label: 'Medium', variant: 'warning' },
	low: { label: 'Low', variant: 'teal' },
}

const INITIAL_ITEMS: WorkItem[] = [
	{ id: 't1', column: 'todo', ref: 'Task 4821', priority: 'low', title: 'Draft project kickoff brief', description: 'Write a short brief outlining goals, scope, and success criteria for the upcoming project.', lastEdited: '2h ago', dueDate: 'Jul 8' },
	{ id: 't2', column: 'todo', ref: 'Task 4842', priority: 'low', title: 'Collect feedback from stakeholders', description: 'Gather input from key stakeholders and summarize the main themes for the next review.', lastEdited: '1d ago', dueDate: 'Jul 11' },
	{ id: 'p1', column: 'in-progress', ref: 'Task 4825', priority: 'high', title: 'Design the landing page layout', description: 'Create a first-pass layout for the landing page and share it for early feedback.', lastEdited: '18m ago', dueDate: 'Jul 3' },
	{ id: 'p2', column: 'in-progress', ref: 'Task 4833', priority: 'medium', title: 'Set up the project workspace', description: 'Configure the shared workspace and invite the team so everyone has access.', lastEdited: '5m ago', dueDate: 'Jul 4' },
	{ id: 'r1', column: 'done', ref: 'Task 4788', priority: 'low', title: 'Write the weekly status update', description: 'Summarize progress, blockers, and next steps in a short update for the team.', lastEdited: 'Yesterday', dueDate: 'Jul 1' },
	{ id: 'r2', column: 'done', ref: 'Task 4789', priority: 'high', title: 'Prepare the demo walkthrough', description: 'Put together a short walkthrough covering the main features for the demo.', lastEdited: '3d ago', dueDate: 'Jun 30' },
]

const SPRINTS = [
	{ value: '002', label: 'Sprint 002' },
	{ value: '003', label: 'Sprint 003' },
	{ value: '004', label: 'Sprint 004' },
]

const boardStyles: Record<string, any> = {
	row: { display: 'flex', gap: 'var(--spacing-3)', alignItems: 'stretch', overflowX: 'auto', padding: 'var(--spacing-3)' },
	column: { flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' },
	columnBody: {
		display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)',
		backgroundColor: 'var(--color-background-muted)', borderRadius: 'var(--radius-element)',
		padding: 'var(--spacing-2)', minHeight: 200, flex: 1,
	},
	card: { cursor: 'grab', touchAction: 'none' },
	cardDragging: { opacity: 0.35 },
	ghost: {
		position: 'fixed', zIndex: 1000, pointerEvents: 'none',
		boxShadow: '0 12px 32px rgba(0,0,0,0.25)', borderRadius: 'var(--radius-element)',
	},
	dropLine: { height: 3, borderRadius: 2, backgroundColor: 'var(--color-accent-primary, #0171E3)' },
}

function WorkCard(props: { item: WorkItem; isDraggingSource: boolean; cardRef: (el: HTMLElement | null) => void; onPointerDown: (e: PointerEvent) => void }) @{
	const item = props.item
	<div
		ref={props.cardRef}
		style={{ ...boardStyles.card, ...(props.isDraggingSource ? boardStyles.cardDragging : {}) }}
		onPointerDown={props.onPointerDown}
	>
		<Card padding={3}>
			<VStack gap={2}>
				<HStack gap={2} vAlign="center" hAlign="between">
					<Text type="supporting" color="secondary">{item.ref}</Text>
					<Badge label={PRIORITY_META[item.priority].label} variant={PRIORITY_META[item.priority].variant} />
				</HStack>
				<Heading level={4}>{item.title}</Heading>
				<Text type="supporting" color="secondary" maxLines={2}>
					{item.description}
				</Text>
				<HStack gap={3} vAlign="center" hAlign="between">
					<Text type="supporting" color="secondary">Edited {item.lastEdited}</Text>
					<Text type="supporting" color="secondary">Due {item.dueDate}</Text>
				</HStack>
			</VStack>
		</Card>
	</div>
}

export function KanbanBoardTemplate() @{
	const [items, setItems] = useState<WorkItem[]>(INITIAL_ITEMS)
	const [sprint, setSprint] = useState('003')
	const [drag, setDrag] = useState<DragState | null>(null)

	const columnEls = useRef(new Map<ColumnId, HTMLElement>())
	const cardEls = useRef(new Map<string, HTMLElement>())
	const teardownRef = useRef<(() => void) | null>(null)

	const itemsByColumn = useMemo(() => {
		const map: Record<ColumnId, WorkItem[]> = { todo: [], 'in-progress': [], 'in-review': [], done: [] }
		for (const item of items) {map[item.column].push(item)}
		return map
	}, [items])

	const computeTarget = (px: number, py: number, draggedId: string): DropTarget | null => {
		for (const [colId, el] of Array.from(columnEls.current.entries())) {
			const r = el.getBoundingClientRect()
			if (px < r.left || px > r.right || py < r.top || py > r.bottom) {continue}
			const ids = itemsByColumn[colId].filter((it) => it.id !== draggedId).map((it) => it.id)
			let index = ids.length
			for (let i = 0; i < ids.length; i++) {
				const cardEl = cardEls.current.get(ids[i])
				if (!cardEl) {continue}
				const cr = cardEl.getBoundingClientRect()
				if (py < cr.top + cr.height / 2) {
					index = i
					break
				}
			}
			return { column: colId, index }
		}
		return null
	}

	const commitDrag = (id: string, target: DropTarget) => {
		setItems((prev) => {
			const moved = prev.find((it) => it.id === id)
			if (!moved) {return prev}
			const rest = prev.filter((it) => it.id !== id)
			const updated: WorkItem = { ...moved, column: target.column }
			const colItems = rest.filter((it) => it.column === target.column)
			const anchor = colItems[target.index]
			if (!anchor) {return [...rest, updated]}
			const at = rest.indexOf(anchor)
			return [...rest.slice(0, at), updated, ...rest.slice(at)]
		})
	}

	const onCardPointerDown = (e: PointerEvent, id: string) => {
		if (e.button !== 0) {return}
		const cardEl = cardEls.current.get(id)
		if (!cardEl) {return}
		const r = cardEl.getBoundingClientRect()
		const state: DragState = {
			id,
			width: r.width,
			height: r.height,
			offsetX: e.clientX - r.left,
			offsetY: e.clientY - r.top,
			pointerX: e.clientX,
			pointerY: e.clientY,
			target: null,
		}
		setDrag(state)

		const onMove = (ev: PointerEvent) => {
			setDrag((d) =>
				d == null ? d : { ...d, pointerX: ev.clientX, pointerY: ev.clientY, target: computeTarget(ev.clientX, ev.clientY, id) },
			)
		}
		const onUp = (ev: PointerEvent) => {
			const target = computeTarget(ev.clientX, ev.clientY, id)
			if (target) {commitDrag(id, target)}
			setDrag(null)
			teardown()
		}
		const teardown = () => {
			window.removeEventListener('pointermove', onMove)
			window.removeEventListener('pointerup', onUp)
			teardownRef.current = null
		}
		teardownRef.current = teardown
		window.addEventListener('pointermove', onMove)
		window.addEventListener('pointerup', onUp)
	}

	const draggedItem = drag ? items.find((it) => it.id === drag.id) : undefined

	<Layout
		height="fill"
		header={
			<LayoutHeader padding={4} hasDivider>
				<HStack gap={3} vAlign="center" wrap="wrap">
					<StackItem size="fill">
						<VStack gap={0}>
							<Heading level={3}>Sprint Board</Heading>
							<Text type="supporting" color="secondary">
								Drag cards between columns to update status.
							</Text>
						</VStack>
					</StackItem>
					<HStack gap={2} vAlign="center">
						<Selector
							label="Sprint"
							isLabelHidden
							options={SPRINTS}
							value={sprint}
							onValueChange={(v) => setSprint(v ?? '')}
						/>
						<Button label="Filter" variant="secondary" clickAction={() => {}} />
						<Link href="#">View all tasks</Link>
					</HStack>
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={0}>
				<div style={boardStyles.row}>
					{COLUMNS.map((col) => {
						const colItems = itemsByColumn[col.id]
						const dropIndex = drag?.target?.column === col.id ? drag.target.index : -1
						const visibleIds = colItems.filter((it) => it.id !== drag?.id).map((it) => it.id)
						return (
							<div
								key={col.id}
								style={boardStyles.column}
								ref={(el: HTMLElement | null) => {
									if (el) {columnEls.current.set(col.id, el)} else {columnEls.current.delete(col.id)}
								}}
							>
								<HStack gap={2} vAlign="center">
									<Heading level={4}>{col.title}</Heading>
									<Text type="supporting" color="secondary">{colItems.length}</Text>
								</HStack>
								<div style={boardStyles.columnBody} title={col.tooltip}>
									{colItems.length === 0 && dropIndex < 0 ? (
										<EmptyState
											title={col.emptyTitle}
											description={col.emptyDescription}
											icon={<Icon name={col.emptyIcon} size={24} color="secondary" />}
											isCompact
										/>
									) : null}
									{colItems.map((item) => {
										const idxExcluding = visibleIds.indexOf(item.id)
										const showLineBefore = dropIndex >= 0 && idxExcluding === dropIndex
										return (
											<div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
												{showLineBefore ? <div style={boardStyles.dropLine} /> : null}
												<WorkCard
													item={item}
													isDraggingSource={drag?.id === item.id}
													cardRef={(el: HTMLElement | null) => {
														if (el) {cardEls.current.set(item.id, el)} else {cardEls.current.delete(item.id)}
													}}
													onPointerDown={(e: PointerEvent) => onCardPointerDown(e, item.id)}
												/>
											</div>
										)
									})}
									{dropIndex >= 0 && dropIndex === visibleIds.length ? <div style={boardStyles.dropLine} /> : null}
								</div>
							</div>
						)
					})}
				</div>
				{drag && draggedItem ? (
					<div
						style={{
							...boardStyles.ghost,
							left: drag.pointerX - drag.offsetX,
							top: drag.pointerY - drag.offsetY,
							width: drag.width,
							height: drag.height,
						}}
					>
						<Card padding={3}>
							<VStack gap={1}>
								<Heading level={4}>{draggedItem.title}</Heading>
								<Text type="supporting" color="secondary" maxLines={1}>
									{draggedItem.ref}
								</Text>
							</VStack>
						</Card>
					</div>
				) : null}
			</LayoutContent>
		}
	/>
}
