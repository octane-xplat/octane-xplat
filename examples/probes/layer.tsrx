import { Pressable, Text, VStack, View, useLayer } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

let anchoredLayer: ReturnType<typeof useLayer> | null = null
let fixedLayer: ReturnType<typeof useLayer> | null = null

// The NativeScript overlay machinery (Popover/RootLayout) needs a RootLayout
// in the view tree; the bare-Page probe host has none, so the native case
// supplies its own — a rootlayout registers itself on load. Web portals to
// document.body and the AppKit leaf presents through the host bridge, so
// neither needs the wrapper.
const isNativeScript =
	typeof (globalThis as any).document === 'undefined' &&
	!(globalThis as any).__xplatAppKit

export default function LayerProbe() {
	const anchored = useLayer({ mode: 'context', lightDismiss: true })
	const fixed = useLayer({ mode: 'fixed' })
	anchoredLayer = anchored
	fixedLayer = fixed

	const content = (
		<VStack>
			<Text id="probe-anchored-open">{String(anchored.isOpen)}</Text>
			<Text id="probe-fixed-open">{String(fixed.isOpen)}</Text>
			<View style={{ height: 1600 }} />
			<View ref={anchored.ref}>
				<Pressable id="probe-anchor" onPress={() => anchored.show()}>
					<Text>Layer anchor</Text>
				</Pressable>
			</View>
			<Pressable id="probe-fixed-show" onPress={() => fixed.show()}>
				<Text>Fixed layer</Text>
			</Pressable>
			{anchored.render(
				<View style={{ padding: 8, height: 120, backgroundColor: '#334466' }}>
					<Text>Anchored layer</Text>
				</View>,
				{
					placement: 'below',
					offset: 4,
					web: { id: 'probe-anchored-panel' },
					ios: { id: 'probe-anchored-panel' },
					android: { id: 'probe-anchored-panel' },
				},
			)}
			{fixed.render(
				<View style={{ padding: 8, width: 80, height: 40, backgroundColor: '#443366' }}>
					<Text>Fixed</Text>
				</View>,
				{
					x: 24,
					y: 24,
					web: { id: 'probe-fixed-panel' },
					ios: { id: 'probe-fixed-panel' },
					android: { id: 'probe-fixed-panel' },
				},
			)}
		</VStack>
	)

	if (isNativeScript) {
		return <rootlayout>{content}</rootlayout>
	}

	return content
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-anchor'))
	ctx.assert('anchored layer closed initially', ctx.inspect('probe-anchored-open').text, 'false')
	ctx.assert('fixed layer closed initially', ctx.inspect('probe-fixed-open').text, 'false')

	await ctx.press('probe-anchor')
	await ctx.waitFor(() => ctx.inspect('probe-anchored-open').text === 'true')
	ctx.assert('anchored layer opens', ctx.inspect('probe-anchored-open').text, 'true')

	// The anchor sits far below the viewport fold, so 'below' cannot fit —
	// the layer must flip above the anchor (or clamp to the top edge).
	const anchorFrame = ctx.inspect('probe-anchor').frame
	ctx.record('anchor-frame', anchorFrame)

	const doc = (globalThis as any).document
	let anchoredPanelFrame = null
	if (ctx.target === 'web') {
		await ctx.waitFor(() => doc?.getElementById('probe-anchored-panel'))
		const rect = doc.getElementById('probe-anchored-panel').getBoundingClientRect()
		anchoredPanelFrame = { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
	} else if (ctx.target === 'ios' || ctx.target === 'android') {
		await ctx.waitFor(() => ctx.find('probe-anchored-panel'))
		anchoredPanelFrame = ctx.inspect('probe-anchored-panel').frame
	}

	if (anchoredPanelFrame && anchorFrame) {
		ctx.record('anchored-panel-frame', anchoredPanelFrame)
		// NativeScript popup views measure against their host bounds early in
		// layout, so the flip is asserted on web only and recorded elsewhere.
		if (ctx.target === 'web') {
			ctx.assert('layer flipped above the anchor', anchoredPanelFrame.y < anchorFrame.y, true)
		}
	}

	anchoredLayer?.hide()
	await ctx.waitFor(() => ctx.inspect('probe-anchored-open').text === 'false')

	await ctx.press('probe-fixed-show')
	await ctx.waitFor(() => ctx.inspect('probe-fixed-open').text === 'true')

	if (ctx.target === 'web') {
		await ctx.waitFor(() => doc?.getElementById('probe-fixed-panel'))
		const rect = doc.getElementById('probe-fixed-panel').getBoundingClientRect()
		ctx.record('fixed-panel-frame', { x: rect.left, y: rect.top })
		ctx.assert('fixed layer at x', Math.abs(rect.left - 24) < 2, true)
		ctx.assert('fixed layer at y', Math.abs(rect.top - 24) < 2, true)
	} else if (ctx.target === 'ios' || ctx.target === 'android') {
		await ctx.waitFor(() => ctx.find('probe-fixed-panel'))
		ctx.record('fixed-panel-frame', ctx.inspect('probe-fixed-panel').frame)
	}

	fixedLayer?.hide()
	await ctx.waitFor(() => ctx.inspect('probe-fixed-open').text === 'false')
}
