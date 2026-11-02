import Search, { searchRefs, searchRefEvents, searchEvents } from './Search'

import { NSSearchField } from '@octane-xplat/platform/macos'

export async function checkSearchLifecycle(root: any, nativeWindow: any) {
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
				resolve()
			}, 60),
		)

	const advance = async () => {
		debug.pressId('advance-search')
		await settle()
	}

	const edit = (view: any, text: string) => {
		view.stringValue = text
		view.delegate.controlTextDidChange({ object: view })
	}

	const submit = (view: any) =>
		view.delegate.controlTextViewDoCommandBySelector(view, null, 'insertNewline:')

	root.render(Search, {})
	await settle()
	const a = debug.findId('search-a'),
		b = debug.findId('search-b'),
		parent = debug.findId('search-parent')

	check(a instanceof NSSearchField, 'SearchBar is not NSSearchField')
	check(
		searchRefs.host.current === a && searchRefEvents.join(',') === 'attach',
		'Search refs missing',
	)

	check(a.superview === parent && b.superview === parent, 'Search nesting failed')
	check(
		String(a.stringValue) === 'Initial a' && String(a.placeholderString) === 'Find items',
		'Initial Search props failed',
	)

	check(
		Number(a.frame.size.width) === 200 && Number(a.frame.size.height) === 28,
		'Search layout size failed',
	)

	// The masonview parent is an unflipped NSView: the earlier column child
	// sits higher, so it has the larger frame origin y.
	check(a.frame.origin.y > b.frame.origin.y, 'Search order/layout failed')

	searchEvents.length = 0
	edit(a, 'Typed')
	edit(a, 'Typed')
	check(
		searchEvents.length === 1 &&
			searchEvents[0].eventName === 'textChange' &&
			searchEvents[0].object === a &&
			searchEvents[0].value === 'Typed' &&
			searchEvents[0].oldValue === 'Initial a',
		'Search change payload/dedup failed',
	)

	check(nativeWindow.makeFirstResponder(a), 'Search could not become first responder')
	const editor = a.currentEditor()
	check(editor != null, 'Search field editor missing')
	editor.doCommandBySelector('insertNewline:')
	check(searchEvents.length === 2, 'AppKit field-editor Return did not submit once')
	searchEvents.pop()

	check(
		submit(a) === true && searchEvents[1].eventName === 'submit' && searchEvents[1].object === a,
		'Search submit payload failed',
	)

	edit(a, '')
	check(
		searchEvents.length === 3 &&
			searchEvents[2].value === '' &&
			searchEvents[2].oldValue === 'Typed',
		'Clear failed or emitted submit',
	)

	check(
		String(a.action) === '<null selector>' && a.cell.sendsActionOnEndEditing === false,
		'Search cancel/end-editing can submit: ' +
			JSON.stringify({ action: a.action, end: a.cell.sendsActionOnEndEditing }),
	)

	await advance()
	check(
		debug.findId('search-a') === a &&
			searchRefs.host.current === a &&
			String(a.stringValue) === 'Updated a' &&
			String(a.placeholderString) === 'Updated hint',
		'Search update lost identity or props',
	)

	check(
		searchEvents.some(
			(event) => event.object === a && event.value === 'Updated a' && event.oldValue === '',
		),
		'Programmatic text change missing',
	)

	await advance()
	check(
		String(a.stringValue) === '' && String(a.placeholderString) === '',
		'Removed Search props did not restore defaults',
	)

	await advance()
	check(
		b.frame.origin.y > a.frame.origin.y && debug.findId('search-a') === a,
		'Search keyed move lost order/identity',
	)

	const eventCount = searchEvents.length
	edit(a, 'Unbound')
	submit(a)
	check(searchEvents.length === eventCount, 'Removed Search handlers still fire')
	await advance()
	check(
		!b.superview && a.superview === parent && searchRefEvents.join(',') === 'attach',
		'Search removal changed retained ref',
	)

	const delegate = a.delegate
	await advance()
	check(
		debug.findId('search-a') !== a &&
			!a.superview &&
			a.delegate == null &&
			a.target == null &&
			searchRefs.host.current == null &&
			searchRefEvents.join(',') === 'attach,cleanup',
		'Search replacement leaked host/ref/delegate',
	)

	delegate.controlTextDidChange({ object: a })
	delegate.controlTextViewDoCommandBySelector(a, null, 'insertNewline:')
	check(searchEvents.length === eventCount, 'Disposed Search dispatch still fires')
	await advance()
	const first = debug.findId('search-moving')
	check(
		first.superview === debug.findId('search-other') && searchRefs.secondary.current === first,
		'Search ContentView nesting failed',
	)

	await advance()
	const second = debug.findId('search-moving')
	check(
		second.superview === parent &&
			!first.superview &&
			first.delegate == null &&
			searchRefs.secondary.current === second,
		'Search parent change retained old host',
	)

	await advance()
	const third = debug.findId('search-moving')
	check(
		third.superview === debug.findId('search-other') &&
			!second.superview &&
			second.delegate == null,
		'Search return parent failed',
	)

	root.unmount()
	check(
		!parent.superview &&
			!third.superview &&
			third.delegate == null &&
			third.target == null &&
			searchRefs.secondary.current == null,
		'Search teardown leaked host/refs',
	)

	root.unmount()
	check(searchRefEvents.join(',') === 'attach,cleanup', 'Search repeated cleanup')
	console.log('PACKED_SEARCHBAR_OK')
}
