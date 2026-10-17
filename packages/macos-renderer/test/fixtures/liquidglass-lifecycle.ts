import Glass, { glassRefs, glassEvents } from './LiquidGlass'

export async function checkLiquidGlassLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-glass')
		await settle()
	}

	root.render(Glass, {})
	await settle()
	const host = debug.findId('glass'),
		a = debug.findId('glass-a'),
		b = debug.findId('glass-b')

	const moving = debug.findId('glass-moving'),
		descendant = debug.findId('glass-descendant')

	check(glassRefs.host.current === host && glassRefs.child.current === moving, 'Glass refs missing')
	check(glassEvents.join(',') === 'attach', 'Nested array callback ref missing')

	// The glass material is a backdrop subview pinned behind grid children.
	const backdrop = host.subviews.objectAtIndex(0)
	check(
		Number(backdrop.material) === 21 && Number(backdrop.blendingMode) === 0,
		'Glass backdrop is not the under-window material',
	)

	check(moving.superview === host && descendant.superview === moving, 'Glass nesting failed')
	check(
		Number(host.subviews.count) === 4 &&
			host.subviews.objectAtIndex(1) === a &&
			host.subviews.objectAtIndex(2) === b &&
			host.subviews.objectAtIndex(3) === moving,
		'Glass backdrop does not sit behind children',
	)

	check(
		rect(backdrop).every((value, i) => Math.abs(value - [0, 0, 200, 80][i]) < 1),
		'Glass backdrop not pinned to host edges: ' + rect(backdrop),
	)

	expectRect('glass-a', [0, 0, 200, 80])
	expectRect('glass-b', [0, 0, 200, 80])
	expectRect('glass-moving', [0, 60, 40, 20])
	expectRect('glass-descendant', [0, 0, 40, 20])
	expectRect('glass-fill', [0, 0, 80, 30])
	expectRect('glass-cell', [80, 30, 30, 10])

	await advance()
	check(
		debug.findId('glass') === host && debug.findId('glass-a') === a,
		'Glass update changed host identity',
	)

	check(
		String(debug.findId('glass-text-a').stringValue) === 'Updated a',
		'Glass descendant update failed',
	)

	expectRect('glass-a', [200, 80, 40, 20])
	expectRect('glass-moving', [0, 80, 40, 20])

	await advance()
	expectRect('glass-a', [0, 0, 200, 80])
	expectRect('glass-moving', [0, 60, 40, 20])

	await advance()
	check(
		host.subviews.objectAtIndex(0) === backdrop &&
			Number(host.subviews.count) === 4 &&
			debug.findId('glass-a') === a &&
			debug.findId('glass-b') === b &&
			a.superview === host &&
			b.superview === host,
		'Glass keyed move lost identity, backdrop or children',
	)

	await advance()
	check(!b.superview && a.superview === host, 'Glass removal/retained children failed')

	await advance()
	const replacement = debug.findId('glass-moving'),
		replacementChild = debug.findId('glass-replacement')

	check(
		replacement !== moving &&
			!moving.superview &&
			!descendant.superview &&
			glassRefs.child.current === replacement,
		'Glass replacement retained prior subtree',
	)

	check(glassEvents.join(',') === 'attach,cleanup,attach', 'Glass replacement ref cleanup failed')

	await advance()
	check(
		!replacement.superview && !replacementChild.superview && a.superview === host,
		'Glass emptying failed',
	)

	await advance()
	const other = debug.findId('glass-moving'),
		otherChild = debug.findId('glass-descendant')

	check(other.superview === debug.findId('glass-other'), 'Glass alternate parent mount failed')

	await advance()
	const returned = debug.findId('glass-moving'),
		returnedChild = debug.findId('glass-descendant')

	check(
		returned.superview === host && !other.superview && !otherChild.superview,
		'Glass parent change retained old subtree',
	)

	root.unmount()
	check(
		!host.superview &&
			!a.superview &&
			!returned.superview &&
			!returnedChild.superview &&
			!backdrop.superview,
		'Glass teardown retained descendants host:' +
			!!host.superview +
			' a:' +
			!!a.superview +
			' returned:' +
			!!returned.superview +
			' child:' +
			!!returnedChild.superview +
			' backdrop:' +
			!!backdrop.superview,
	)

	check(
		glassRefs.host.current == null &&
			glassRefs.child.current == null &&
			glassEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Glass ref teardown failed',
	)

	console.log('PACKED_LIQUIDGLASS_OK')
}
