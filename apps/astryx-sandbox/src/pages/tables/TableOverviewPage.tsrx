// Astryx 0.6.4 table-overview, re-authored with public Octane components (MIT).
import { useState } from 'octane'
import {
	Avatar,
	AvatarGroup,
	Badge,
	Card,
	Collapsible,
	Heading,
	HStack,
	Table,
	Text,
	TextInput,
	VStack,
	pixel,
	proportional,
	useTableSelection,
	useTableSelectionState,
} from '@octane-xplat/ui'

import type { TableColumn } from '@octane-xplat/ui'
import { acceptedAndReady, needsCodeReview, waitingForAWhile } from './review-data'
import type { ReviewRow } from './review-data'

const columns: TableColumn<ReviewRow>[] = [
	{
		key: 'title',
		header: 'Review',
		width: proportional(3),
		renderCell: (item) => (
			<VStack>
				<Text weight="semibold">{item.title}</Text>
				<Text color="secondary">{item.prId}</Text>
			</VStack>
		),
	},
	{ key: 'lines', header: 'Lines', width: pixel(65) },
	{ key: 'reviewTime', header: 'Review time', width: pixel(120) },
	{
		key: 'authorName',
		header: 'Author',
		width: pixel(160),
		renderCell: (item) => (
			<HStack gap={2}>
				<Avatar src={item.authorAvatar} alt={item.authorName} />
				<Text>{item.authorName}</Text>
			</HStack>
		),
	},
	{
		key: 'reviewers',
		header: 'Reviewers',
		width: pixel(100),
		renderCell: (item) => (
			<AvatarGroup max={3}>
				{item.reviewerAvatars.map((src, index) => (
					<Avatar key={src} src={src} alt={`Reviewer ${index + 1}`} />
				))}
			</AvatarGroup>
		),
	},
	{
		key: 'testStatus',
		header: 'Tests',
		width: pixel(90),
		renderCell: (item) => <Badge>{item.testStatus}</Badge>,
	},
	{ key: 'status', header: 'Status', width: pixel(150) },
	{ key: 'created', header: 'Created', width: pixel(120) },
]

function Section(props: {
	label: string
	data: ReviewRow[]
	selectedKeys: Set<string>
	onChange: (keys: Set<string>) => void
}) @{
	const { selectionConfig } = useTableSelectionState({
		data: props.data,
		idKey: 'id',
		selectedKeys: props.selectedKeys,
		setSelectedKeys: props.onChange,
	})

	const selection = useTableSelection(selectionConfig)

	<Collapsible trigger={<Text weight="semibold">{`${props.label} (${props.data.length})`}</Text>}>
		<Table data={props.data} columns={columns} idKey="id" plugins={{ selection }} />
	</Collapsible>
}

export function TableOverviewPage() @{
	const [search, setSearch] = useState('')
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
	const groups = [
		{ label: 'Waiting for a while', data: waitingForAWhile },
		{ label: 'Needs code review', data: needsCodeReview },
		{ label: 'Accepted and ready to land', data: acceptedAndReady },
	].map((group) => ({
		...group,
		data: group.data.filter((row) =>
			[row.title, row.authorName, row.prId].some((value) =>
				value.toLowerCase().includes(search.toLowerCase().trim()),
			),
		),
	}))

	<VStack gap={6} padding={4}>
		<Heading level={1}>Table Overview</Heading>
		<Text color="secondary">
			A code review dashboard demonstrating Table with selection, badges, avatars, and collapsible
			sections.
		</Text>
		<TextInput label="Search" value={search} onChange={setSearch} placeholder="Search..." />
		<HStack gap={3} wrap="wrap">
			{[
				['Review streak', '4 days'],
				['Reviews today', '6'],
				['Diff reviews', '28'],
				['Post-land reviews', '3'],
				['Mobile reviews', '2'],
			].map(([label, value]) => (
				<Card key={label}>
					<VStack padding={3}>
						<Text color="secondary">{label}</Text>
						<Text weight="bold">{value}</Text>
					</VStack>
				</Card>
			))}
		</HStack>
		{groups
			.filter((group) => group.data.length > 0)
			.map((group) => (
				<Section
					key={group.label}
					label={group.label}
					data={group.data}
					selectedKeys={selectedKeys}
					onChange={setSelectedKeys}
				/>
			))}
	</VStack>
}
