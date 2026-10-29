/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'octane'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { NSView } from '@octane-xplat/platform/macos'
import type { WindowLayer } from '../../packages/macos-renderer/src/layer'
import { appKitHost } from '../../packages/ui/src/internal/platform/host-bridge'
import { createPortal } from '../../packages/ui/src/internal/platform/native-portal'
import type { ProbeContext } from '../../scripts/probe/context'
const LabelContext = createContext('missing source provider')
const LabelProvider: any = LabelContext
interface Lease { handle: WindowLayer | null; target: NSView | null; live: boolean; committed: boolean; waiters: Array<() => void> }
function PortalBody(props: { committed(): void }) {
	const label = useContext(LabelContext)
	useLayoutEffect(() => props.committed(), [label, props.committed])
	return <masonview style={{ display: 'flex', width: 240, height: 72 }}><label text={`Portal context: ${label}`} /></masonview>
}
export default function WindowLayerPortalProbe() {
	const anchor = useRef<NSView | null>(null), owner = useRef<Lease | null>(null), active = useRef(true)
	const [portal, setPortal] = useState<Lease | null>(null), [label, setLabel] = useState('source one'), [status, setStatus] = useState('closed')
	const close = () => {
		const lease = owner.current; owner.current = null
		if (lease) { lease.live = false; lease.waiters = []; lease.handle?.close() }
		if (active.current) { setPortal(null); setStatus('closed') }
	}
	useEffect(() => () => { active.current = false; close() }, [])
	const stage = () => {
		close()
		const lease: Lease = { handle: null, target: null, live: true, committed: false, waiters: [] }; owner.current = lease
		lease.handle = appKitHost()?.showLayer?.({ anchor: anchor.current, deferPresentation: true, lightDismiss: true, excludeAnchorFromDismiss: true,
			position: (bounds: { left: number; top: number; height: number }) => ({ left: bounds.left, top: bounds.top + bounds.height + 8 }),
			createContentRoot: (target: NSView) => {
				lease.target = target; setPortal(lease)
				return { render() {}, whenCommitted(callback: () => void) { if (lease.committed) callback(); else lease.waiters.push(callback) },
					unmount() {
						lease.live = false; lease.waiters = []; const current = owner.current === lease
						if (current) owner.current = null
						if (active.current) { setPortal((value) => value === lease ? null : value); if (current) setStatus('closed') }
					},
				}
			},
			onClose: () => { if (owner.current === lease) close() },
		}) ?? null
		if (!lease.handle) { owner.current = null; lease.live = false; setPortal(null); setStatus('host layer unavailable') }
		else setStatus('staged; reveal explicitly')
	}
	const committed = (lease: Lease) => {
		if (!lease.live || owner.current !== lease) return
		lease.committed = true
		for (const ready of lease.waiters.splice(0)) ready()
		lease.handle?.update({})
	}
	return <VStack gap={2}>
		<Text>Stage a hidden source-owned layer, then reveal it. Change the provider and check that the panel follows it. Anchor clicks should stay inside the compound boundary; outside clicks request close. Check focus, clipping, resize/scroll, window changes and teardown only after authorization. No native behavior is qualified by this fixture.</Text>
		<TextInput label="Keep keyboard focus here" />
		<masonview id="window-layer-portal-anchor" ref={anchor} style={{ display: 'flex', width: 240, height: 40 }}><label text="Layer anchor" /></masonview>
		<Button label="Stage hidden" clickAction={stage} /><Button label="Reveal" clickAction={() => { const layer = owner.current?.handle; if (layer && !layer.closed) { layer.show(); setStatus('reveal requested') } }} />
		<Button label="Change source provider" clickAction={() => setLabel(label === 'source one' ? 'source two with more text' : 'source one')} /><Button label="Close" clickAction={close} />
		<Text>Status: {status}</Text>
		<LabelProvider value={label}>{portal?.target ? createPortal(<PortalBody committed={() => committed(portal)} />, portal.target) : null}</LabelProvider>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('window-layer-portal-anchor'))
	ctx.record('qualification', 'anchor mounted only; source portal/native staging/focus/geometry/dismissal/AX and packaging remain unqualified')
}
