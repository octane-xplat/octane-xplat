import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import Root, { rootRefs, rootEvents, RootSurface, RootWindow } from './Root'

export async function checkRootLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (condition: boolean, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				setTimeout(() => {
					nativeWindow.contentView.layoutSubtreeIfNeeded()
					resolve()
				}, 30)
			}, 30),
		)

	const rect = (view: any) => {
		const r = view.alignmentRectForFrame(view.frame)
		return [
			Number(r.origin.x),
			Number(view.superview.bounds.size.height) - Number(r.origin.y) - Number(r.size.height),
			Number(r.size.width),
			Number(r.size.height),
		]
	}

	const expectRect = (id: string, values: number[]) => {
		const actual = rect(debug.findId(id))
		check(
			actual.every((value, i) => Math.abs(value - values[i]) < 1),
			id + ': expected ' + values + ' got ' + actual,
		)
	}

	const advance = async () => {
		debug.pressId('advance-root')
		await settle()
	}

	root.render(Root, {})
	await settle()
	const host = debug.findId('root'),
		a = debug.findId('root-a'),
		b = debug.findId('root-b')

	const moving = debug.findId('root-moving'),
		descendant = debug.findId('root-descendant')

	check(rootRefs.host.current === host && rootRefs.child.current === moving, 'Root refs missing')
	check(rootEvents.join(',') === 'attach', 'Nested array callback ref missing')
	check(moving.superview === host && descendant.superview === moving, 'Root nesting failed')
	expectRect('root-a', [0, 0, 200, 80])
	expectRect('root-b', [0, 0, 200, 80])
	expectRect('root-moving', [80, 30, 40, 20])
	expectRect('root-descendant', [0, 0, 40, 20])
	expectRect('root-percent-child', [50, 20, 100, 40])
	expectRect('root-projected', [10, 10, 180, 60])
	check(
		Number(debug.findId('root-natural').intrinsicContentSize.width) === 52 &&
			Number(debug.findId('root-natural').intrinsicContentSize.height) === 24,
		'Overlapping natural measurement failed',
	)

	const surface = (globalThis as any).__xplatAppKit.presentSurface({
		owner: host,
		component: RootSurface,
		width: 80,
		height: 30,
	})

	await settle()
	check(
		surface.layer.superview === nativeWindow.contentView &&
			surface.panel.superview === surface.layer,
		'Presentation ownership changed',
	)

	await advance()
	check(
		debug.findId('root') === host &&
			debug.findId('root-a') === a &&
			rootRefs.child.current === moving,
		'Root update changed identity',
	)

	check(
		String(debug.findId('root-text-a').stringValue) === 'Updated a',
		'Root descendant update failed',
	)

	expectRect('root-a', [185, 65, 40, 20])
	expectRect('root-moving', [100, 40, 40, 20])
	await advance()
	expectRect('root-a', [0, 0, 200, 80])
	expectRect('root-moving', [80, 30, 40, 20])
	await advance()
	check(
		host.subviews.objectAtIndex(0) === b &&
			host.subviews.objectAtIndex(1) === a &&
			debug.findId('root-a') === a,
		'Root keyed order/identity failed',
	)

	await advance()
	check(
		!b.superview && a.superview === host && rootEvents.join(',') === 'attach',
		'Root removal/retained refs failed',
	)

	await advance()
	const replacement = debug.findId('root-moving'),
		replacementChild = debug.findId('root-replacement')

	check(
		replacement !== moving &&
			!moving.superview &&
			!descendant.superview &&
			rootRefs.child.current === replacement,
		'Root replacement retained prior subtree',
	)

	check(rootEvents.join(',') === 'attach,cleanup,attach', 'Replacement ref cleanup failed')
	await advance()
	check(
		!replacement.superview && !replacementChild.superview && rootRefs.child.current == null,
		'Root emptying failed',
	)

	await advance()
	const other = debug.findId('root-moving'),
		otherChild = debug.findId('root-descendant')

	check(other.superview === debug.findId('root-other'), 'Alternate parent mount failed')
	await advance()
	const returned = debug.findId('root-moving'),
		returnedChild = debug.findId('root-descendant')

	check(
		returned.superview === host && !other.superview && !otherChild.superview,
		'Root parent change retained old subtree',
	)

	check(
		!surface.closed && surface.layer.superview === nativeWindow.contentView,
		'Raw host update stole window presentation',
	)

	root.unmount()
	check(
		!host.superview && !a.superview && !returned.superview && !returnedChild.superview,
		'Root teardown retained descendants',
	)

	check(
		rootRefs.host.current == null &&
			rootRefs.child.current == null &&
			rootEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Root ref teardown failed',
	)

	check(
		!surface.closed && surface.layer.superview === nativeWindow.contentView,
		'Raw root teardown changed window-owned presentation lifetime',
	)

	surface.close()
	await surface.closedPromise
	check(
		surface.closed &&
			!surface.layer.superview &&
			Number(nativeWindow.contentView.subviews.count) === 0,
		'Presentation did not clean up independently',
	)

	root.unmount()
	check(rootEvents.length === 8, 'Root cleanup repeated')
	const windowTree = createMacOSRoot(nativeWindow.contentView)
	try {
		const windowDebug = (windowTree as any).__macosDebug
		windowTree.render(RootWindow as any, {})
		await settle()
		const windowRoot = windowDebug.findId('root-window'),
			windowChild = windowDebug.findId('root-window-child')

		check(
			rect(windowChild).every(
				(value, i) =>
					Math.abs(
						value -
							[
								0,
								0,
								Number(nativeWindow.contentView.bounds.size.width),
								Number(nativeWindow.contentView.bounds.size.height),
							][i],
					) < 1,
			),
			'Top-level root did not fill window',
		)

		nativeWindow.setContentSize({ width: 300, height: 180 })
		await settle()
		check(
			windowDebug.findId('root-window') === windowRoot &&
				windowDebug.findId('root-window-child') === windowChild,
			'Window resize changed root identity',
		)

		check(
			rect(windowChild).every((value, i) => Math.abs(value - [0, 0, 300, 180][i]) < 1),
			'Window resize did not update overlapping cell: ' +
				JSON.stringify({
					child: rect(windowChild),
					host: windowRoot.frame,
					window: nativeWindow.contentView.bounds,
				}),
		)

		windowTree.unmount()
		check(!windowRoot.superview && !windowChild.superview, 'Top-level root teardown retained views')
	} finally {
		windowTree.unmount()
		nativeWindow.setContentSize({ width: 400, height: 200 })
	}

	console.log('PACKED_ROOTLAYOUT_OK')
}
