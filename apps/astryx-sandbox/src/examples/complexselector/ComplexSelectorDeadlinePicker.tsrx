// Port of upstream ComplexSelector/ComplexSelectorDeadlinePicker.tsx (Astryx 0.6.4, MIT).
import { ComplexSelector, DateInput, Button, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

const DEADLINES = [
	{ id: 'friday', label: 'End of this week', description: 'Friday, 5pm' },
	{ id: 'sprint', label: 'End of sprint', description: 'Next Thursday' },
	{ id: 'quarter', label: 'End of quarter', description: 'March 31' },
	{ id: 'custom', label: 'Custom date', description: 'Pick a specific date' },
]

export function ComplexSelectorDeadlinePicker() @{
	const [deadline, setDeadline] = useState<string>('friday')
	const [customDate, setCustomDate] = useState<import('@octane-xplat/ui').ISODateString | null>(
		null,
	)

	const [error, setError] = useState<string | null>(null)

	const selectedLabel =
		deadline === 'custom' && customDate
			? customDate
			: (DEADLINES.find((d) => d.id === deadline)?.label ?? 'Select deadline')

	<div style={{ width: 480 }}>
		<ComplexSelector
			label="Deadline"
			value={deadline}
			onChange={setDeadline}
			triggerLabel={selectedLabel}
		>
			{({ value, onChange, close }) => (
				<div style={{ padding: 4, minWidth: 320 }}>
					{DEADLINES.map((d) => (
						<div
							key={d.id}
							role="option"
							aria-selected={value === d.id}
							className="vx-menu-item"
							onClick={() => {
								if (d.id !== 'custom') {
									onChange(d.id)
									setError(null)
									close()
								} else {
									onChange('custom')
								}
							}}
						>
							<span className="vx-menu-item-label">
								{d.label}
								<span className="vx-select-description">{d.description}</span>
							</span>
						</div>
					))}
					{value === 'custom' && (
						<div
							style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border, #e5e5e5)' }}
						>
							<DateInput
								label="Custom deadline"
								value={customDate}
								onChange={setCustomDate}
								hasClear
							/>
							{error != null ? <Text type="supporting">{error}</Text> : null}
							<Button
								variant="primary"
								label="Apply"
								clickAction={() => {
									if (!customDate) {
										setError('Please select a date before applying')
										return
									}

									setError(null)
									close()
								}}
							/>
						</div>
					)}
				</div>
			)}
		</ComplexSelector>
	</div>
}
