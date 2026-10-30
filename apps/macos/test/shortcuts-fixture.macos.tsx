/** @jsxImportSource @octane-xplat/jsx */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { host } from '../../../packages/shortcuts/src/host.macos.ts'
import { createShortcuts } from '../../../packages/shortcuts/src/index.macos.ts'

function Content() {
	return (
		<rootlayout id="shortcuts-boundary">
			<textfield id="shortcuts-editor" />
		</rootlayout>
	)
}

const app = NSApplication.sharedApplication
app.setActivationPolicy(0)
const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{ origin: { x: 0, y: 0 }, size: { width: 400, height: 200 } },
	15,
	2,
	false,
)
window.releasedWhenClosed = false
window.title = 'XplatShortcuts'
app.finishLaunching()
window.makeKeyAndOrderFront(null)
const root = createMacOSRoot(window.contentView)
root.render(Content, {})
setTimeout(async () => {
	let shortcuts
	try {
		const target = root.__macosDebug.findId('shortcuts-boundary')
		const editor = root.__macosDebug.findId('shortcuts-editor')
		const check = (value, message) => {
			if (!value) {
				throw new Error(message)
			}
		}
		check(target && editor, 'renderer views missing')
		check(!host.isEditableTarget(NSButton.new()), 'non-text controls remain shortcut targets')
		shortcuts = createShortcuts({ target })
		const calls = []
		shortcuts.setContext('editor.ready', true)
		shortcuts.bindWithin(editor, {
			combo: 'Mod+KeyK',
			when: 'editor.ready',
			editablePolicy: 'allow-in-editable',
			preventDefault: true,
			handler: () => calls.push('palette'),
		})
		shortcuts.bind({
			sequence: 'g i',
			editablePolicy: 'allow-in-editable',
			handler: () => calls.push('sequence'),
		})
		shortcuts.bind({ combo: 'x', handler: () => calls.push('plain') })
		const pause = () => new Promise((resolve) => setTimeout(resolve, 100))
		const send = (code, chars, flags = 0, up = false) => {
			const event =
				NSEvent.keyEventWithTypeLocationModifierFlagsTimestampWindowNumberContextCharactersCharactersIgnoringModifiersIsARepeatKeyCode(
					up ? 11 : 10,
					{ x: 0, y: 0 },
					flags,
					0,
					window.windowNumber,
					null,
					chars,
					chars,
					false,
					code,
				)
			app.postEventAtStart(event, false)
		}
		check(window.makeFirstResponder(editor), 'editor focus')
		app.activateIgnoringOtherApps(true)
		send(40, 'k', 1 << 20)
		await pause()
		check(String(editor.stringValue) === '', 'native default prevention')
		send(5, 'g')
		await pause()
		send(34, 'i')
		await pause()
		editor.stringValue = ''
		send(7, 'x')
		await pause()
		check(
			calls.join(',') === 'palette,sequence',
			'matching, sequence and editable policy: ' + calls,
		)
		check(String(editor.stringValue) === 'x', 'native editable text')
		const recording = shortcuts.record({ timeout: 250, consumeEvents: true })
		send(7, 'x', (1 << 20) | (1 << 17))
		await pause()
		send(7, 'x', (1 << 20) | (1 << 17), true)
		check((await recording.finished).expression === 'Meta+Shift+x', 'recording')
		check(String(editor.stringValue) === 'x', 'recording consumption')
		shortcuts.dispose()
		send(40, 'k', 1 << 20)
		await pause()
		check(calls.length === 2, 'disposed callback')
		console.log(
			'SHORTCUTS_APPKIT_OK native queue, renderer lease, Mod, when, boundary, sequence, editable text, recording, disposal',
		)
	} catch (error) {
		console.error('SHORTCUTS_APPKIT_FAIL ' + String(error))
	} finally {
		shortcuts?.dispose()
		root.unmount()
		window.close()
		__xplatStopHost()
	}
}, 100)
