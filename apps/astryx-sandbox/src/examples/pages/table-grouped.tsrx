// Astryx 0.6.4 table-grouped (MIT), using shared grouping and search contracts.
import { useState } from 'octane'
import {
	Button,
	ResizeHandle,
	useResizable,
	Dialog,
	DialogHeader,
	Heading,
	Selector,
	HStack,
	RadioList,
	RadioListItem,
	Table,
	Text,
	TextInput,
	VStack,
	pixel,
	proportional,
	useTableGroupedRows,
} from '@octane-xplat/ui'

import type { TableColumn } from '@octane-xplat/ui'
import { allTasks } from './task-data'
import type { TaskRow } from './task-data'

const columns: TableColumn<TaskRow>[] = [
	{ key: 'status', header: 'Status', width: pixel(110) },
	{ key: 'title', header: 'Issue', width: proportional(3) },
	{ key: 'project', header: 'Project', width: pixel(180) },
	{ key: 'created', header: 'Created', width: pixel(90) },
	{ key: 'updated', header: 'Updated', width: pixel(90) },
	{ key: 'assignee', header: 'Assignee', width: pixel(110) },
]

export function TableGroupedTemplate() @{
	const detailPanel = useResizable({
		defaultSize: pixel(360),
		minSize: pixel(280),
		maxSize: pixel(500),
	})

	const [query, setQuery] = useState('')
	const [dialogOpen, setDialogOpen] = useState(false)
	const [groupBy, setGroupBy] = useState('status')
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
	const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null)
	const filtered = allTasks.filter((task) =>
		[task.title, task.taskId, task.subtitle].some((text) =>
			text.toLowerCase().includes(query.toLowerCase().trim()),
		),
	)

	const grouped = useTableGroupedRows({
		data: filtered,
		groupBy: (task) => String(task[groupBy]),
		collapsedGroups,
		onToggleGroup: (key) =>
			setCollapsedGroups((previous) => {
				const next = new Set(previous)
				if (next.has(key)) {
					next.delete(key)
				} else {
					next.add(key)
				}

				return next
			}),
		getRowKey: (task) => task.id,
		renderGroupHeader: (key, count) => (
			<Text weight="bold">{`${key.replaceAll('_', ' ')} (${count})`}</Text>
		),
	})

	const detail = {
		transformBodyRow: (props: any, item: TaskRow) => ({
			...props,
			htmlProps: { ...props.htmlProps, onClick: () => setSelectedTask(item) },
		}),
	}

	<VStack gap={4} padding={4}>
		<HStack hAlign="between">
			<Heading level={1}>All Issues</Heading>
			<Button label="Create issue" clickAction={() => setDialogOpen(true)} />
		</HStack>
		<TextInput
			label="Filter issues"
			value={query}
			onChange={setQuery}
			placeholder="Filter issues..."
		/>
		<RadioList
			label="Group by"
			value={groupBy}
			onValueChange={(value) => {
				setGroupBy(value)
				setCollapsedGroups(new Set())
			}}
		>
			{['none', 'status', 'priority', 'project', 'assignee'].map((value) => (
				<RadioListItem
					key={value}
					value={value}
					label={value === 'none' ? 'None' : value[0]!.toUpperCase() + value.slice(1)}
				/>
			))}
		</RadioList>
		<HStack gap={4}>
			<Table
				data={groupBy === 'none' ? filtered : grouped.data}
				columns={columns}
				idKey={groupBy === 'none' ? 'id' : grouped.idKey}
				plugins={groupBy === 'none' ? { detail } : { detail, grouped: grouped.plugin }}
				hasHover
			/>
			{selectedTask && (
				<HStack>
					<ResizeHandle label="Resize details" resizable={detailPanel.props} />
					<VStack width={detailPanel.size} gap={3} padding={4}>
						<Heading level={2}>{selectedTask.title}</Heading>
						<Text>{selectedTask.subtitle}</Text>
						<Text>{selectedTask.taskId}</Text>
						<Text>{selectedTask.project}</Text>
						<Text>{selectedTask.assignee}</Text>
						<Text>{selectedTask.priority}</Text>
						<Button label="Close details" clickAction={() => setSelectedTask(null)} />
					</VStack>
				</HStack>
			)}
		</HStack>
		<Dialog isOpen={dialogOpen} onOpenChange={setDialogOpen}>
			<VStack padding={4} gap={4}>
				<DialogHeader title="Create issue" onOpenChange={setDialogOpen} />
				<TextInput label="Title" placeholder="Issue title" value="" onChange={() => {}} />
				<Selector
					label="Status"
					value="todo"
					options={['in_progress', 'todo', 'backlog'].map((value) => ({ value, label: value }))}
					onValueChange={() => {}}
				/>
				<Selector
					label="Priority"
					value="none"
					options={['urgent', 'high', 'medium', 'low', 'none'].map((value) => ({
						value,
						label: value,
					}))}
					onValueChange={() => {}}
				/>
				<TextInput label="Project" value="" onChange={() => {}} />
				<HStack gap={2}>
					<Button label="Cancel" clickAction={() => setDialogOpen(false)} />
					<Button label="Create" clickAction={() => setDialogOpen(false)} />
				</HStack>
			</VStack>
		</Dialog>
	</VStack>
}
