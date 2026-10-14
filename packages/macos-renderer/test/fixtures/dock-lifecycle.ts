import Dock, { dockRefs, dockEvents } from './Dock'

export async function checkDockLifecycle(root: any, nativeWindow: any) {
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

	root.render(Dock, {})
	await settle()
	const host = debug.findId('dock'),
		fill = debug.findId('dock-fill'),
		descendant = debug.findId('dock-descendant')

	const edges = ['top', 'right', 'bottom', 'left'].map((id) => debug.findId('dock-' + id))
	check(
		dockRefs.host.current === host && dockRefs.fill.current === fill,
		'DockLayout refs not assigned',
	)

	check(Number(host.subviews.count) === 5 && fill.superview === host, 'DockLayout nesting failed')
	expectRect('dock-top', [10, 10, 280, 20])
	expectRect('dock-right', [250, 35, 40, 115])
	expectRect('dock-bottom', [10, 120, 240, 30])
	expectRect('dock-left', [10, 35, 50, 85])
	expectRect('dock-fill', [60, 35, 190, 85])
	expectRect('percentage-edge', [10, 10, 100, 80])
	expectRect('percentage-fill', [110, 10, 80, 80])
	check(
		Math.abs(Number(debug.findId('natural-dock').frame.size.height) - 60) < 1,
		'DockLayout natural host height failed',
	)

	debug.pressId('advance-dock')
	await settle()
	check(
		debug.findId('dock') === host && debug.findId('dock-fill') === fill,
		'DockLayout update recreated views',
	)

	expectRect('dock-top', [10, 145, 340, 25])
	expectRect('dock-right', [310, 10, 40, 135])
	expectRect('dock-bottom', [10, 115, 300, 30])
	expectRect('dock-left', [10, 10, 50, 105])
	expectRect('dock-fill', [60, 10, 60, 105])
	debug.pressId('advance-dock')
	await settle()
	expectRect('dock-top', [0, 70, 40, 20])
	expectRect('dock-fill', [90, 0, 170, 130])
	check(dockEvents.join(',') === 'attach', 'DockLayout update reassigned refs')
	debug.pressId('advance-dock')
	await settle()
	check(
		edges.every(
			(view, i) => debug.findId('dock-' + ['top', 'right', 'bottom', 'left'][i]) === view,
		),
		'DockLayout moves changed identity',
	)

	expectRect('dock-left', [0, 0, 50, 160])
	expectRect('dock-top', [50, 70, 40, 20])
	expectRect('dock-fill', [90, 0, 170, 130])
	debug.pressId('advance-dock')
	await settle()
	check(!edges[1].superview, 'DockLayout removal retained right child')
	expectRect('dock-fill', [90, 0, 210, 130])
	debug.pressId('advance-dock')
	await settle()
	const replacement = debug.findId('dock-fill'),
		replacementDescendant = debug.findId('dock-descendant')

	check(
		replacement !== fill &&
			replacement.superview === host &&
			!fill.superview &&
			!descendant.superview,
		'DockLayout replacement retained old subtree',
	)

	check(
		dockRefs.fill.current === replacement && dockEvents.join(',') === 'attach,cleanup,attach',
		'DockLayout replacement ref cleanup failed',
	)

	expectRect('dock-fill', [90, 0, 210, 130])
	debug.pressId('advance-dock')
	await settle()
	check(
		!replacement.superview && !replacementDescendant.superview && dockRefs.fill.current == null,
		'DockLayout removal retained subtree/ref',
	)

	check(
		dockEvents.join(',') === 'attach,cleanup,attach,cleanup',
		'DockLayout removal cleanup failed',
	)

	debug.pressId('advance-dock')
	await settle()
	const moved = debug.findId('dock-fill'),
		movedDescendant = debug.findId('dock-descendant')

	check(
		moved.superview === debug.findId('dock-other') && dockRefs.fill.current === moved,
		'DockLayout parent change failed',
	)

	expectRect('dock-fill', [0, 0, 100, 80])
	debug.pressId('advance-dock')
	await settle()
	const returned = debug.findId('dock-fill'),
		returnedDescendant = debug.findId('dock-descendant')

	check(
		returned.superview === host &&
			!moved.superview &&
			!movedDescendant.superview &&
			dockRefs.fill.current === returned,
		'DockLayout return to original parent retained old ownership',
	)

	expectRect('dock-fill', [90, 0, 210, 130])
	check(
		dockEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach',
		'DockLayout parent change callback lifecycle failed',
	)

	root.unmount()
	check(
		!returned.superview &&
			!returnedDescendant.superview &&
			!host.superview &&
			edges.every((view) => !view.superview) &&
			dockRefs.host.current == null,
		'DockLayout teardown retained hosts/refs',
	)

	root.unmount()
	check(dockEvents.length === 8, 'DockLayout teardown repeated callback cleanup')
	console.log('PACKED_DOCKLAYOUT_OK')
}
