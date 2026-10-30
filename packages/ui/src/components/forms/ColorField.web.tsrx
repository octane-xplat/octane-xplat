/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useRef, useState } from 'octane'
import type { ColorFieldProps } from '../../props'
import { Text } from '../content/Text'
import { TextInput } from './TextInput'
import { normalizeHex } from '../../theme/color'
import { useColorState } from '../../theme/color-state'

/** Hex text field — keeps a draft while editing; commits on submit/blur:
 *  valid input fires onChange + onChangeEnd, invalid restores the value. */
export function ColorField(props: ColorFieldProps): JSX.Element {
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

	return (
		<div
			className={['vx-color-field', props.className]}
			style={typeof props.style === 'object' && props.style !== null ? props.style : undefined}
		>
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
		</div>
	)
}
