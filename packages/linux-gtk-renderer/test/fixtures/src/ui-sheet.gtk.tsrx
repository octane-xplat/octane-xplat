/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	Button,
	Text,
	View,
	BottomSheet,
	BottomSheetSwitcher,
	openBottomSheet,
	closeBottomSheet,
	useImperativeBottomSheet,
	DropdownMenu,
	MoreMenu,
} from '@octane-xplat/ui'

function ImpSheetContent(props: { params?: any; close?: (result?: unknown) => void }) @{
	<View style={{ flexDirection: 'column' }}>
		<Text>{'imp-sheet-' + String(props.params?.tag ?? '')}</Text>
		<Button id="imp-close" label="ImpClose" clickAction={() => props.close?.('imp-result')} />
	</View>
}

function ImperativeProbe(props: { onResult?: (value: string) => void }) @{
	const sheet = useImperativeBottomSheet()

	<View style={{ flexDirection: 'column' }}>
		<Button
			id="uib-open"
			label="UibOpen"
			clickAction={() => {
				const handle = sheet.open(ImpSheetContent, { tag: 'uib' })
				handle.then((result) => props.onResult?.(String(result)))
			}}
		/>
		{sheet.element}
	</View>
}

const SNAP_POINTS = [0.25, 0.5, 0.9]

export function SheetProbe() @{
	const [ctlOpen, setCtlOpen] = useState(false)
	const [snapOpen, setSnapOpen] = useState(false)
	const [reqOpen, setReqOpen] = useState(false)
	const [formOpen, setFormOpen] = useState(false)
	const [noScrimOpen, setNoScrimOpen] = useState(false)
	const [unctlMounted, setUnctlMounted] = useState(false)
	const [heightOpen, setHeightOpen] = useState(false)
	const [heightMode, setHeightMode] = useState<any>('hug')
	const [swActive, setSwActive] = useState<string | null>(null)
	const [mark, setMark] = useState('none')
	const [bgCount, setBgCount] = useState(0)

	<View style={{ flexDirection: 'column' }}>
		<Button id="bg-btn" label="Bg" clickAction={() => setBgCount(bgCount + 1)} />
		<Text id="picked">{mark}</Text>
		<Text id="bg-count">{String(bgCount)}</Text>
		<Button id="ctl-open" label="CtlOpen" clickAction={() => setCtlOpen(true)} />
		<Button id="snap-open" label="SnapOpen" clickAction={() => setSnapOpen(true)} />
		<Button id="req-open" label="ReqOpen" clickAction={() => setReqOpen(true)} />
		<Button id="form-open" label="FormOpen" clickAction={() => setFormOpen(true)} />
		<Button id="noscrim-open" label="NoScrim" clickAction={() => setNoScrimOpen(true)} />
		<Button id="unctl-mount" label="Unctl" clickAction={() => setUnctlMounted(true)} />
		<Button id="h-hug" label="HHug" clickAction={() => { setHeightMode('hug'); setHeightOpen(true) }} />
		<Button id="h-capped" label="HCapped" clickAction={() => { setHeightMode('capped'); setHeightOpen(true) }} />
		<Button id="h-tall" label="HTall" clickAction={() => { setHeightMode('tall'); setHeightOpen(true) }} />
		<Button id="h-num" label="HNum" clickAction={() => { setHeightMode(300); setHeightOpen(true) }} />
		<Button id="h-pct" label="HPct" clickAction={() => { setHeightMode('50%'); setHeightOpen(true) }} />
		<Button id="sw-a" label="SwA" clickAction={() => setSwActive('a')} />
		<Button id="sw-b" label="SwB" clickAction={() => setSwActive('b')} />
		<Button
			id="imp-open"
			label="ImpOpen"
			clickAction={() => {
				const handle = openBottomSheet(ImpSheetContent, { tag: 'svc' })
				handle.then((result) => setMark('imp:' + String(result)))
			}}
		/>
		<Button
			id="imp-open2"
			label="ImpOpen2"
			clickAction={() => {
				const handle = openBottomSheet(ImpSheetContent, { tag: 'svc2' })
				handle.then((result) => setMark('imp2:' + String(result)))
			}}
		/>
		<Button
			id="svc-latest"
			label="SvcLatest"
			clickAction={() => closeBottomSheet('svc2-result')}
		/>
		<ImperativeProbe onResult={(v) => setMark('uib:' + v)} />

		<BottomSheet
			id="ctl-sheet"
			isOpen={ctlOpen}
			onOpenChange={(next) => {
				setCtlOpen(next)
				if (!next) { setMark('ctl:closed') }
			}}
			label="Controlled sheet"
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>ctl-body</Text>
			</View>
		</BottomSheet>

		<BottomSheet
			id="snap-sheet"
			isOpen={snapOpen}
			onOpenChange={(next) => {
				setSnapOpen(next)
				if (!next) { setMark('snap:closed') }
			}}
			label="Snap sheet"
			snapPoints={SNAP_POINTS}
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>snap-body</Text>
			</View>
		</BottomSheet>

		<BottomSheet
			id="req-sheet"
			isOpen={reqOpen}
			onOpenChange={setReqOpen}
			label="Required sheet"
			purpose="required"
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>req-body</Text>
				<Button id="req-close" label="ReqClose" clickAction={() => setReqOpen(false)} />
			</View>
		</BottomSheet>

		<BottomSheet
			id="form-sheet"
			isOpen={formOpen}
			onOpenChange={setFormOpen}
			label="Form sheet"
			purpose="form"
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>form-body</Text>
			</View>
		</BottomSheet>

		<BottomSheet
			id="noscrim-sheet"
			isOpen={noScrimOpen}
			onOpenChange={setNoScrimOpen}
			label="No scrim sheet"
			hasScrim={false}
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>noscrim-body</Text>
				<Button id="noscrim-close" label="NoScrimClose" clickAction={() => setNoScrimOpen(false)} />
			</View>
		</BottomSheet>

		<BottomSheet
			id="h-sheet"
			isOpen={heightOpen}
			onOpenChange={setHeightOpen}
			label="Height sheet"
			height={heightMode}
		>
			<View style={{ flexDirection: 'column' }}>
				<Text>height-body</Text>
			</View>
		</BottomSheet>

		{unctlMounted ? (
			<BottomSheet id="unctl-sheet" defaultOpen={true} label="Uncontrolled sheet">
				<View style={{ flexDirection: 'column' }}>
					<Text>unctl-body</Text>
				</View>
			</BottomSheet>
		) : null}

		<BottomSheetSwitcher activeSheet={swActive} onActiveSheetChange={setSwActive}>
			<BottomSheet sheetId="a" label="Sheet A">
				<View style={{ flexDirection: 'column' }}>
					<Text>sw-content-a</Text>
					<Button id="sw-goto-b" label="GotoB" clickAction={() => setSwActive('b')} />
				</View>
			</BottomSheet>
			<BottomSheet sheetId="b" label="Sheet B">
				<View style={{ flexDirection: 'column' }}>
					<Text>sw-content-b</Text>
					<Button id="sw-goto-close" label="SwClose" clickAction={() => setSwActive(null)} />
				</View>
			</BottomSheet>
		</BottomSheetSwitcher>

		<DropdownMenu
			id="dm-sheet"
			label="Sheet menu"
			presentation="bottom-sheet"
			items={[
				{ type: 'action', key: 'dm-one', label: 'SheetActionOne', onSelect: () => setMark('dm:one') },
			]}
		/>
		<MoreMenu
			id="mm-sheet"
			label="More sheet"
			presentation="bottom-sheet"
			items={[{ type: 'action', key: 'mm-one', label: 'MoreActionOne', onSelect: () => setMark('mm:one') }]}
		/>
		<MoreMenu
			id="mm-adaptive"
			label="More adaptive"
			presentation="adaptive"
			items={[{ type: 'action', key: 'mm-ad', label: 'AdaptiveOne', onSelect: () => setMark('mm:ad') }]}
		/>
	</View>
}
