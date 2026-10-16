import { createContext, useContext, useState } from 'octane'
import { useImperativeBottomSheet } from '@octane-xplat/ui'

const Name = createContext('missing')
let sheet: ReturnType<typeof useImperativeBottomSheet>
let updateName: (name: string) => void
let closeOwner: () => void

function Content(props: { params: { id: string } }) {
	return <p id={props.params.id}>{useContext(Name)}</p>
}

function Controls() {
	sheet = useImperativeBottomSheet()
	return <>{sheet.element}</>
}

export default function Case() {
	const [name, setName] = useState('Avery')
	const [open, setOpen] = useState(true)
	updateName = setName
	closeOwner = () => setOpen(false)
	return <><span id="owner-state">{open ? 'open' : 'closed'}</span><Name value="outside"><Name value={name}>{open ? <Controls /> : null}</Name></Name></>
}

export async function run(ctx: any) {
	const find = (id: string) => document.getElementById(id)
	const canceled = sheet.open(Content, { id: 'canceled-sheet' }, { label: 'Canceled' })
	canceled.close('canceled')
	ctx.assert('close before portal commit settles its handle', await canceled, 'canceled')
	ctx.assert('canceled content never mounts', find('canceled-sheet') == null, true)
	const first = sheet.open(Content, { id: 'owned-sheet-first' }, { label: 'First' })
	const second = sheet.open(Content, { id: 'owned-sheet-second' }, { label: 'Second' })
	await ctx.waitFor(() => find('owned-sheet-first') && find('owned-sheet-second'))
	ctx.assert('first sheet inherits the nearest provider', find('owned-sheet-first').textContent, 'Avery')
	ctx.assert('second sheet inherits the nearest provider', find('owned-sheet-second').textContent, 'Avery')
	first.close('first-result')
	ctx.assert('close handle targets its own sheet', await first, 'first-result')
	await ctx.waitFor(() => !find('owned-sheet-first'))
	ctx.assert('other sheet remains mounted', find('owned-sheet-second') != null, true)
	updateName('Jordan')
	await ctx.waitFor(() => find('owned-sheet-second')?.textContent === 'Jordan')
	ctx.assert('provider changes reach sheet content', find('owned-sheet-second').textContent, 'Jordan')
	closeOwner()
	await second
	await ctx.waitFor(() => !find('owned-sheet-second'))
	ctx.assert('owner removal releases the sheet', find('owned-sheet-second') == null, true)
	let rejected = false
	try { await sheet.open(Content, { id: 'late-sheet' }) } catch { rejected = true }
	ctx.assert('removed owners reject late opens', rejected, true)
	ctx.assert('late opens create no content', find('late-sheet') == null, true)
}
