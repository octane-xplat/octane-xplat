import ListPicker, { listRef, listRefEvents, listChanges } from './List'

import { NSControlSize, NSPopUpButton } from '@octane-xplat/platform/macos'

export async function checkListLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (value: boolean, message: string) => {
		if (!value) {
			throw new Error(message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 80),
		)

	const advance = async () => {
		debug.pressId('advance-list')
		await settle()
	}

	const index = (view: any) => Number(view.indexOfSelectedItem)
	const count = (view: any) => Number(view.numberOfItems)
	const titles = (view: any) =>
		Array.from({ length: count(view) }, (_, i) => String(view.itemAtIndex(i).title)).join('|')

	const disposed = (view: any) =>
		!view.superview &&
		view.target == null &&
		String(view.action) === '<null selector>' &&
		count(view) === 0

	root.render(ListPicker, {})
	await settle()
	const first = listRef.current,
		left = debug.findId('list-left'),
		tail = debug.findId('list-tail')

	check(
		first instanceof NSPopUpButton &&
			!first.pullsDown &&
			first.bordered &&
			Number(first.controlSize) === Number(NSControlSize.Regular),
		'ListPicker native default styling failed',
	)

	check(
		titles(first) === 'Same|Same|2|42|' && index(first) === 1,
		'ListPicker duplicate/null/numeric/empty labels or initial index failed',
	)

	const idle = debug.findId('list-default'),
		natural = debug.findId('list-natural')

	check(
		count(idle) === 0 && index(idle) === -1 && count(natural) === 1 && index(natural) === 0,
		'ListPicker empty/default index failed',
	)

	check(
		Number(natural.frame.size.width) > 0 && Number(natural.frame.size.height) > 0,
		'ListPicker intrinsic layout failed',
	)

	check(
		Number(first.alphaValue) === 0.5 &&
			Math.abs(Number(first.alignmentRectForFrame(first.frame).size.width) - 160) < 1,
		'ListPicker explicit layout/style failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'ListPicker initial nesting/order failed',
	)

	await advance()
	check(
		listRef.current === first && titles(first) === 'New|Next|Last' && index(first) === 2,
		'ListPicker reactive items/index identity failed',
	)

	check(
		listChanges.some(
			(event) =>
				event.eventName === 'selectedIndexChange' &&
				event.object === first &&
				event.value === 2 &&
				event.oldValue === 1,
		),
		'ListPicker prop event payload failed',
	)

	const before = listChanges.length
	first.selectItemAtIndex(0)
	first.target.controlChanged(first)
	check(
		listChanges.length === before + 1 &&
			listChanges.at(-1).value === 0 &&
			listChanges.at(-1).oldValue === 2 &&
			listChanges.at(-1).object === first,
		'ListPicker native event payload failed',
	)

	first.target.controlChanged(first)
	check(listChanges.length === before + 1, 'ListPicker unchanged action emitted an event')
	await advance()
	check(
		listRef.current === first &&
			count(first) === 0 &&
			index(first) === -1 &&
			Number(first.alphaValue) === 1,
		'ListPicker dropped props/style defaults failed',
	)

	await advance()
	check(
		listRef.current === first && Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'ListPicker keyed move lost identity/order',
	)

	await advance()
	const moved = listRef.current
	check(
		moved && moved !== first && moved.superview === debug.findId('list-right') && disposed(first),
		'ListPicker parent change ownership failed',
	)

	check(
		listRefEvents.join(',') === 'attach,cleanup,attach',
		'ListPicker parent change ref cleanup failed',
	)

	await advance()
	const returned = listRef.current
	check(
		returned && returned !== moved && returned.superview === left && disposed(moved),
		'ListPicker return failed',
	)

	await advance()
	const replacement = listRef.current
	check(
		replacement && replacement !== returned && replacement.superview === left && disposed(returned),
		'ListPicker replacement failed',
	)

	await advance()
	check(
		listRef.current == null &&
			disposed(replacement) &&
			listRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'ListPicker removal/ref cleanup failed',
	)

	await advance()
	const retained = listRef.current
	check(retained && retained.superview === left, 'ListPicker reinsertion failed')
	root.unmount()
	check(
		listRef.current == null &&
			disposed(retained) &&
			listRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'ListPicker live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'ListPicker ancestor teardown failed')
	console.log('PACKED_LISTPICKER_OK')
}
