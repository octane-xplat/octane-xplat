/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext, useState } from 'octane'
import { Screen, useImperativeBottomSheet } from '@octane-xplat/ui'
import { UITableView, useImperativeModal } from '@octane-xplat/ui/ios'

const Name = createContext('missing')
const Provider: any = Name
const views = new Map<string, any>()
const list = { current: null as any }
let sheet: ReturnType<typeof useImperativeBottomSheet>
let modal: ReturnType<typeof useImperativeModal>
let updateName: (value: string) => void
let closeOwner: () => void
let replaceItems: () => void
const initial = Array.from({ length: 100 }, (_, id) => ({ id, text: 'row-' + id }))

function Value(props: { id: string; prefix?: string }) {
	const name = useContext(Name)
	return <label id={props.id} ref={(view: any) => { if (view) views.set(props.id, view); else views.delete(props.id) }} text={(props.prefix ?? '') + name} />
}

function Content(props: { params: { id: string }; close: (value?: unknown) => void }) {
	return <masonview display="grid" style={{ height: 100 }}><Value id={props.params.id} /></masonview>
}

const renderRow = (item: any) => <Value id={'owned-row-' + item.id} prefix={item.text + ': '} />

function Controls() {
	const [items, setItems] = useState(initial)
	sheet = useImperativeBottomSheet()
	modal = useImperativeModal()
	replaceItems = () => setItems(initial.map(item => ({ ...item, text: 'updated-' + item.id })))
	return <>
		<UITableView ref={list} items={items} renderItem={renderRow} style={{ height: 240 }} />
		{sheet.element}
		{modal.element}
	</>
}

export default function Case() {
	const [name, setName] = useState('Avery')
	const [open, setOpen] = useState(true)
	updateName = setName
	closeOwner = () => setOpen(false)
	return <Screen><Provider value="outside"><Provider value={name}>{open ? <Controls /> : null}</Provider></Provider></Screen>
}

export async function run(ctx: any) {
	await ctx.waitFor(() => views.has('owned-row-0'))
	ctx.assert('list cell inherits the nearest provider', views.get('owned-row-0').text, 'row-0: Avery')
	const firstModal = modal.open(Content, { id: 'owned-modal' }, { animated: false })
	await ctx.waitFor(() => views.has('owned-modal'))
	ctx.assert('imperative modal inherits its outlet context', views.get('owned-modal').text, 'Avery')
	updateName('Jordan')
	await ctx.waitFor(() => views.get('owned-modal')?.text === 'Jordan')
	ctx.assert('modal receives live provider updates', views.get('owned-modal').text, 'Jordan')
	firstModal.close('modal-result')
	ctx.assert('modal preserves its result handle', await firstModal, 'modal-result')
	await ctx.waitFor(() => !views.has('owned-modal'))
	const first = sheet.open(Content, { id: 'owned-sheet-first' }, { label: 'First', snapPoints: [0.4] })
	const second = sheet.open(Content, { id: 'owned-sheet-second' }, { label: 'Second', snapPoints: [0.5] })
	await ctx.waitFor(() => views.has('owned-sheet-first') && views.has('owned-sheet-second'))
	ctx.assert('first sheet inherits current context', views.get('owned-sheet-first').text, 'Jordan')
	ctx.assert('concurrent sheet inherits current context', views.get('owned-sheet-second').text, 'Jordan')
	first.close('first-result')
	ctx.assert('sheet close targets its own handle', await first, 'first-result')
	ctx.assert('closing one sheet keeps the other mounted', views.has('owned-sheet-second'), true)
	updateName('Riley')
	await ctx.waitFor(() => views.get('owned-sheet-second')?.text === 'Riley')
	ctx.assert('sheet receives live provider updates', views.get('owned-sheet-second').text, 'Riley')
	second.close('second-result')
	ctx.assert('second sheet preserves its result', await second, 'second-result')
	list.current.scrollToIndex(80, { animated: false })
	await ctx.waitFor(() => views.has('owned-row-80'))
	ctx.assert('scrolled list cell receives current context', views.get('owned-row-80').text, 'row-80: Riley')
	replaceItems()
	await ctx.waitFor(() => views.get('owned-row-80')?.text === 'updated-80: Riley')
	ctx.assert('list data replacement reaches source-owned cells', views.get('owned-row-80').text, 'updated-80: Riley')
	const owned = sheet.open(Content, { id: 'owner-removed-sheet' }, { label: 'Owner removal' })
	await ctx.waitFor(() => views.has('owner-removed-sheet'))
	closeOwner()
	await owned
	await ctx.waitFor(() => views.size === 0)
	ctx.assert('owner removal closes sheets and releases list cells', views.size, 0)
}
