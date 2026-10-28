// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { FormField } from './FormField.web.tsrx'

describe('FormField (web)', () => {
	it('re-renders a labelled field with changed children', () => {
		const el = document.createElement('div')
		const root = createRoot(el)
		const render = (value: string) =>
			root.render(
				<FormField
					label="Name"
					description="Shown publicly"
					status={{ type: 'error', message: 'Required' }}
				>
					<input className="probe" value={value} />
				</FormField>,
			)

		act(() => render('Ada'))
		act(() => render('Bo'))
		expect((el.querySelector('.probe') as HTMLInputElement).value).toBe('Bo')
		expect(el.querySelector('.vx-field-label')?.textContent).toBe('Name')
	})
})
