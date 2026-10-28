/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import type { ColorFieldProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Text } from './Text'
import { TextInput } from './TextInput'
import { normalizeHex } from './color'
import { useColorState } from './color-state'

/** Hex text field — keeps a draft while editing; commits on submit/blur:
 *  valid input fires onChange + onChangeEnd, invalid restores the value. */
export function ColorField(props: ColorFieldProps) @{
	const color = useColorState(props)
	const draft = useRef<string | null>(null)
	const [, bump] = useState(0)

	const commit = () => {
		const text = draft.current
		draft.current = null
		const parsed = normalizeHex(text ?? '')
		if (parsed) {
			color.setHex(parsed)
			color.end()
		}

		bump((n) => n + 1) // invalid input: drop the draft, restore current hex
	}

	<masonview className={cx('vx-color-field', props.className)} style={props.style}>
		{props.label ? <Text className="vx-color-field-label">{props.label}</Text> : null}
		<TextInput
			id={props.id}
			testID={props.testID}
			className="vx-color-field-input"
			value={draft.current ?? color.hex}
			isDisabled={props.isDisabled}
			onChange={(v) => {
				draft.current = v
				bump((n) => n + 1)
			}}
			onSubmit={commit}
			onBlur={commit}
			accessibilityLabel={props.accessibilityLabel ?? 'color'}
		/>
	</masonview>
}
