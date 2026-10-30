// eslint-disable-next-line xplat/no-ns-deep-import -- This bare runtime fixture initializes the patched host bridge without a NativeScript UI bundle.
import { subscribeNativeEvent } from '@nativescript/core/ui/gestures/pointer-events.windows.js'
import { createShortcuts } from '../../src/index.windows.ts'

// Normal NativeScript bundles install these globals in their entry prelude.
for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
	globalThis[name] ??= globalThis['__ns__' + name]
}
const ui = Microsoft.UI.Xaml
const window = new ui.Window()
window.Title = 'XplatShortcuts'
const box = new ui.Controls.StackPanel()
const button = new ui.Controls.Button()
button.Content = 'Shortcut target'
const editor = new ui.Controls.TextBox()
box.Children.Append(button)
box.Children.Append(editor)
window.Content = box
window.Activate()
setTimeout(() => {
	try {
		let observed = 0
		const releaseObserver = subscribeNativeEvent(
			box,
			'PreviewKeyDown',
			() => observed++,
			ui.UIElement.PreviewKeyDownEvent,
			(callback) => new ui.Input.KeyEventHandler(callback),
		)
		const shortcuts = createShortcuts({ target: box })
		const calls = []
		let recording
		shortcuts.setContext('editor.ready', true)
		shortcuts.bind({
			combo: 'Mod+KeyK',
			when: 'editor.ready',
			preventDefault: true,
			handler() {
				calls.push('palette')
				console.log('SHORTCUT palette')
			},
		})
		shortcuts.bind({ sequence: 'g i', handler: () => calls.push('sequence') })
		shortcuts.bind({ combo: 'x', handler: () => calls.push('plain') })
		shortcuts.bind({ combo: 'F3', handler: () => editor.Focus(ui.FocusState.Programmatic) })
		shortcuts.bindWithin(editor, {
			combo: 'z',
			editablePolicy: 'allow-in-editable',
			preventDefault: true,
			handler: () => calls.push('prevented'),
		})
		shortcuts.bind({
			combo: 'F2',
			handler() {
				shortcuts.record({ timeout: 350, consumeEvents: true }).finished.then((result) => {
					recording = result.expression
					console.log('SHORTCUT recording ' + recording)
				})
			},
		})
		shortcuts.bind({
			combo: 'F12',
			editablePolicy: 'allow-in-editable',
			handler() {
				const result = { calls, text: editor.Text, recording, observed }
				const passed =
					calls.join(',') === 'palette,sequence,prevented' &&
					editor.Text === 'x' &&
					recording === 'Ctrl+Shift+x' &&
					observed > 0
				console.log(
					(passed ? 'SHORTCUTS_WINDOWS_OK ' : 'SHORTCUTS_WINDOWS_FAIL ') + JSON.stringify(result),
				)
				shortcuts.dispose()
				releaseObserver()
				button.Focus(ui.FocusState.Programmatic)
			},
		})
		button.Focus(ui.FocusState.Programmatic)
		console.log('SHORTCUT READY')
	} catch (error) {
		console.log('SHORTCUTS_WINDOWS_FAIL ' + String(error))
	}
}, 500)
