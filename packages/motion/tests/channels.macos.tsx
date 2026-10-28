import { createMacOSRoot } from '../../macos-renderer/src/index'
import { motion, MotionConfig } from '../src/index'
import { attachHost } from '../src/host.macos'
import { NSView } from '@octane-xplat/platform/macos'

let view: any
let snapshot: any
let complete = 0
function App(props: any) {
	const Host = props.Host
	return (
		<MotionConfig reducedMotion="never">
			<Host
				ref={(value: any) => {
					view = value
				}}
				initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 }}
				animate={props.target}
				transition={{ duration: 0.4, ease: 'linear' }}
				onUpdate={(value: any) => {
					snapshot = value
				}}
				onAnimationComplete={() => {
					complete++
				}}
				style={{ width: 100, height: 100 }}
			/>
		</MotionConfig>
	)
}

// Actual AppKit properties only: no window, desktop input or preference writes.
export async function runChannels() {
	const nativeHost = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 200))
	let root = createMacOSRoot(nativeHost)
	let assertions = 0
	const check = (condition: boolean, message: string) => {
		assertions++
		if (!condition) {
			throw new Error(message)
		}
	}

	const close = (actual: number, expected: number, message: string) =>
		check(
			Math.abs(Number(actual) - expected) < 0.0001,
			message + ': ' + actual + ' expected ' + expected,
		)

	const native = (path: string) => Number(view.layer.valueForKeyPath(path))
	const verify = () => {
		close(view.alphaValue, snapshot.opacity, 'alphaValue')
		close(native('transform.translation.x'), snapshot.x, 'x')
		close(native('transform.translation.y'), -snapshot.y, 'y-down')
		close(native('transform.rotation.z'), (snapshot.rotate * Math.PI) / 180, 'degrees to radians')
		close(native('transform.scale.x'), snapshot.scale * snapshot.scaleX, 'scaleX composition')
		close(native('transform.scale.y'), snapshot.scale * snapshot.scaleY, 'scaleY composition')
	}

	const waitUntil = async (condition: () => boolean, message: string) => {
		const deadline = Date.now() + 4000
		while (!condition() && Date.now() < deadline) {
			await new Promise((resolve) => setTimeout(resolve, 10))
		}

		check(condition(), message)
	}

	try {
		for (const Host of [motion.View, motion.Row, motion.Pressable]) {
			root = createMacOSRoot(nativeHost)
			const before = complete
			root.render(App, {
				Host,
				target: { opacity: 0.25, x: 100, y: 40, rotate: 30, scale: 1.2, scaleX: 1.5, scaleY: 0.75 },
			})

			await waitUntil(() => view && snapshot.x > 0 && snapshot.x < 100, 'intermediate sample')
			verify()
			root.render(App, {
				Host,
				target: { opacity: 0.5, x: 50, y: 20, rotate: 15, scale: 1.1, scaleX: 2, scaleY: 0.5 },
			})

			await waitUntil(() => complete === before + 1, 'retarget completion')
			verify()
			close(view.alphaValue, 0.5, 'final native alpha')
			close(native('transform.translation.x'), 50, 'final native translation')
			console.log(
				'MOTION_CHANNEL_SAMPLE ' +
					JSON.stringify({
						alpha: view.alphaValue,
						x: native('transform.translation.x'),
						y: native('transform.translation.y'),
						rotation: native('transform.rotation.z'),
						scaleX: native('transform.scale.x'),
						scaleY: native('transform.scale.y'),
					}),
			)

			root.unmount()
			check(view === null, 'ref cleared')
			check(nativeHost.subviews.count === 0, 'host removed')
		}

		// The same adapter restores native baseline values on detach/replacement.
		const plain = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 100, 100))
		plain.alphaValue = 0.8
		const adapter = attachHost(plain)
		adapter.write({ opacity: 0.4, x: 10, y: 20, rotate: 15, scale: 1.1 })
		adapter.restore()
		close(plain.alphaValue, 0.8, 'restore alpha')
		close(plain.layer.valueForKeyPath('transform.translation.x'), 0, 'restore translation')
		close(plain.layer.valueForKeyPath('transform.rotation.z'), 0, 'restore rotation')
		close(plain.layer.valueForKeyPath('transform.scale.x'), 1, 'restore scale')
		console.log(
			'MOTION_CHANNELS_OK ' +
				assertions +
				' assertions; View/Row/Pressable intermediate and retargeted native channels, restore',
		)
	} catch (error) {
		console.error('MOTION_CHANNELS_FAIL ' + (error as Error).message)
	} finally {
		root.unmount()
	}
}
