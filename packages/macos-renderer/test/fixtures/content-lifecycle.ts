import Content, { contentRefs, contentEvents } from './Content'

export async function checkContentLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (condition: boolean, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const near = (a: number, b: number) => Math.abs(a - b) < 1
	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				setTimeout(() => {
					nativeWindow.contentView.layoutSubtreeIfNeeded()
					resolve()
				}, 20)
			}, 30),
		)

	root.render(Content, {})
	await settle()
	const host = debug.findId('content')
	const first = debug.findId('content-child')
	const firstLabel = debug.findId('content-label')
	const slot = debug.findId('replacement-slot')
	const superseded = debug.findId('slot-a')
	const current = debug.findId('slot-b')
	check(
		Number(slot.subviews.count) === 1 && current.superview === slot && !superseded.superview,
		'ContentView insertion did not replace the native slot',
	)

	const rect = (view: any) => view.alignmentRectForFrame(view.frame)
	const top = (view: any) => {
		const parent = view.superview
		const flipped = typeof parent.isFlipped === 'function' ? parent.isFlipped() : parent.isFlipped
		return flipped
			? Number(rect(view).origin.y)
			: Number(parent.bounds.size.height) -
					Number(rect(view).origin.y) -
					Number(rect(view).size.height)
	}
	const describe = (r: any) => [r.origin.x, r.origin.y, r.size.width, r.size.height].join(',')
	check(
		contentRefs.host.current === host && contentRefs.child.current === first,
		'ContentView ref mount failed',
	)

	check(
		Number(host.subviews.count) === 1 && first.superview === host,
		'ContentView mount did not own one child',
	)

	check(
		near(host.frame.size.width, 200) && near(host.frame.size.height, 80),
		'ContentView fixed host size failed',
	)

	check(
		near(rect(firstLabel).origin.x, 70) && near(top(firstLabel), 30),
		'ContentView centered child failed',
	)

	check(
		near(debug.findId('auto-content').frame.size.height, 18),
		'ContentView intrinsic child sizing failed',
	)

	debug.pressId('advance-content')
	await settle()
	check(
		Number(slot.subviews.count) === 1 && current.superview === slot && !superseded.superview,
		'Removing superseded ContentView child cleared its replacement',
	)

	check(
		debug.findId('content') === host &&
			debug.findId('content-child') === first &&
			debug.findId('content-label') === firstLabel,
		'ContentView update changed host or child identity',
	)

	check(
		String(firstLabel.stringValue) === 'Updated content',
		'ContentView reactive child update failed',
	)
	check(
		near(host.frame.size.width, 260) &&
			near(rect(firstLabel).origin.x, 200) &&
			near(top(firstLabel), 0),
		'ContentView reactive size/alignment failed: host=' +
			describe(host.frame) +
			' child=' +
			describe(rect(firstLabel)) +
			' bounds=' +
			describe(host.bounds),
	)

	debug.pressId('advance-content')
	await settle()
	check(
		Number(slot.subviews.count) === 0 && !current.superview,
		'Removing current ContentView child did not clear its native slot',
	)

	check(debug.findId('content-child') === first, 'ContentView reset recreated its child')
	check(
		near(rect(first).origin.x, 0) &&
			near(rect(first).size.width, 200) &&
			near(rect(first).size.height, 80),
		'ContentView removed size/alignment did not restore stretch',
	)

	debug.pressId('advance-content')
	await settle()
	const replacement = debug.findId('content-child')
	const descendant = debug.findId('content-descendant')
	check(
		replacement !== first && !first.superview && !firstLabel.superview,
		'ContentView replacement kept the previous child',
	)

	check(
		contentRefs.child.current === replacement &&
			contentEvents.join(',') === 'attach,cleanup,attach',
		'ContentView replacement refs failed: events=' +
			contentEvents.join(',') +
			' current=' +
			String(contentRefs.child.current === replacement),
	)

	check(
		Number(host.subviews.count) === 1 && replacement.superview === host,
		'ContentView replacement did not own one child',
	)

	check(
		near(replacement.frame.size.width, 200) && near(replacement.frame.size.height, 80),
		'ContentView default stretch failed',
	)

	debug.pressId('advance-content')
	await settle()
	check(
		Number(host.subviews.count) === 0 && !replacement.superview,
		'ContentView removal retained child',
	)

	check(!descendant.superview, 'ContentView removal retained descendant')
	check(
		contentRefs.child.current == null &&
			contentEvents.join(',') === 'attach,cleanup,attach,cleanup',
		'ContentView removal refs failed',
	)

	debug.pressId('advance-content')
	await settle()
	const finalChild = debug.findId('content-child')
	const finalDescendant = debug.findId('content-descendant')
	check(
		finalChild !== replacement &&
			finalChild.superview === host &&
			contentRefs.child.current === finalChild,
		'ContentView reinsertion failed',
	)

	root.unmount()
	check(
		!host.superview && !finalChild.superview && !finalDescendant.superview,
		'ContentView teardown retained native views',
	)

	check(
		contentRefs.host.current == null && contentRefs.child.current == null,
		'ContentView teardown retained object refs',
	)

	check(
		contentEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup',
		'ContentView teardown callback cleanup failed',
	)

	root.unmount()
	check(contentEvents.length === 6, 'ContentView cleanup repeated')
	console.log('PACKED_CONTENTVIEW_OK')
}
