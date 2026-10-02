/** @jsxImportSource @nativescript-community/octane */
import { useRef, useState } from 'octane';
import { TextInput } from '../../../packages/ui/src/TextInput.tsrx';
import { TextArea } from '../../../packages/ui/src/TextArea.tsrx';
import { KeyboardAvoiding } from '../../../packages/ui/src/KeyboardAvoiding.mobile.tsrx';

/** Mount in a dedicated native root. Baseline write intentionally bypasses the
 * controlled-write helper to reproduce the previous echo path. No IME/AT pass
 * should be inferred from these actions or their JSON diagnostics. */
export function InputProbe() @{
	const [value, setValue] = useState('hello');
	const [changes, setChanges] = useState(0);
	const input = useRef<any>(null);
	const dump = (label: string) => {
		const view = input.current?.native;
		console.log('INPUT_PROBE ' + JSON.stringify({
			label, text: view?.text, changes,
			selectionStart: view?.android?.getSelectionStart?.(),
			selectionEnd: view?.android?.getSelectionEnd?.(),
			androidFocused: view?.android?.hasFocus?.(),
			iosFocused: view?.ios?.isFirstResponder,
			iosMarked: !!view?.ios?.markedTextRange,
		}));
	};

	const change = (text: string) => {
		console.log('INPUT_CHANGE ' + JSON.stringify({ text }));
		setChanges((count) => count + 1);
		setValue(text);
	};

	const write = () => {
		const before = changes;
		setValue('replacement');
		setTimeout(() => dump('controlled write; previous changes=' + before), 200);
	};

	<KeyboardAvoiding>
		<flexboxlayout flexDirection="column" style={{ padding: 20, gap: 10 }}>
			<label text="Input readiness probe" fontSize={24} />
			<label text={'Changes: ' + changes} />
			<TextInput
				id="ready-input" value={value} onChange={change}
				ref={(handle: any) => { input.current = handle; setTimeout(() => dump('bound'), 0); }}
				onFocus={() => dump('focus')} onBlur={() => dump('blur')}
				ios={{ accessibilityLabel: 'Probe text' }} android={{ accessibilityLabel: 'Probe text' }}
			/>
			<TextArea id="ready-area" value={value} onChange={change} rows={2} />
			<button text="Focus input" onTap={() => input.current.focus()} />
			<button text="Select middle" onTap={() => { input.current.native.android?.setSelection?.(2, 4); dump('selected middle'); }} />
			<button text="Controlled write" onTap={write} />
			<button text="Baseline write" onTap={() => input.current.native.text = 'baseline'} />
			<button text="Blur input" onTap={() => { input.current.blur(); setTimeout(() => dump('after blur'), 300); }} />
			<button text="Reset input" onTap={() => { setValue('hello'); setChanges(0); }} />
			<button text="Inspect input" onTap={() => dump('inspect')} />
		</flexboxlayout>
	</KeyboardAvoiding>
}
