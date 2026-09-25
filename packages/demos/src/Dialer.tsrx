import { useState } from 'octane';
import { View, Row, Text, Pressable } from '@octane-xplat/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
const MAX = 15;

/** dialer — 12-key pad + digit accumulation.
 *  Proves: rapid onPress→state→commit throughput (tap bursts), a fixed-size
 *  wrap grid of identical leaves, and string-state editing (append/backspace).
 *  The Call button is a probe log only — no telephony seam yet. */
export function Dialer() @{
	const [digits, setDigits] = useState('');

	const press = (k: string) => {
		if (digits.length >= MAX) return;
		setDigits(digits + k);
	};

	<View className="vx-app flex-1 gap-4 items-center">
		<Text className="dialer-display">{digits || 'Enter number'}</Text>
		<View className="dialer-grid">
			@for (const k of KEYS; key k) {
				<Pressable id={'key-' + k} onPress={() => press(k)} className="dialer-key">
					<Text className="dialer-key-label">{k}</Text>
				</Pressable>
			}
		</View>
		<Row className="gap-4">
			<Pressable
				id="dial-back"
				onPress={() => setDigits(digits.slice(0, -1))}
				className="btn btn-secondary"
			>
				<Text>{'⌫'}</Text>
			</Pressable>
			<Pressable
				id="dial-call"
				onPress={() => console.log('[probe] dial ' + digits)}
				className="btn bg-primary"
			>
				<Text className="text-onprimary">Call</Text>
			</Pressable>
		</Row>
	</View>
}
