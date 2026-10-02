import { createRoot, useState } from 'octane';
import { BottomSheet, CommandPalette, Overlay, Pressable, TextArea, TextInput } from '@octane-xplat/ui';
import { motion, Presence } from '../../../packages/motion/src/index.web';

function InputReadiness() @{
	const [count, setCount] = useState(0);
	const [value, setValue] = useState('hello');
	const [changes, setChanges] = useState(0);
	const [sheet, setSheet] = useState(false);
	const [overlay, setOverlay] = useState(false);
	const [commandPalette, setCommandPalette] = useState(false);
	const [present, setPresent] = useState(true);
	const change = (text: string) => { setChanges(changes + 1); setValue(text); };

	<>
		<Pressable id="action" onPress={() => setCount(count + 1)}>Save</Pressable>
		<Pressable id="disabled" disabled onPress={() => setCount(count + 1)}>Disabled</Pressable>
		<output id="count">{count}</output>
		<TextInput id="input" value={value} onChange={change} />
		<TextArea id="area" value={value} onChange={change} />
		<output id="changes">{changes}</output>
		<button id="write" onClick={() => setValue('replacement')}>Write controlled value</button>
		<button id="open-sheet" onClick={() => setSheet(true)}>Open sheet</button>
		<button id="open-overlay" onClick={() => setOverlay(true)}>Open overlay</button>
		<button id="open-command-palette" onClick={() => setCommandPalette(true)}>Open command palette</button>
		<BottomSheet isOpen={sheet} onOpenChange={(open) => setSheet(open)} label="Input sheet">
			<button id="sheet-first">First</button><button id="sheet-nested" onClick={() => setOverlay(true)}>Nested overlay</button><button id="sheet-last" onClick={() => setSheet(false)}>Close</button>
		</BottomSheet>
		<Overlay open={overlay} shadeCover accessibilityLabel="Input overlay" onDismiss={() => setOverlay(false)}>
			<button id="overlay-first">First</button><button id="overlay-last" onClick={() => setOverlay(false)}>Close</button>
		</Overlay>
		<CommandPalette open={commandPalette} onOpenChange={setCommandPalette} items={[]} />
		<button id="exit" onClick={() => setPresent(false)}>Exit</button>
		<button id="reverse" onClick={() => setPresent(true)}>Reverse</button>
		<Presence present={present}>
			<motion.View exit={{ opacity: 0 }} transition={{ duration: 5 }}>
				<TextInput id="presence-input" value="retained" />
				<Pressable id="presence-action" onPress={() => setCount(count + 1)}>Retained action</Pressable>
			</motion.View>
		</Presence>
	</>
}

createRoot(document.getElementById('root')!).render(<InputReadiness />);
