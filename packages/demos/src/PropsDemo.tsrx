import { useState } from 'octane';
import { View, Row, Text, TextInput, Pressable } from '@octane-xplat/ui';

/** Public prop parity probe for shipped primitives. */
export function PropsDemo() @{
	const [secret, setSecret] = useState('octane-xplat');
	const [value, setValue] = useState('');
	const [editable, setEditable] = useState(true);
	const [focusState, setFocusState] = useState('unfocused');
	const [pressState, setPressState] = useState('Try the press callbacks');
	const [submitState, setSubmitState] = useState('');

	<View className="vx-app flex-1 gap-6 props-demo">
		<Text className="text-xl font-semibold">Primitive props</Text>
		<View className="sink-section">
			<Text className="section-label">Fields</Text>
			<TextInput className="input" value={secret} onChange={setSecret} secure placeholder="Password" returnKeyType="done" onSubmit={() => setSubmitState('Password submitted')} placeholderTextColor="#64748b" />
			<TextInput className="input" value={value} onChange={setValue} keyboardType="email" editable={editable} placeholder="Email address" onFocus={() => setFocusState('focused')} onBlur={() => setFocusState('blurred')} onSubmit={() => setSubmitState('Email submitted')} />
			<Row className="gap-3 items-center">
				<Pressable className="btn btn-secondary" onPress={() => setEditable(!editable)}>
					<Text>{editable ? 'Disable input' : 'Enable input'}</Text>
				</Pressable>
				<Text className="text-sm text-muted">{'Input is ' + (editable ? 'editable' : 'read only')}</Text>
			</Row>
			<Text className="text-sm text-muted">{'Focus: ' + focusState + (submitState ? ' · ' + submitState : '')}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Press callbacks</Text>
			<Pressable
				className="btn btn-secondary props-hit-slop"
				hitSlop={12}
				onPress={() => setPressState('Pressed')}
				onPressIn={() => setPressState('Press in')}
				onPressOut={() => setPressState('Press out')}
				onDoublePress={() => setPressState('Double pressed')}
			>
				<Text>Press, hold, or double tap</Text>
			</Pressable>
			<Text className="text-sm text-muted">{pressState}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Text clamping</Text>
			<Text className="props-clamp" numberOfLines={2} ellipsize>
				This longer sample exercises line clamping and single-line ellipsis behavior across the platform leaves.
			</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Accessibility</Text>
			<Pressable
				className="btn btn-secondary"
				accessibilityLabel="Save profile"
				accessibilityHint="Saves the current profile details"
				accessibilityValue="Ready to save"
				accessibilityState={{ selected: true }}
				accessibilityLiveRegion="polite"
				onPress={() => setSubmitState('Profile saved')}
			>
				<Text>Accessible save action</Text>
			</Pressable>
		</View>
	</View>
}
