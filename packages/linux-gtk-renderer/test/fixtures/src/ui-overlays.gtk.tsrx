/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	AlertDialog,
	Button,
	Dialog,
	DialogHeader,
	FocusScope,
	LayerProvider,
	Overlay,
	Text,
	useImperativeAlertDialog,
	useImperativeDialog,
	useLayerContext,
} from '@octane-xplat/ui'

export function OverlaysProbe() @{
	const [mark, setMark] = useState('none')
	const [bgClicks, setBgClicks] = useState(0)
	const [ctlOpen, setCtlOpen] = useState(false)
	const [ovOpen, setOvOpen] = useState(false)
	<>
		<Button id="bg" label="Background" clickAction={() => setBgClicks(bgClicks + 1)} />
		<Text id="bg-count">{String(bgClicks)}</Text>

		<Button id="ctl-toggle" label="Toggle ctl" clickAction={() => setCtlOpen(!ctlOpen)} />
		<Dialog id="ctl" isOpen={ctlOpen} onOpenChange={(o) => setCtlOpen(o)}>
			<DialogHeader title="Controlled" />
			<Text id="ctl-body">Controlled dialog</Text>
		</Dialog>

		<Dialog id="unctl" defaultOpen={true}>
			<DialogHeader title="Uncontrolled" />
			<Text id="unctl-body">Uncontrolled dialog</Text>
		</Dialog>

		<Button id="ov-trigger" label="Overlay" clickAction={() => setOvOpen(true)} />
		<Overlay testID="ov" shadeCover open={ovOpen} onDismiss={() => setOvOpen(false)}>
			<Text id="ov-body">Shaded overlay</Text>
		</Overlay>

		<Button id="alert-trigger" label="Alert" clickAction={() => setMark('alert')} />
		<AlertDialog
			id="alert"
			isOpen={mark === 'alert'}
			title="Alert title"
			description="Proceed with the action?"
			actionLabel="Confirm"
			cancelLabel="Cancel"
			onOpenChange={(o) => { if (!o) { setMark('') } }}
			onAction={() => setMark('action:ok')}
		/>

		<ImperativeProbe onResult={(v) => setMark(v)} />
		<LayerProvider>
			<LayerContextProbe />
		</LayerProvider>
		<FocusScope id="fs" autoFocus={false}>
			<Button id="fs-btn" label="Scoped" />
		</FocusScope>
		<Text id="picked">{mark}</Text>
	</>
}

function ImperativeProbe(props: { onResult: (v: string) => void }) @{
	const dialog = useImperativeDialog()
	const alert = useImperativeAlertDialog()
	<>
		<Button
			id="imp-trigger"
			label="Imperative"
			clickAction={() => {
				dialog.show(<Text id="imp-body">Imperative dialog</Text>)
				props.onResult('imp:shown')
			}}
		/>
		<Button
			id="ia-trigger"
			label="ImpAlert"
			clickAction={() => {
				alert.show({
					title: 'Imperative alert',
					actionLabel: 'Go',
					onAction: () => props.onResult('ia:ok'),
				})
			}}
		/>
		{dialog.element}
		{alert.element}
	</>
}

function LayerContextProbe() @{
	const ctx = useLayerContext()
	<Text id="ctx-value">{'ctx:' + (ctx ? 'set' : 'null')}</Text>
}
