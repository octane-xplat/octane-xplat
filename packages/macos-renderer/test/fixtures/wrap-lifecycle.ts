import Wrap, { wrapRefs, wrapEvents } from './Wrap'

export async function checkWrapLifecycle(root: any, nativeWindow: any) {
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

	const expectRect = (id: string, expected: number[]) => {
		const actual = rect(debug.findId(id))
		check(
			actual.every((value, i) => Math.abs(value - expected[i]) < 1),
			id + ': expected ' + expected.join(',') + ' got ' + actual.join(','),
		)
	}

	const advance = async () => {
		debug.pressId('advance-wrap')
		await settle()
	}

	root.render(Wrap, {})
	await settle()
	const host = debug.findId('wrap'),
		moving = debug.findId('wrap-moving'),
		descendant = debug.findId('wrap-descendant')

	const children = ['a', 'b', 'c'].map((id) => debug.findId('wrap-' + id))
	check(
		wrapRefs.host.current === host && wrapRefs.child.current === moving,
		'Wrap refs not assigned',
	)

	check(Number(host.subviews.count) === 4 && moving.superview === host, 'Wrap nesting failed')
	expectRect('wrap-a', [30, 15, 40, 20])
	expectRect('wrap-b', [90, 15, 80, 20])
	expectRect('wrap-c', [10, 45, 80, 20])
	expectRect('wrap-moving', [110, 45, 40, 20])
	expectRect('wrap-margin-child', [73, 34, 30, 10])
	check(
		Math.abs(Number(debug.findId('wrap-natural').frame.size.height) - 50) < 1,
		'Natural wrapped height failed',
	)

	const resizeHost = debug.findId('wrap-resize'), resizeLast = debug.findId('wrap-resize-last')
	expectRect('wrap-resize-last', [240, 0, 80, 30])
	nativeWindow.setContentSize({ width: 260, height: 200 })
	await settle()
	check(debug.findId('wrap-resize') === resizeHost && debug.findId('wrap-resize-last') === resizeLast, 'Window resize changed identity')
	console.log('WRAP_RESIZE_GEOMETRY ' + JSON.stringify({ content: Number(nativeWindow.contentView.bounds.size.width), host: Number(resizeHost.bounds.size.width), height: Number(resizeHost.bounds.size.height), natural: resizeHost.intrinsicContentSize, last: rect(resizeLast) }))
	expectRect('wrap-resize-last', [0, 30, 80, 30])
	check(Math.abs(Number(resizeHost.frame.size.height) - 60) < 1, 'Window resize did not update natural wrapped height')
	nativeWindow.setContentSize({ width: 400, height: 200 })
	await settle()
	expectRect('wrap-resize-last', [240, 0, 80, 30])
	const naturalLabel = debug.findId('wrap-natural-label')
	const initialNaturalWidth = rect(naturalLabel)[2]
	check(initialNaturalWidth > 0 && initialNaturalWidth < 200, 'Natural label size failed')

	await advance()
	check(
		debug.findId('wrap') === host && debug.findId('wrap-moving') === moving,
		'Wrap update changed identity',
	)

	check(debug.findId('wrap-natural-label') === naturalLabel && rect(naturalLabel)[2] > initialNaturalWidth, 'Natural child text update failed')

	expectRect('wrap-a', [20, 5, 40, 20])
	expectRect('wrap-b', [0, 35, 80, 20])
	expectRect('wrap-c', [0, 65, 80, 20])
	expectRect('wrap-moving', [100, 5, 40, 20])
	check(
		String(children[0].subviews.objectAtIndex(0).stringValue) === 'Updated a',
		'Reactive text failed',
	)

	await advance()
	expectRect('wrap-a', [0, 0, 40, 20])
	expectRect('wrap-b', [40, 0, 80, 20])
	expectRect('wrap-c', [120, 0, 80, 20])
	expectRect('wrap-moving', [0, 20, 40, 20])
	await advance()
	expectRect('wrap-b', [0, 20, 80, 20])
	expectRect('wrap-c', [0, 40, 80, 20])
	expectRect('wrap-moving', [0, 60, 40, 20])
	await advance()
	check(
		children.every((view, i) => debug.findId('wrap-' + ['a', 'b', 'c'][i]) === view),
		'Keyed wrap move changed identity',
	)

	expectRect('wrap-c', [0, 0, 80, 20])
	expectRect('wrap-a', [80, 0, 40, 20])
	expectRect('wrap-b', [120, 0, 80, 20])
	await advance()
	check(!children[1].superview, 'Removed wrap child retained parent')
	expectRect('wrap-moving', [120, 0, 40, 20])
	check(wrapEvents.join(',') === 'attach', 'Updates reassigned refs')
	await advance()
	const replacement = debug.findId('wrap-moving'),
		replacementDescendant = debug.findId('wrap-descendant')

	check(
		replacement !== moving &&
			replacement.superview === host &&
			!moving.superview &&
			!descendant.superview,
		'Wrap replacement retained old subtree',
	)

	check(
		wrapRefs.child.current === replacement && wrapEvents.join(',') === 'attach,cleanup,attach',
		'Replacement ref cleanup failed',
	)

	await advance()
	check(
		!replacement.superview && !replacementDescendant.superview && wrapRefs.child.current == null,
		'Wrap removal retained subtree/ref',
	)

	await advance()
	const moved = debug.findId('wrap-moving'),
		movedDescendant = debug.findId('wrap-descendant')

	check(
		moved.superview === debug.findId('wrap-other') && wrapRefs.child.current === moved,
		'Wrap parent change failed',
	)

	expectRect('wrap-moving', [10, 10, 40, 20])
	await advance()
	const returned = debug.findId('wrap-moving'),
		returnedDescendant = debug.findId('wrap-descendant')

	check(
		returned.superview === host &&
			!moved.superview &&
			!movedDescendant.superview &&
			wrapRefs.child.current === returned,
		'Wrap return retained old ownership',
	)

	expectRect('wrap-moving', [120, 0, 40, 20])
	check(
		wrapEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach',
		'Wrap parent-change callbacks failed',
	)

	root.unmount()
	check(
		!returned.superview &&
			!returnedDescendant.superview &&
			!host.superview &&
			children.every((view) => !view.superview) &&
			wrapRefs.host.current == null &&
			wrapRefs.child.current == null,
		'Wrap teardown retained hosts/refs',
	)

	root.unmount()
	check(wrapEvents.length === 8, 'Wrap cleanup repeated')
	console.log('PACKED_WRAPLAYOUT_OK')
}
