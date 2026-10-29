/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useRef, useState } from 'octane'
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { Button, Heading, Text, TextInput, View } from '@octane-xplat/ui'

const RecordName = createContext('Untitled')
const RecordNameProvider: any = RecordName

function RecordLabel() @{
	const name = useContext(RecordName)
	<Text id="native-sheet-context">{`Provider record: ${name}`}</Text>
}

function NestedSheet() @{
	const [open, setOpen] = useState(false), [dismissals, setDismissals] = useState(0)
	<>
		<Button label="Open nested sheet" clickAction={() => setOpen(true)} />
		<Text>{`Nested dismissals: ${dismissals}`}</Text>
		<AppKitSheet id="native-sheet-nested" open={open} className="gap-3 p-4" onDismissed={() => { setOpen(false); setDismissals((n) => n + 1) }}
			content={() => <View className="gap-3"><Heading>Nested confirmation</Heading><RecordLabel /><Button label="Close nested sheet" clickAction={() => setOpen(false)} /></View>} />
	</>
}

export function NativeSheetDemo() @{
	const [open, setOpen] = useState(false), [queued, setQueued] = useState(false), [mounted, setMounted] = useState(true)
	const [record, setRecord] = useState('A'), [name, setName] = useState('Packing list'), [alternate, setAlternate] = useState(false)
	const [dismissals, setDismissals] = useState(0), [lastCallback, setLastCallback] = useState('none')
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
	const unmountLater = () => {
		if (timer.current !== null) clearTimeout(timer.current)
		timer.current = setTimeout(() => { timer.current = null; setMounted(false); setOpen(false) }, 1500)
	}
	<View className="gap-4">
		<Heading>AppKit window sheet</Heading>
		<Button label="Open sheet" clickAction={() => { setMounted(true); setOpen(true) }} />
		<Button label="Mount initially open sheet" clickAction={() => { setMounted(true); setOpen(true) }} />
		<Button label="Unmount sheet owner" clickAction={() => { setMounted(false); setOpen(false) }} />
		<RecordNameProvider value={name}>
			@if (mounted) {
				<AppKitSheet id={`native-sheet-${record}`} open={open} className="gap-3 p-4"
					onDismissed={() => { setOpen(false); setDismissals((n) => n + 1); setLastCallback(alternate ? 'B' : 'A') }}
					content={() => <View className="gap-3">
						<Heading>Edit record</Heading><RecordLabel />
						<TextInput label="Record name" value={name} onChange={setName} />
						<Button label="Replace dismissal callback" clickAction={() => setAlternate(!alternate)} />
						<Button label="Replace record scope" clickAction={() => setRecord(record === 'A' ? 'B' : 'A')} />
						<Button label="Queue another sheet on the main window" clickAction={() => setQueued(true)} />
						<Button label="Cancel queued sheet" clickAction={() => setQueued(false)} />
						<Button label="Unmount this owner in 1.5 seconds" clickAction={unmountLater} />
						<NestedSheet />
						<Button label="Save and close" clickAction={() => setOpen(false)} />
					</View>} />
			}
			<AppKitSheet id="native-sheet-queued" open={queued} className="gap-3 p-4" onDismissed={() => setQueued(false)}
				content={() => <View className="gap-3"><Heading>Queued sheet</Heading><RecordLabel /><Button label="Close queued sheet" clickAction={() => setQueued(false)} /></View>} />
		</RecordNameProvider>
		<Text id="native-sheet-status">{`${open ? 'Open requested' : 'Closed'} · record ${record} · ${dismissals} dismissals · callback ${lastCallback} · ${queued ? 'second requested' : 'no second request'}`}</Text>
		<Text>Native qualification pending. Check text/IME/Tab, provider updates, native Escape/close, queue cancellation, nested sheets, owner replacement, and parent-window close. Open then unmount before testing an initially open mount.</Text>
	</View>
}
