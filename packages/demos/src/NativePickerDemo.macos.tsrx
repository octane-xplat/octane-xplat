/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { AppKitPicker } from '@octane-xplat/picker/macos'
import type { AppKitPickerOption } from '@octane-xplat/picker/macos'
import { Button, Heading, Text, View } from '@octane-xplat/ui'

export function NativePickerDemo() @{
	const [selection, setSelection] = useState('carry'), [controlled, setControlled] = useState(true), [accept, setAccept] = useState(true)
	const [disabled, setDisabled] = useState(false), [mounted, setMounted] = useState(true), [empty, setEmpty] = useState(false)
	const [reverse, setReverse] = useState(false), [duplicateID, setDuplicateID] = useState(false), [invalidSelection, setInvalidSelection] = useState(false)
	const [alternate, setAlternate] = useState(false), [record, setRecord] = useState('A'), [revision, setRevision] = useState(0)
	const [events, setEvents] = useState(0), [last, setLast] = useState('none')
	const base = useRef<AppKitPickerOption[]>([{ id: 'carry', title: 'Cabin bag' }, { id: '', title: 'Cabin bag' }, { id: 'checked', title: 'Checked bag' }, { id: 'blocked', title: 'Oversized bag', disabled: true }])
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
	const replaceLater = () => {
		if (timer.current !== null) clearTimeout(timer.current)
		timer.current = setTimeout(() => { timer.current = null; setRecord((value) => value === 'A' ? 'B' : 'A') }, 1500)
	}
	let options = empty ? [] : reverse ? [...base.current].reverse() : base.current
	if (duplicateID) options = [...options, { id: 'carry', title: 'Duplicate ID' }]
	<View className="gap-4">
		<Heading>AppKit pop-up picker</Heading>
		@if (mounted) {
			<AppKitPicker id={`native-picker-${record}`} label={`Bag for record ${record}`} options={options}
				selection={controlled ? (invalidSelection ? 'missing' : selection) : undefined} defaultSelection="checked" disabled={disabled}
				onSelectionChange={(id) => { setEvents((n) => n + 1); setLast(`${alternate ? 'B' : 'A'}: ${JSON.stringify(id)}`); if (accept) setSelection(id) }} />
		}
		<Button label="Toggle controlled selection" clickAction={() => setControlled(!controlled)} />
		<Button label="Accept/reject controlled changes" clickAction={() => setAccept(!accept)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Reverse choices" clickAction={() => setReverse(!reverse)} />
		<Button label="Rename choice in place" clickAction={() => { base.current[1].title = `Renamed ${revision + 1}`; setRevision((n) => n + 1) }} />
		<Button label="Toggle empty choices" clickAction={() => setEmpty(!empty)} />
		<Button label="Toggle duplicate ID" clickAction={() => setDuplicateID(!duplicateID)} />
		<Button label="Toggle missing controlled ID" clickAction={() => { setControlled(true); setInvalidSelection(!invalidSelection) }} />
		<Button label="Replace current handler" clickAction={() => setAlternate(!alternate)} />
		<Button label="Replace record" clickAction={() => setRecord(record === 'A' ? 'B' : 'A')} />
		<Button label="Replace record in 1.5 seconds, then open menu" clickAction={replaceLater} />
		<Button label="Mount/unmount picker" clickAction={() => setMounted(!mounted)} />
		<Text id="native-picker-status">{`${controlled ? 'Controlled' : 'Uncontrolled'} · ${accept ? 'accept' : 'reject'} · selection ${JSON.stringify(selection)} · record ${record} · ${events} changes · ${last} · rename ${revision}`}</Text>
		<Text>Source implementation; native pointer/keyboard, menu tracking, Tab/focus, VoiceOver, layout and teardown qualification is pending. Duplicate titles and the empty ID are intentional; duplicate IDs and missing controlled IDs show a message.</Text>
	</View>
}
