/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useState } from 'octane'
import { BottomSheet, Dialog, Lightbox, Screen, useImperativeBottomSheet } from '@octane-xplat/ui'

const Name = createContext('missing')
const Provider: any = Name
const views = new Map<string, any>()
let sheet: ReturnType<typeof useImperativeBottomSheet>
let updateName: (value: string) => void
let closeOwner: () => void
let setDialog: (open: boolean) => void
let setLightbox: (open: boolean) => void
const captions = new Map<string, string>()
let setSheet: (open: boolean) => void

function Value(props: { id: string }) {
	return (
		<label
			id={props.id}
			ref={(view: any) => {
				if (view) {
					views.set(props.id, view)
				} else {
					views.delete(props.id)
				}
			}}
			text={useContext(Name)}
		/>
	)
}

function Content(props: { params: { id: string } }) {
	return <Value id={props.params.id} />
}

function Caption() {
	const name = useContext(Name)
	captions.set('lightbox', name)
	return name
}

function Controls() {
	sheet = useImperativeBottomSheet()
	const [dialogOpen, updateDialog] = useState(false)
	const [sheetOpen, updateSheet] = useState(false)
	setDialog = updateDialog
	setSheet = updateSheet
	const [lightboxOpen, updateLightbox] = useState(false)
	setLightbox = updateLightbox
	return (
		<>
			{sheet.element}
			<Lightbox
				id="owned-lightbox"
				isOpen={lightboxOpen}
				onOpenChange={updateLightbox}
				media={[{ type: 'video', src: '', alt: 'Test media', caption: <Caption /> }]}
			/>
			<Dialog isOpen={dialogOpen} onOpenChange={updateDialog} accessibilityLabel="Portal dialog">
				<Value id="owned-dialog" />
			</Dialog>
			<BottomSheet isOpen={sheetOpen} onOpenChange={updateSheet} label="Portal sheet">
				<Value id="owned-declarative-sheet" />
			</BottomSheet>
		</>
	)
}

export default function Case() {
	const [name, setName] = useState('Avery')
	const [open, setOpen] = useState(true)
	updateName = setName
	closeOwner = () => setOpen(false)
	return (
		<Screen>
			<Provider value="outside">
				<Provider value={name}>{open ? <Controls /> : null}</Provider>
			</Provider>
		</Screen>
	)
}

export async function run(ctx: any) {
	const value = (id: string) => String(views.get(id)?.stringValue)
	const first = sheet.open(Content, { id: 'owned-first' })
	const second = sheet.open(Content, { id: 'owned-second' })
	await ctx.waitFor(() => views.has('owned-first') && views.has('owned-second'))
	ctx.assert('AppKit sheet inherits nearest provider', value('owned-first'), 'Avery')
	first.close('first-result')
	ctx.assert('independent AppKit sheet handle preserves result', await first, 'first-result')
	await ctx.waitFor(() => !views.has('owned-first'))
	ctx.assert('closing first sheet preserves second', views.has('owned-second'), true)
	updateName('Jordan')
	await ctx.waitFor(() => value('owned-second') === 'Jordan')
	ctx.assert('AppKit sheet receives live context', value('owned-second'), 'Jordan')
	second.close('second-result')
	ctx.assert('second sheet preserves result', await second, 'second-result')
	await ctx.waitFor(() => !views.has('owned-second'))
	setDialog(true)
	await ctx.waitFor(() => views.has('owned-dialog'))
	ctx.assert('declarative AppKit dialog inherits context', value('owned-dialog'), 'Jordan')
	updateName('Riley')
	await ctx.waitFor(() => value('owned-dialog') === 'Riley')
	ctx.assert('dialog receives live context', value('owned-dialog'), 'Riley')
	setDialog(false)
	await ctx.waitFor(() => !views.has('owned-dialog'))
	setLightbox(true)
	await ctx.waitFor(() => captions.has('lightbox'))
	ctx.assert('AppKit lightbox caption inherits context', captions.get('lightbox'), 'Riley')
	updateName('Morgan')
	await ctx.waitFor(() => captions.get('lightbox') === 'Morgan')
	ctx.assert('lightbox caption receives live context', captions.get('lightbox'), 'Morgan')
	setLightbox(false)
	await ctx.waitFor(() => !ctx.find('owned-lightbox'))
	setSheet(true)
	await ctx.waitFor(() => views.has('owned-declarative-sheet'))
	ctx.assert(
		'declarative AppKit sheet inherits context',
		value('owned-declarative-sheet'),
		'Morgan',
	)

	const final = sheet.open(Content, { id: 'owned-final' })
	await ctx.waitFor(() => views.has('owned-final'))
	closeOwner()
	await final
	await ctx.waitFor(() => views.size === 0)
	ctx.assert('owner removal releases every AppKit surface', views.size, 0)
	let rejected = false
	try {
		await sheet.open(Content, { id: 'late' })
	} catch {
		rejected = true
	}

	ctx.assert('removed AppKit owner rejects late opens', rejected, true)
}
