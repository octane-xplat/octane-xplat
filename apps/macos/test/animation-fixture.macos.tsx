/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { useAnimation, View } from '@octane-xplat/ui'

let x, opacity
function Content({ revision: _revision = 0 }) {
	x = useAnimation(0)
	opacity = useAnimation(0, 'opacity')
	return (
		<View id="animated" ref={x.ref}>
			<View id="fade" ref={opacity.ref} />
		</View>
	)
}

export function runAnimationFixture() {
	const nativeHost = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 300, height: 200 },
	})

	const root = createMacOSRoot(nativeHost)
	let previous
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
	const check = (condition, message) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	root.render(Content, { revision: 0 })

	;(async () => {
		try {
			await wait(50)
			const view = root.__macosDebug.findId('animated')
			const fade = root.__macosDebug.findId('fade')
			previous = x
			const reduced = Boolean(NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceMotion)
			x.to(100, { duration: 300 })
			opacity.to(1, { duration: 300 })
			check(opacity.value === 0, 'Tween committed immediately')
			await wait(100)
			check(opacity.value > 0 && opacity.value < 1, 'No intermediate fade sample')
			check(
				Math.abs(Number(fade.alphaValue) - opacity.value) < 0.001,
				'Opacity did not reach NSView',
			)

			if (!reduced) {
				check(x.value > 0 && x.value < 100, 'No intermediate translation sample')
			}
			root.render(Content, { revision: 1 })
			await wait(40)
			check(x === previous, 'Controller changed across renders')
			x.stop()
			const stopped = x.value
			await wait(100)
			check(x.value === stopped, 'stop did not freeze')
			x.spring(-40)
			await wait(120)
			if (!reduced) {
				check(x.value !== -40 && x.value !== stopped, 'Spring did not sample')
			}
			await wait(2200)
			check(x.value === -40, 'Spring did not settle exactly')
			check(
				Math.abs(Number(view.layer.valueForKeyPath('transform.translation.x')) + 40) < 0.001,
				'Translation missed layer',
			)

			check(opacity.value === 1, 'Fade did not settle')
			x.to(400, { duration: 2000 })
			await wait(50)
			root.unmount()
			const disposed = x.value
			await wait(100)
			x.to(900, { duration: 0 })
			x.spring(900)
			await wait(100)
			check(x.value === disposed, 'Disposed controller still animates')
			console.log(
				'ANIMATION_FIXTURE_OK: timed fade, spring translation, retarget, stable hook, stop and disposal; system reduced motion=' +
					reduced,
			)
		} catch (error) {
			console.error('ANIMATION_FIXTURE_FAIL: ' + error.message)
		} finally {
			root.unmount()
			globalThis.__xplatStopHost()
		}
	})()
}
