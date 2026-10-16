import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import Proxy, { proxyRefs, proxyEvents, InvalidContentProjection } from './Proxy'

export async function checkProxyLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-proxy')
		await settle()
	}

	root.render(Proxy, {})
	await settle()
	const proxy = proxyRefs.host.current!,
		empty = proxyRefs.empty.current!,
		host = debug.findId('proxy-wrap')

	const a = debug.findId('proxy-a'),
		b = debug.findId('proxy-b'),
		text = debug.findId('proxy-text-a')

	check(
		proxy?.type === 'proxyviewcontainer' && proxy.view === null && typeof proxy.id === 'number',
		'Logical proxy ref missing',
	)

	check(
		empty?.type === 'proxyviewcontainer' && empty.view === null && empty !== proxy,
		'Empty logical proxy ref missing',
	)

	check(
		Number(host.subviews.count) === 4 && a.superview === host && b.superview === host,
		'Proxy allocated wrapper or lost children',
	)

	expectRect('proxy-a', [40, 0, 40, 20])
	expectRect('proxy-b', [80, 0, 40, 20])
	check(
		Number(debug.findId('proxy-natural').intrinsicContentSize.height) === 20,
		'Natural ContentView projected measurement failed',
	)

	expectRect('proxy-dock-rest', [40, 0, 60, 60])
	check(
		debug.findId('proxy-single-child').superview === debug.findId('proxy-single'),
		'Single ContentView projection failed',
	)

	expectRect('proxy-grid-direct', [0, 30, 40, 30])
	expectRect('proxy-grid-child', [0, 0, 40, 30])
	expectRect('proxy-absolute-child', [0, 0, 40, 20])
	await advance()
	check(
		proxyRefs.host.current === proxy && debug.findId('proxy-a') === a,
		'Update changed logical/host identity',
	)

	check(String(text.stringValue) === 'Updated a', 'Projected prop update failed')
	expectRect('proxy-a', [45, 0, 30, 20])
	expectRect('proxy-dock-rest', [0, 20, 100, 40])
	expectRect('proxy-grid-direct', [0, 0, 40, 30])
	expectRect('proxy-grid-child', [40, 30, 40, 30])
	expectRect('proxy-absolute-child', [20, 10, 40, 20])
	await advance()
	expectRect('proxy-dock-rest', [40, 0, 60, 60])
	expectRect('proxy-a', [40, 0, 40, 20])
	expectRect('proxy-grid-child', [0, 0, 40, 30])
	expectRect('proxy-absolute-child', [0, 0, 40, 20])
	await advance()
	check(
		debug.findId('proxy-a') === a && debug.findId('proxy-b') === b,
		'Group move recreated children',
	)

	check(
		host.subviews.objectAtIndex(1) === b && host.subviews.objectAtIndex(2) === a,
		'Native projection order differs after move',
	)

	expectRect('proxy-b', [40, 0, 40, 20])
	expectRect('proxy-a', [80, 0, 40, 20])
	await advance()
	check(!b.superview, 'Removed projected child retained host')
	expectRect('proxy-a', [40, 0, 40, 20])
	check(proxyEvents.join(',') === 'attach', 'Updates reassigned logical ref')
	await advance()
	const replacement = proxyRefs.host.current!,
		replacementView = debug.findId('proxy-replacement')

	check(
		replacement !== proxy &&
			replacement.view === null &&
			replacementView.superview === host &&
			!a.superview &&
			!text.superview,
		'Proxy replacement retained old subtree',
	)

	check(proxyEvents.join(',') === 'attach,cleanup,attach', 'Logical replacement ref cleanup failed')
	await advance()
	check(
		!replacementView.superview && proxyRefs.host.current == null,
		'Proxy removal retained projection/ref',
	)

	await advance()
	const movedProxy = proxyRefs.host.current!,
		movedView = debug.findId('proxy-returned'),
		movedChild = debug.findId('proxy-returned-child')

	check(
		movedProxy.view === null && movedView.superview === debug.findId('proxy-other'),
		'Other-parent projection failed',
	)

	await advance()
	const returnedProxy = proxyRefs.host.current!,
		returnedView = debug.findId('proxy-returned'),
		returnedChild = debug.findId('proxy-returned-child')

	check(
		returnedProxy !== movedProxy &&
			returnedView.superview === host &&
			!movedView.superview &&
			!movedChild.superview,
		'Parent change retained prior projection',
	)

	expectRect('proxy-returned', [40, 0, 40, 20])
	root.unmount()
	check(!returnedView.superview && !returnedChild.superview, 'Returned projection teardown failed')
	check(
		!host.superview &&
			proxyRefs.empty.current == null &&
			proxyEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Proxy teardown failed',
	)

	root.unmount()
	check(proxyEvents.length === 8, 'Proxy cleanup repeated')
	const rejectedRoot = createMacOSRoot(nativeWindow.contentView)
	const errors: string[] = [],
		originalError = console.error

	try {
		console.error = (...args: unknown[]) => {
			errors.push(args.map(String).join(' '))
		}

		try {
			rejectedRoot.render(InvalidContentProjection as any, {})
		} catch (error) {
			errors.push(String(error))
		}

		await settle()
		check(
			errors.some((error) => error.includes('contentview') && error.includes('multiple')),
			'Invalid ContentView projection was silently accepted',
		)

		check(
			Number(nativeWindow.contentView.subviews.count) === 0,
			'Rejected ContentView batch partially mounted',
		)
	} finally {
		console.error = originalError
		rejectedRoot.unmount()
	}

	console.log('PACKED_PROXY_CONTENTVIEW_REJECTION_OK')
	console.log('PACKED_PROXYVIEWCONTAINER_OK')
}
