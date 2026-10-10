/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { TextInput, TextArea } from '@octane-xplat/ui'

function Content({
	secure = false,
	value,
	maxRows,
	style,
	autoGrow = true,
	returnKeyType = 'done',
	input,
	area,
	events,
}) {
	return (
		<stack>
			<TextInput
				id="input"
				ref={input}
				secure={secure}
				value="secret"
				onFocus={() => events.push('input focus')}
				onBlur={() => events.push('input blur')}
				onChange={() => events.push('change')}
				onSubmit={() => events.push('input submit')}
			/>
			<TextArea
				id="area"
				ref={area}
				value={value}
				rows={2}
				style={style}
				autoGrow={autoGrow}
				maxRows={maxRows}
				returnKeyType={returnKeyType}
				onFocus={() => events.push('area focus')}
				onBlur={() => events.push('area blur')}
				onSubmit={() => events.push('area submit')}
			/>
		</stack>
	)
}

export function runTextControlsFixture() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 400, height: 300 } },
		NSWindowStyleMask.Titled,
		NSBackingStoreType.Buffered,
		false,
	)

	const root = createMacOSRoot(window.contentView)
	const input = { current: null }
	const area = { current: null }
	const events = []

	const check = (ok, message) => {
		if (!ok) {
			throw new Error(message)
		}
	}

	const wait = () => new Promise((resolve) => setTimeout(resolve, 40))
	const height = () => Number(area.current.native.enclosingScrollView.frame.size.height)
	const execute = async () => {
		root.render(Content, { input, area, events })
		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(input.current?.native === root.__macosDebug.findId('input'), 'Input ref missing')
		check(area.current?.native === root.__macosDebug.findId('area'), 'Area ref missing')
		const field = input.current.native
		input.current.focus()
		check(events.includes('input focus'), 'Input focus callback missing')
		input.current.blur()
		check(events.includes('input blur'), 'Input blur callback missing')
		area.current.focus()
		check(events.includes('area focus'), 'Area focus callback missing')
		area.current.blur()
		check(events.includes('area blur'), 'Area blur callback missing')
		const initial = height()
		check(initial > 0, 'Initial height missing')
		input.current.focus()
		root.render(Content, {
			input,
			area,
			events,
			secure: true,
			maxRows: 3,
			value: 'a\nb\nc\nd\ne\nf',
		})

		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(input.current.native === field, 'Secure update replaced native ref')
		check(field.cell instanceof NSSecureTextFieldCell, 'Secure update did not install secure cell')
		check(String(field.stringValue) === 'secret', 'Secure update lost value')
		check(field.currentEditor() != null, 'Secure update lost editing focus')
		input.current.blur()
		area.current.focus()
		const capped = height()
		check(capped > initial && capped <= initial * 1.5 + 1, 'Growth did not cap at three rows')
		check(Number(area.current.native.frame.size.height) > capped, 'Capped text is not scrollable')
		check(
			area.current.native.delegate.textViewDoCommandBySelector(
				area.current.native,
				'insertNewline:',
			),
			'Done did not consume Return',
		)

		check(events.includes('area submit'), 'Multiline submit missing')
		field.target.textFieldSubmitted(field)
		check(events.includes('input submit') && !events.includes('change'), 'Submit echoed a change')
		root.render(Content, {
			input,
			area,
			events,
			secure: false,
			value: 'a\nb\nc\nd\ne\nf',
			maxRows: undefined,
			returnKeyType: 'next',
		})

		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(!(field.cell instanceof NSSecureTextFieldCell), 'Secure removal failed')
		check(height() > capped, 'Removing cap did not grow')
		check(
			!area.current.native.delegate.textViewDoCommandBySelector(
				area.current.native,
				'insertNewline:',
			),
			'Ordinary Return consumed',
		)

		root.render(Content, { input, area, events, autoGrow: false, value: 'a\nb\nc\nd' })
		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(Math.abs(height() - initial) <= 1, 'Fixed rows failed: ' + height() + ' vs ' + initial)
		root.render(Content, { input, area, events, autoGrow: true, maxRows: 3 })
		await wait()
		root.__macosDebug.setText('area', 'one\ntwo\nthree\nfour\nfive')
		window.contentView.layoutSubtreeIfNeeded()
		check(height() <= capped + 1, 'Uncontrolled input exceeded cap')
		root.render(Content, { input, area, events, autoGrow: true, maxRows: 2 })
		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(String(area.current.native.string).includes('five'), 'Uncontrolled update erased text')
		check(Math.abs(height() - initial) <= 1, 'Updating cap failed')
		root.render(Content, { input, area, events, style: { height: 80 }, maxRows: 2 })
		await wait()
		window.contentView.layoutSubtreeIfNeeded()
		check(Math.abs(height() - 80) <= 1, 'Explicit height did not win')
		root.unmount()
		check(input.current === null && area.current === null, 'Unmount retained refs')
		window.close()
		console.log('TEXT_CONTROLS_OK')
	}

	execute()
		.catch((error) => console.error('TEXT_CONTROLS_FAIL: ' + error.message + '\n' + error.stack))
		.finally(() => globalThis.__xplatStopHost())
}
