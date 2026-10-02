/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useState } from 'octane'
import { File } from '@nativescript/core/file-system'
import { TextInput } from '../../../packages/ui/src/TextInput'
import { TextArea } from '../../../packages/ui/src/TextArea'
import type { TextInputHandle } from '../../../packages/ui/src/props'

const commandPath = 'C:/Users/octane/dev/input-contract-command.json'
const handles: Record<string, TextInputHandle | null> = {}
const event = (id: string, name: string, value?: string) =>
	console.log('[input-contract] ' + JSON.stringify({ id, event: name, ...(value === undefined ? {} : id === 'secure' ? { length: value.length } : { value }) }))

export function WindowsUICase() @{
	const [ordinary, setOrdinary] = useState('ordinary')
	const [multiline, setMultiline] = useState('first\nsecond')
	const [secure, setSecure] = useState(true)
	const [readonly, setReadonly] = useState(true)
	const [disabled, setDisabled] = useState(true)
	const [name, setName] = useState('Ordinary accessible name')
	const [visible, setVisible] = useState(true)
	useEffect(() => {
		let sequence = ''
		let reading = false
		const timer = setInterval(async () => {
			if (reading || !File.exists(commandPath)) return
			reading = true
			try {
				const command = JSON.parse(await File.fromPath(commandPath).readText())
				if (command.sequence === sequence) return
				sequence = command.sequence
				const handle = handles[command.id]
				switch (command.action) {
					case 'focus': handle?.focus(); break
					case 'blur': handle?.blur(); break
					case 'secure': setSecure(command.value); break
					case 'readonly': setReadonly(command.value); break
					case 'disabled': setDisabled(command.value); break
					case 'name': setName(command.value); break
					case 'visible': setVisible(command.value); break
				}
				console.log('[input-contract-command] ' + JSON.stringify({ sequence, action: command.action, id: command.id, focusState: handle?.native.nativeViewProtected?.FocusState }))
			} catch (error) {
				console.log('[input-contract-error] ' + String(error))
			} finally {
				reading = false
			}
		}, 100)
		return () => { clearInterval(timer); for (const id of Object.keys(handles)) handles[id] = null }
	}, [])
	<stacklayout>
		@if (visible) {
			<TextInput value={ordinary} onChange={(value) => { setOrdinary(value); event('ordinary', 'change', value) }}
				placeholder="Different placeholder" accessibilityLabel={name}
				onFocus={() => event('ordinary', 'focus')} onBlur={() => event('ordinary', 'blur')}
				onSubmit={() => event('ordinary', 'submit')} ref={(handle) => { handles.ordinary = handle }} />
		}
		<TextArea value={multiline} onChange={(value) => { setMultiline(value); event('multiline', 'change', value) }}
			accessibilityLabel="Multiline accessible name" onFocus={() => event('multiline', 'focus')}
			onBlur={() => event('multiline', 'blur')} ref={(handle) => { handles.multiline = handle }} />
		<TextInput value="plain readonly" isReadOnly accessibilityLabel="Readonly accessible name"
			onChange={(value) => event('readonly', 'change', value)} />
		<TextInput value="synthetic-probe" {secure} isReadOnly={readonly} accessibilityLabel="Secure accessible name"
			onChange={(value) => event('secure', 'change', value)} onFocus={() => event('secure', 'focus')}
			onBlur={() => event('secure', 'blur')} ref={(handle) => { handles.secure = handle }} />
		<TextInput value="disabled-value" isDisabled={disabled} accessibilityLabel="Disabled accessible name"
			onChange={(value) => event('disabled', 'change', value)} ref={(handle) => { handles.disabled = handle }} />
		@for (const value of ['initial', 'inherit', 'unset', 'revert']; key value) {
			<TextInput {value} accessibilityLabel={'Literal ' + value} />
		}
	</stacklayout>
}
