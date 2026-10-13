import { createMacOSRoot } from '../../macos-renderer/src/index'
import { RollingText } from '@octane-xplat/rolling-text'
import { observeReducedMotion, readReducedMotion } from '../src/reduced-motion.macos'

function App(props: any) {
	return (
		<flexboxlayout flexDirection="column">
			<RollingText {...props} />
		</flexboxlayout>
	)
}

// Opt-in human gate. This fixture only READS the OS setting and notifications.
// It never opens Settings, posts notifications, or writes preferences.
export async function runHumanReducedMotion() {
	const baseline = readReducedMotion()
	const host = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 400, 100))
	const root = createMacOSRoot(host)
	const events: boolean[] = []
	const off = observeReducedMotion(() => events.push(readReducedMotion()))
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const children = (view: any): any[] => {
		const result = []
		for (let index = 0; index < view.subviews.count; index++) {
			result.push(view.subviews.objectAtIndex(index))
		}

		return result
	}

	const row = () => children(children(host)[0])[0]
	const cells = () => children(row())
	const text = () =>
		cells()
			.map((cell) => String(children(cell)[0].stringValue))
			.join('')

	const settled = () =>
		cells().every(
			(cell) =>
				Number(cell.alphaValue) === 1 &&
				Number(cell.layer.valueForKeyPath('transform.translation.y')) === 0,
		)

	const check = (condition: boolean, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const render = (value: string) => {
		root.render(App, {
			value,
			reducedMotion: 'user',
			updatePolicy: 'latest',
			rollBy: 'word',
			transition: { duration: 600 },
			style: { height: 24 },
		})

		host.layoutSubtreeIfNeeded()
	}

	const until = async (condition: () => boolean, message: string, timeout = 120000) => {
		const deadline = Date.now() + timeout
		while (!condition() && Date.now() < deadline) {
			await wait(20)
		}

		check(condition(), message)
	}

	const transition = async (value: boolean) => {
		const start = events.length
		console.log('ROLLING_TEXT_HUMAN_TOGGLE ' + JSON.stringify({ reduceMotion: value, baseline }))
		await until(
			() => readReducedMotion() === value && events.slice(start).includes(value),
			'genuine OS notification required',
		)

		await wait(50)
		console.log(
			'ROLLING_TEXT_HUMAN_OS ' + JSON.stringify({ reduceMotion: value, events: events.length }),
		)
	}

	try {
		console.log('ROLLING_TEXT_HUMAN_BASELINE ' + JSON.stringify({ reduceMotion: baseline }))
		render('baseline')
		await wait(20)
		check(text() === 'baseline' && settled(), 'initial value must be settled')
		if (baseline) {
			await transition(false)
		}

		render('running')
		await wait(50)
		render('latest')
		await wait(20)
		check(String(row().accessibilityLabel()) === 'latest', 'latest accessible name')
		check(
			text() !== 'latest' && !settled(),
			'latest destination must be queued during real playback',
		)

		console.log('ROLLING_TEXT_HUMAN_QUEUED latest; now turn Reduce Motion ON')
		await transition(true)
		await until(
			() => text() === 'latest' && settled(),
			'OS toggle must settle the queued latest value',
			2000,
		)

		console.log('ROLLING_TEXT_HUMAN_SETTLED latest; native alpha=1 translationY=0')

		await transition(false)
		render('resumed')
		await wait(50)
		check(!settled(), 'opposite OS transition must resume interpolation')
		console.log('ROLLING_TEXT_HUMAN_RESUMED native interpolation')
		if (baseline) {
			await transition(true)
			await until(
				() => text() === 'resumed' && settled(),
				'restore ON must settle resumed playback',
				2000,
			)
		}

		check(readReducedMotion() === baseline, 'restore the original setting before passing')
		root.unmount()
		off()
		const afterOff = events.length
		await wait(150)
		check(host.subviews.count === 0 && events.length === afterOff, 'unmount and observer cleanup')
		check(readReducedMotion() === baseline, 'setting must remain restored through cleanup')
		console.log(
			'ROLLING_TEXT_HUMAN_OK ' +
				JSON.stringify({
					restored: baseline,
					events: events.length,
					subviews: host.subviews.count,
				}),
		)
	} catch (error) {
		console.error('ROLLING_TEXT_HUMAN_FAIL ' + (error as Error).message)
	} finally {
		off()
		try {
			root.unmount()
		} finally {
			console.log(
				'ROLLING_TEXT_HUMAN_RESTORE_REQUIRED ' +
					JSON.stringify({ reduceMotion: baseline, current: readReducedMotion() }),
			)

			;(globalThis as any).__xplatStopHost()
		}
	}
}
