import { useState } from 'octane'
import { defineStory } from '@octane-xplat/workshop'

function Inputs(props: { disabled: boolean }) {
	const [checked, setChecked] = useState(false)
	const [text, setText] = useState('initial')
	return (
		<section>
			<label>
				Example toggle{' '}
				<input
					aria-label="Example toggle"
					type="checkbox"
					checked={checked}
					disabled={props.disabled}
					onChange={(e: any) => setChecked(e.target.checked)}
				/>
			</label>
			<label>
				Example text{' '}
				<input
					aria-label="Example text"
					value={text}
					disabled={props.disabled}
					onInput={(e: any) => setText(e.target.value)}
				/>
			</label>
			<p data-input-state>
				{checked ? 'on' : 'off'}: {text}
			</p>
		</section>
	)
}

export const Editable = defineStory<{ disabled: boolean }>({
	id: 'inputs/editable',
	title: 'Examples / Editable inputs',
	targets: ['web'],
	component: Inputs,
	args: { disabled: false },
	controls: { disabled: { type: 'boolean' } },
})
