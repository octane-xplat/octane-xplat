/** @jsxImportSource @octane-xplat/macos-renderer */
import { createContext, useContext, useEffect, useRef, useState } from 'octane'
import { createPortal } from 'octane/universal/native'

const PortalValue = createContext('Default')
const PortalValueProvider: any = PortalValue
let updateValue: (value: string) => void
let closePortal: () => void

function PortalContent() {
	return <label id="portal-content" text={useContext(PortalValue)} />
}

export default function Case() {
	const [value, setValue] = useState('Avery')
	const [open, setOpen] = useState(true)
	const targetRef = useRef<any>(null)
	const [target, setTarget] = useState<any>(null)
	updateValue = setValue
	closePortal = () => setOpen(false)

	useEffect(() => {
		setTarget(targetRef.current)
	}, [])

	return (
		<PortalValueProvider value={value}>
			<rootlayout id="portal-target" ref={targetRef} style={{ width: 260, height: 120 }}>
				<label id="target-owned" text="Target-owned child" />
			</rootlayout>
			{open && target ? createPortal(<PortalContent />, target) : null}
		</PortalValueProvider>
	)
}

export async function run(ctx: any) {
	await ctx.waitFor(() => ctx.find('portal-content'))
	const target = ctx.find('portal-target')
	const content = ctx.find('portal-content')
	const targetOwned = ctx.find('target-owned')
	ctx.assert('portal child is attached to the NSView target', content.superview === target, true)
	ctx.assert('portal child reads the declaring provider', String(content.stringValue), 'Avery')

	updateValue('Jordan')
	await ctx.waitFor(() => String(content.stringValue) === 'Jordan')
	ctx.assert('provider updates reach portal content', String(content.stringValue), 'Jordan')

	closePortal()
	await ctx.waitFor(() => !ctx.find('portal-content'))
	ctx.assert('portal cleanup detaches its native child', content.superview == null, true)
	ctx.assert('portal cleanup preserves the target-owned child', targetOwned.superview === target, true)
	ctx.record('portal lifecycle', 'same-root context, updates, and native target cleanup')
}
