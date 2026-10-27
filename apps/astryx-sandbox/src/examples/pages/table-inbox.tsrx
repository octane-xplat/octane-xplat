// Astryx 0.6.4 support inbox (MIT). Public Table selection and detail composition.
import { useState } from 'octane'
import {
	Button,
	Tokenizer,
	createStaticSource,
	ResizeHandle,
	useResizable,
	useMediaQuery,
	Thumbnail,
	useLightbox,
	Collapsible,
	Heading,
	HStack,
	SegmentedControl,
	SegmentedControlItem,
	Table,
	Text,
	TextArea,
	TextInput,
	VStack,
	pixel,
	proportional,
	useTableSelection,
	useTableSelectionState,
} from '@octane-xplat/ui'

import type { SearchableItem, TableColumn } from '@octane-xplat/ui'
import { CATEGORIES, CONVERSATIONS, inCategory } from './inbox-data'
import type { Category, Conversation } from './inbox-data'

const recipientSource = createStaticSource(
	CONVERSATIONS.map((item) => ({
		id: item.senderEmail,
		label: `${item.sender} <${item.senderEmail}>`,
	})),
)

function AttachmentStrip(props: {
	attachments: { id: string; name: string; src: string }[]
}) @{
	const lightbox = useLightbox({
		media: props.attachments.map((item) => ({ src: item.src, alt: item.name })),
	})

	<>
		<HStack gap={2}>
			{props.attachments.map((item, index) => (
				<Thumbnail
					key={item.id}
					src={item.src}
					alt={item.name}
					label={item.name}
					onPress={() => lightbox.open(index)}
				/>
			))}
		</HStack>
		{lightbox.element}
	</>
}

export function TableInboxTemplate() @{
	const narrow = useMediaQuery('(max-width: 899px)')
	const pane = useResizable({ defaultSize: pixel(440), minSize: pixel(300), maxSize: pixel(800) })
	const [category, setCategory] = useState<Category>('inbox')
	const [chosenId, setChosenId] = useState<string | null | undefined>(undefined)
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
	const [isComposeOpen, setIsComposeOpen] = useState(false)
	const [recipient, setRecipient] = useState<SearchableItem[]>([])
	const [subject, setSubject] = useState('')
	const [body, setBody] = useState('')
	const [hasCc, setHasCc] = useState(false)
	const [hasBcc, setHasBcc] = useState(false)
	const [cc, setCc] = useState<SearchableItem[]>([])
	const [bcc, setBcc] = useState<SearchableItem[]>([])
	const visible = CONVERSATIONS.filter((item) => inCategory(item, category))
	const active =
		chosenId === undefined
			? narrow
				? undefined
				: visible[0]
			: visible.find((item) => item.id === chosenId)

	const { selectionConfig } = useTableSelectionState({
		data: visible,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})

	const selection = useTableSelection(selectionConfig)
	const columns: TableColumn<Conversation>[] = [
		{ key: 'sender', header: 'Sender', width: pixel(150) },
		{
			key: 'subject',
			header: 'Conversation',
			width: proportional(3),
			renderCell: (item) => (
				<Button label={item.subject} variant="plain" clickAction={() => setChosenId(item.id)} />
			),
		},
		{ key: 'receivedAt', header: 'Received', width: pixel(90) },
		{ key: 'priority', header: 'Priority', width: pixel(90) },
	]

	<VStack gap={4} padding={4}>
		<HStack hAlign="between">
			<Heading level={1}>Inbox</Heading>
			<Button label="Compose" clickAction={() => setIsComposeOpen(true)} />
		</HStack>
		<SegmentedControl
			label="Inbox categories"
			value={category}
			onValueChange={(value) => {
				setCategory(value as Category)
				setChosenId(undefined)
			}}
		>
			{CATEGORIES.map((option) => (
				<SegmentedControlItem
					key={option.value}
					value={option.value}
					label={`${option.label} (${CONVERSATIONS.filter((item) => inCategory(item, option.value) && item.isUnread).length})`}
				/>
			))}
		</SegmentedControl>
		{selectedKeys.size > 0 && (
			<HStack gap={3}>
				<Text>{`${selectedKeys.size} selected`}</Text>
				<Button label="Unselect All" clickAction={() => setSelectedKeys(new Set())} />
			</HStack>
		)}
		<HStack gap={3}>
			{(!narrow || !active) && (
				<Table data={visible} columns={columns} idKey="id" plugins={{ selection }} hasHover />
			)}
			{active && (
				<HStack>
					{!narrow && <ResizeHandle label="Resize conversation pane" resizable={pane.props} />}
					<VStack width={narrow ? 'fill' : pane.size} gap={3} padding={4}>
						<HStack hAlign="between">
							<Heading level={2}>{active.subject}</Heading>
							<Button label="Close conversation" clickAction={() => setChosenId(null)} />
						</HStack>
						<Text>{`${active.sender} <${active.senderEmail}> · ${active.receivedFull}`}</Text>
						<Text>{`${active.priority} · ${active.tags.join(' · ')}`}</Text>
						{active.replies?.map((reply) => (
							<Collapsible
								key={reply.id}
								trigger={<Text>{`${reply.sender} · ${reply.receivedFull}`}</Text>}
							>
								<VStack gap={2}>
									<Text>{reply.senderEmail}</Text>
									{reply.body.map((line, index) => (
										<Text key={index}>{line}</Text>
									))}
								</VStack>
							</Collapsible>
						))}
						{active.body.map((line, index) => (
							<Text key={index}>{line}</Text>
						))}
						<AttachmentStrip attachments={active.attachments} />
						<HStack gap={2}>
							{['Archive', 'Move to folder', 'Delete'].map((label) => (
								<Button key={label} label={label} variant="secondary" />
							))}
						</HStack>
						<Button
							label="Reply"
							clickAction={() => {
								setRecipient([
									{ id: active.senderEmail, label: `${active.sender} <${active.senderEmail}>` },
								])

								setSubject(`Re: ${active.subject}`)
								setIsComposeOpen(true)
							}}
						/>
					</VStack>
				</HStack>
			)}
		</HStack>
		{isComposeOpen && (
			<VStack gap={3} padding={4}>
				<Heading level={2}>New message</Heading>
				<Tokenizer
					label="Recipient"
					searchSource={recipientSource}
					value={recipient}
					onChange={setRecipient}
					hasCreate
				/>
				<HStack gap={2}>
					<Button label="Cc" clickAction={() => setHasCc(!hasCc)} />
					<Button label="Bcc" clickAction={() => setHasBcc(!hasBcc)} />
				</HStack>
				{hasCc && (
					<Tokenizer
						label="Cc"
						searchSource={recipientSource}
						value={cc}
						onChange={setCc}
						hasCreate
					/>
				)}
				{hasBcc && (
					<Tokenizer
						label="Bcc"
						searchSource={recipientSource}
						value={bcc}
						onChange={setBcc}
						hasCreate
					/>
				)}
				<TextInput label="Subject" value={subject} onChange={setSubject} />
				<TextArea label="Message" value={body} onChange={setBody} />
				<HStack gap={3}>
					<Button label="Send" />
					<Button label="Close composer" clickAction={() => setIsComposeOpen(false)} />
					<Button
						label="Discard draft"
						clickAction={() => {
							setRecipient([])
							setSubject('')
							setBody('')
							setCc([])
							setBcc([])
							setHasCc(false)
							setHasBcc(false)
							setIsComposeOpen(false)
						}}
					/>
				</HStack>
			</VStack>
		)}
	</VStack>
}
