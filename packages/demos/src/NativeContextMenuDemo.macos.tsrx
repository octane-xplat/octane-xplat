/** @jsxImportSource @octane-xplat/jsx */
import './NativeContextMenuDemo.macos.css'
import { useEffect, useRef, useState } from 'octane'
import { Button, Heading, Text, TextInput, View } from '@octane-xplat/ui'
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import type { AppKitContextMenuItem } from '@octane-xplat/context-menu/macos'

function DynamicMenuDetails() @{
	const [expanded, setExpanded] = useState(false)
	<View className="gap-2">
		<Button label="Add/remove trigger child" clickAction={() => setExpanded(!expanded)} />
		@if (expanded) { <Text id="native-context-menu-late-child">Right-click this child added after attachment</Text> }
	</View>
}

export function NativeContextMenuDemo() @{
	const [record, setRecord] = useState('note-a'), [alternate, setAlternate] = useState(false)
	const [canDelete, setCanDelete] = useState(false), [share, setShare] = useState(true), [reverse, setReverse] = useState(false)
	const [empty, setEmpty] = useState(false), [duplicate, setDuplicate] = useState(false), [mounted, setMounted] = useState(true)
	const [text, setText] = useState('Native editing keeps its own context menu'), [last, setLast] = useState('none'), [count, setCount] = useState(0)
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
	const actions: AppKitContextMenuItem[] = [{ id: 'rename', title: 'Rename' }, ...(share ? [{ id: 'share', title: 'Share' }] : []),
		{ id: 'delete', title: 'Delete', destructive: true, divider: true, disabled: !canDelete }, { id: 'blocked', title: 'Unavailable', disabled: true }]
	const items = empty ? [] : duplicate ? [...actions, actions[0]] : reverse ? [...actions].reverse() : actions
	<View className="gap-4">
		<Heading>AppKit context menu</Heading>
		<Button label="Change record scope" clickAction={() => setRecord(record === 'note-a' ? 'note-b' : 'note-a')} />
		<Button label="Change record after 1 second" clickAction={() => {
			if (timer.current !== null) clearTimeout(timer.current)
			timer.current = setTimeout(() => { timer.current = null; setRecord((current) => current === 'note-a' ? 'note-b' : 'note-a') }, 1000)
		}} />
		<Button label="Replace callback" clickAction={() => setAlternate(!alternate)} />
		<Button label="Toggle Delete enabled" clickAction={() => setCanDelete(!canDelete)} />
		<Button label="Add/remove Share" clickAction={() => setShare(!share)} />
		<Button label="Reverse items" clickAction={() => setReverse(!reverse)} />
		<Button label="Toggle empty items" clickAction={() => setEmpty(!empty)} />
		<Button label="Toggle duplicate IDs" clickAction={() => setDuplicate(!duplicate)} />
		<Button label="Mount/unmount menu" clickAction={() => setMounted(!mounted)} />
		@if (mounted) {
			<AppKitContextMenu id={`native-context-menu-${record}`} items={items} accessibilityLabel={`Actions for ${record}`}
				onItemSelected={(id) => { setLast(`${record}:${id}:callback-${alternate ? 'B' : 'A'}`); setCount((n) => n + 1) }}
				trigger={() => <View className="native-context-menu-card gap-2">
					<Text>{`Right-click ${record} for actions`}</Text>
					<DynamicMenuDetails />
					<TextInput label="Editable trigger child" value={text} onChange={setText} />
					<AppKitContextMenu id={`native-context-menu-inner-${record}`} items={[{ id: 'inspect', title: 'Inspect' }]}
						onItemSelected={(id) => { setLast(`${record}:inner:${id}`); setCount((n) => n + 1) }} trigger={() => <Text>Right-click for inner actions</Text>} />
				</View>} />
		}
		<Text id="native-context-menu-status">
			{`${record} · ${count} selections · last ${last}`}
		</Text>
		<Text>Actions update this status only. Test pointer/Control-click, nested and late children, native edit menus, menu replacement while open, disabled actions, Tab/VoiceOver and cleanup manually. Native behavior remains unqualified; destructive items use normal AppKit rows.</Text>
	</View>
}
