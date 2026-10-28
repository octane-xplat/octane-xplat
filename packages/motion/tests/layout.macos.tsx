import { createMacOSRoot } from '../../macos-renderer/src/index'
import { motion, MotionConfig } from '../src/index'
import { NSWindow } from '@octane-xplat/platform/macos'
import { View } from '@octane-xplat/ui'

const views: Record<string, any> = {}
function App(props: { wide: boolean; reverse: boolean }) {
	return (
		<MotionConfig reducedMotion="never">
			<View style={{ width: 300, height: 200 }}>
				<motion.View
					layout
					ref={(v: any) => {
						views.parent = v
					}}
					transition={{ duration: 0.4, ease: 'linear' }}
					style={{ width: props.wide ? 200 : 100, height: 100 }}
				>
					{(props.reverse ? ['b', 'a'] : ['a', 'b']).map((id) => (
						<motion.View
							key={id}
							layout="position"
							ref={(v: any) => {
								views[id] = v
							}}
							transition={{ duration: 0.4, ease: 'linear' }}
							style={{ width: 50, height: 30 }}
						/>
					))}
				</motion.View>
			</View>
		</MotionConfig>
	)
}

export async function runLayout() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		NSMakeRect(0, 0, 300, 200),
		0,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const host = window.contentView
	host.wantsLayer = true
	const root = createMacOSRoot(host)
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const flush = async () => {
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}
	}
	const check = (value: boolean, label: string) => {
		if (!value) {
			throw new Error(label)
		}
	}
	const scale = (v: any) => Number(v.layer.valueForKeyPath('transform.scale.x'))
	const visual = (v: any) => v.layer.convertRectToLayer(v.layer.bounds, host.layer)
	try {
		root.render(App, { wide: false, reverse: false })
		await sleep(100)
		check(
			views.parent.bounds.size.width === 100,
			'initial width: ' + views.parent.bounds.size.width,
		)

		const parentBefore = visual(views.parent)
		const childBefore = visual(views.a)
		root.render(App, { wide: true, reverse: false })
		await flush()
		const first = views.parent.bounds.size.width * scale(views.parent)
		check(views.parent.bounds.size.width === 200, 'new layout measured')
		check(Math.abs(first - 100) < 0.5, 'inverse projection before the next frame: ' + first)
		check(
			Math.abs(visual(views.parent).origin.x - parentBefore.origin.x) < 0.5,
			'parent anchor compensation',
		)

		check(
			Math.abs(visual(views.a).origin.x - childBefore.origin.x) < 0.5,
			'nested anchor compensation',
		)

		await sleep(140)
		const mid = views.parent.bounds.size.width * scale(views.parent)
		const child = views.a.bounds.size.width * scale(views.a) * scale(views.parent)
		check(mid > 110 && mid < 190, 'intermediate parent width: ' + mid)
		check(Math.abs(child - 50) < 0.5, 'nested correction: ' + child)
		await sleep(400)
		check(scale(views.parent) === 1, 'restored parent transform')
		const before = views.a.frame.origin.y
		const beforeVisual = visual(views.a)
		root.render(App, { wide: true, reverse: true })
		await flush()
		check(views.a.frame.origin.y !== before, 'reordered layout')
		check(
			Math.abs(visual(views.a).origin.y - beforeVisual.origin.y) < 0.5,
			'reorder starts at the previous position',
		)

		check(
			Math.abs(Number(views.a.layer.valueForKeyPath('transform.translation.y'))) > 1,
			'reorder inverse transform',
		)

		await sleep(500)
		check(Number(views.a.layer.valueForKeyPath('transform.translation.y')) === 0, 'reorder settles')
		console.log('MOTION_LAYOUT_OK ' + JSON.stringify({ first, mid, child }))
	} finally {
		root.unmount()
		window.close()
	}
}
