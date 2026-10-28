/** @jsxImportSource @octane-xplat/jsx */
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

const SheetContext = createContext('missing')
const SheetProvider: any = SheetContext
const rendered: string[] = []
let mounted = false
let updateName: (value: string) => void
let setSheetOpen: (open: boolean) => void

function ContextLabel() {
	const value = useContext(SheetContext)
	rendered.push(value)
	useEffect(() => {
		mounted = true
		return () => {
			mounted = false
		}
	}, [])

	return <label id="appkit-sheet-context" text={value} />
}

export default function AppKitSheetPortal() {
	const [name, setName] = useState('Avery')
	const [open, setOpen] = useState(true)
	updateName = setName
	setSheetOpen = setOpen

	return (
		<SheetProvider value={name}>
			<AppKitSheet id="appkit-sheet-anchor" open={open} content={() => <ContextLabel />} />
		</SheetProvider>
	)
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => mounted && rendered.at(-1) === 'Avery', { timeout: 8000, interval: 25 })
	ctx.assert('AppKit sheet reads declaring context', rendered.at(-1), 'Avery')

	const beforeUpdate = rendered.length
	updateName('Jordan')
	await ctx.waitFor(() => rendered.length > beforeUpdate && rendered.at(-1) === 'Jordan', {
		timeout: 5000,
		interval: 25,
	})

	ctx.assert('live context update reaches AppKit sheet', rendered.at(-1), 'Jordan')

	setSheetOpen(false)
	await ctx.waitFor(() => !mounted, { timeout: 5000, interval: 25 })
	ctx.assert('closing the sheet detaches its portal subtree', mounted, false)
	setSheetOpen(true)
	await ctx.waitFor(() => mounted && rendered.at(-1) === 'Jordan', { timeout: 8000, interval: 25 })
	ctx.assert('reopened AppKit sheet retains updated context', rendered.at(-1), 'Jordan')

	setSheetOpen(false)
	await ctx.waitFor(() => !mounted, { timeout: 5000, interval: 25 })
	ctx.record('portal boundary evidence', 'AppKitSheet context, live update, detach, and reopen')
}
