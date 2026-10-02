import type { ProbeContext } from '../../scripts/probe/context'

function readText(view: any): string {
	if (!view) {
		return ''
	}

	if (typeof view.textContent === 'string') {
		return view.textContent
	}

	if (typeof view.text === 'string' && view.text) {
		return view.text
	}

	if (typeof view.stringValue === 'string') {
		return view.stringValue
	}

	let text = ''
	view.eachChildView?.((child: any) => {
		text += readText(child)
		return true
	})

	const children = view.subviews
	if (children) {
		for (let index = 0; index < children.count; index++)
			{text += readText(children.objectAtIndex(index))}
	}

	return text
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('select-single'))
	ctx.assert('initial single value', readText(ctx.find('select-value')), 'apple')
	let popup: any
	if (ctx.target === 'macos') {
		const bridge = (globalThis as any).__xplatAppKit
		const show = bridge.showAnchoredPopup
		bridge.showAnchoredPopup = (options: any) => {
			popup = show(options)
			return popup
		}

		ctx.onCleanup(() => {
			bridge.showAnchoredPopup = show
		})
	}

	await ctx.press('select-single')
	const findOption = () =>
		ctx.target === 'web'
			? (ctx.host as any).ownerDocument.querySelector('[role="option"]')
			: ctx.target === 'macos'
				? popup && !popup.closed && readText(popup.contentView).includes('Apple')
				: ctx.find('select-single-option-apple')

	await ctx.waitFor(findOption)
	ctx.assert('option surface opens', Boolean(findOption()), true)
	await ctx.press('select-single')
	await ctx.waitFor(() => !findOption())
	ctx.assert('option surface closes', Boolean(findOption()), false)
	ctx.assert('disabled selection retained', readText(ctx.find('select-values')), 'locked')
	if (ctx.target === 'macos') {
		await ctx.press('select-single')
		await ctx.waitFor(findOption)
		ctx.record('macosReopened', true)
		popup.popover.close()
		await ctx.waitFor(() => popup.closed)
		ctx.record('macosNotified', true)
		await ctx.press('select-single')
		await ctx.waitFor(findOption)
		ctx.assert('AppKit close notification reconciles open state', Boolean(findOption()), true)
		await ctx.press('select-single')
	} else {
		await ctx.press('select-single')
		await ctx.waitFor(findOption)
		if (ctx.target === 'web') {
			const rows = (ctx.host as any).ownerDocument.querySelectorAll('[role="option"]')
			const banana = Array.from(rows).find((row: any) => row.textContent.includes('Banana')) as any
			banana?.click()
		} else {
			await ctx.press('select-single-option-banana')
		}

		await ctx.waitFor(() => readText(ctx.find('select-value')) === 'banana')
		ctx.assert('single commit', readText(ctx.find('select-value')), 'banana')
		await ctx.waitFor(() => !findOption())
		await ctx.press('select-multiple')
		ctx.record('multiPressed', true)
		const find = (id: string) =>
			ctx.target === 'web' ? (ctx.host as any).ownerDocument.getElementById(id) : ctx.find(id)

		await ctx.waitFor(() => find('select-multiple-search'))
		ctx.record('multiSearchMounted', true)
		if (ctx.target === 'web') {
			const input = find('select-multiple-search')
			input.value = 'apple'
			input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true }))
		} else {
			await ctx.setText('select-multiple-search', 'apple')
		}

		await ctx.waitFor(() =>
			ctx.target === 'web'
				? !Array.from((ctx.host as any).ownerDocument.querySelectorAll('[role="option"]')).some(
						(row: any) => row.textContent.includes('Banana'),
					)
				: !ctx.find('select-multiple-option-banana'),
		)

		ctx.record('querySent', true)
		if (ctx.target === 'web') {
			find('select-multiple-select-all').click()
		} else {
			await ctx.press('select-multiple-select-all')
		}

		ctx.record('bulkValues', readText(ctx.find('select-values')))
		await ctx.waitFor(() => readText(ctx.find('select-values')) === 'locked,apple')
		ctx.assert(
			'filtered bulk retains disabled values',
			readText(ctx.find('select-values')),
			'locked,apple',
		)
	}
}
