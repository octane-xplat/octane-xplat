import { createMacOSRoot } from '../../macos-renderer/src/index'
import { RollingText } from '@octane-xplat/rolling-text'
import { clipRow, viewHeight, writeCell } from '../src/host.macos'
import { observeReducedMotion, readReducedMotion } from '../src/reduced-motion.macos'
import { NSView, NSWorkspace } from '@octane-xplat/platform/macos'

function App(props: any) {
	return (
		<masonview style={{flexDirection: "column", ...({display: "flex"})}}>
			<RollingText {...props} />
		</masonview>
	)
}

// Real NSViews and the real workspace notification center. No window, input,
// permission requests, OS preference writes or image capture.
export async function runRollingText() {
	const host = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 400, 100))
	let root = createMacOSRoot(host)
	let assertions = 0
	const check = (condition: boolean, message: string) => {
		assertions++
		if (!condition) {
			throw new Error(message)
		}
	}

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
			.map((cell) => children(cell)[0].stringValue)
			.join('')

	const y = (cell: any) => Number(cell.layer.valueForKeyPath('transform.translation.y'))
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const render = (value: string, options: any = {}) => {
		root.render(App, {
			value,
			reducedMotion: 'never',
			transition: { duration: 0.12 },
			style: { height: 24 },
			...options,
		})

		host.layoutSubtreeIfNeeded()
	}

	try {
		const plain = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 80, 24))
		clipRow(plain)
		check(plain.layer.masksToBounds, 'native one-line clip')
		check(viewHeight(plain) === 24, 'native height in points')
		writeCell(plain, 12, 0.25)
		check(y(plain) === -12 && Number(plain.alphaValue) === 0.25, 'native cell channels')
		plain.setFrameSize({ width: 80, height: 48 })
		check(viewHeight(plain) === 48, 'layout changes update distance')
		plain.setFrameSize({ width: 0, height: 0 })
		check(viewHeight(plain) === 0, 'pre-layout zero height')

		render('9')
		await wait(20)
		check(text() === '9', 'initial settled value')
		check(row().layer.masksToBounds, 'mounted row clips')
		render('9', { style: { height: 48, fontSize: 32 } })
		await wait(20)
		check(Number(children(cells()[0])[0].font.pointSize) === 32, 'font size reaches native label')
		check(viewHeight(row()) === 48, 'mounted layout measurement updates')
		check(row().layer.masksToBounds, 'clip survives font and layout changes')
		render('9')
		const original = cells()[0]
		render('9')
		check(cells()[0] === original, 'equal value preserves cell')
		render('10')
		await wait(45)
		check(text() === '910', 'outgoing and incoming cells coexist')
		check(
			cells().some((cell) => Math.abs(y(cell)) > 0),
			'actual native intermediate translation',
		)

		check(
			cells().some((cell) => Number(cell.alphaValue) > 0 && Number(cell.alphaValue) < 1),
			'native intermediate alpha',
		)

		await wait(230)
		check(text() === '10', 'completed roll removes outgoing text')
		check(
			cells().every((cell) => y(cell) === 0 && Number(cell.alphaValue) === 1),
			'native final channels',
		)

		render('a', { reducedMotion: 'always' })
		render('b', { updatePolicy: 'latest' })
		render('c', { updatePolicy: 'latest' })
		check(String(row().accessibilityLabel()) === 'c', 'latest accessible name during queued roll')
		check(
			cells().every(
				(cell) => cell.accessibilityIsIgnored() && !children(cell)[0].accessibilityElement,
			),
			'outgoing glyphs are not accessible',
		)

		render('c', { updatePolicy: 'latest', reducedMotion: 'always' })
		await wait(20)
		check(text() === 'c', 'reduced policy settles queued latest value')
		await wait(300)
		check(text() === 'c', 'obsolete queued playback stays cancelled')

		render('d', { direction: 'down' })
		await wait(35)
		check(
			cells().some((cell) => y(cell) > 0),
			'down direction enters above in native coordinates',
		)

		render('e')
		await wait(260)
		check(text() === 'e', 'interrupt survives with latest target')
		render('👩‍🚀e\u0301', { reducedMotion: 'always' })
		await wait(0)
		check(
			text() === '👩‍🚀e\u0301',
			'joined emoji and combining value preserved: ' + JSON.stringify(text()),
		)

		check(cells().length <= 2, 'graphemes never split within joined emoji or combining sequence')
		render('hello world', { rollBy: 'word', reducedMotion: 'always' })
		await wait(0)
		check(text() === 'hello world' && cells().length === 2, 'word segmentation')
		render('', { reducedMotion: 'always' })
		await wait(0)
		check(cells().length === 0 && String(row().accessibilityLabel()) === '', 'empty value')

		const workspace = NSWorkspace.sharedWorkspace
		check(
			readReducedMotion() === Boolean(workspace.accessibilityDisplayShouldReduceMotion),
			'real initial OS preference read',
		)

		let notifications = 0
		const off = observeReducedMotion(() => notifications++)
		workspace.notificationCenter.postNotificationNameObject(
			NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
			workspace,
		)

		check(notifications === 1, 'actual workspace-center observer delivery')
		off()
		off()
		workspace.notificationCenter.postNotificationNameObject(
			NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification,
			workspace,
		)

		check(notifications === 1, 'observer removed once; no late delivery')

		for (let run = 0; run < 3; run++) {
			render('first')
			render('second', { transition: { duration: 1 } })
			await wait(20)
			const detached = cells()[0]
			root.unmount()
			check(host.subviews.count === 0, 'unmount removes native tree')
			const alpha = detached.alphaValue
			await wait(40)
			check(detached.alphaValue === alpha, 'no frame writes after detach')
			root = createMacOSRoot(host)
		}

		console.log(
			'ROLLING_TEXT_OK ' +
				assertions +
				' assertions; live OS toggle and visual appearance unqualified',
		)
	} catch (error) {
		console.error('ROLLING_TEXT_FAIL ' + (error as Error).message)
	} finally {
		root.unmount()

		;(globalThis as any).__xplatStopHost()
	}
}
