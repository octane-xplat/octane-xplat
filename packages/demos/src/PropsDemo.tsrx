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

	<View className="vx-app flex-1 gap-4 props-demo">
		<Text className="text-xl font-bold">Primitive props</Text>
		<TextInput className="input" value={secret} onChange={setSecret} secure placeholder="Password" returnKeyType="done" onSubmit={() => setSubmitState('Password submitted')} placeholderTextColor="#64748b" />
		<TextInput className="input" value={value} onChange={setValue} keyboardType="email" editable={editable} placeholder="Email address" onFocus={() => setFocusState('focused')} onBlur={() => setFocusState('blurred')} onSubmit={() => setSubmitState('Email submitted')} />
		<Row className="gap-2 items-center">
			<Pressable className="btn bg-primary" onPress={() => setEditable(!editable)}>
				<Text className="text-onprimary">{editable ? 'Disable input' : 'Enable input'}</Text>
			</Pressable>
			<Text>{'Input is ' + (editable ? 'editable' : 'read only')}</Text>
		</Row>
		<Text>{'Focus: ' + focusState + (submitState ? ' · ' + submitState : '')}</Text>
		<Pressable
			className="btn bg-primary props-hit-slop"
			hitSlop={12}
			onPress={() => setPressState('Pressed')}
			onPressIn={() => setPressState('Press in')}
			onPressOut={() => setPressState('Press out')}
			onDoublePress={() => setPressState('Double pressed')}
		>
			<Text className="text-onprimary">Press, hold, or double tap</Text>
		</Pressable>
		<Text>{pressState}</Text>
		<Text className="props-clamp" numberOfLines={2} selectable ellipsize>
			This longer sample exercises line clamping, selectable text, and single-line ellipsis behavior across the platform leaves.
		</Text>
		<Pressable
			className="btn bg-primary"
			accessibilityLabel="Save profile"
			accessibilityHint="Saves the current profile details"
			accessibilityValue="Ready to save"
			accessibilityState={{ selected: true, busy: false, expanded: false }}
			accessibilityLiveRegion="polite"
			onPress={() => setSubmitState('Profile saved')}
		>
			<Text className="text-onprimary">Accessible save action</Text>
		</Pressable>
	</View>
}
