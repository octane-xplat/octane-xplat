// Port of upstream textarea-counter page (Astryx 0.6.4, MIT).
// Adapted: upstream composes FieldStatus + custom counter markup with
// StyleX; the Xplat port uses TextArea maxLength (live counter) plus a
// FieldStatus row and a layout variant section.
import { TextArea, FieldStatus, Text, Heading, Stack, Card } from '@octane-xplat/ui'
import { useState } from 'octane'

const LIMIT = 140

export function TextareaCounterPage() @{
	const [value, setValue] = useState('Shipping the new dashboard today. Feedback welcome — this is a first pass and there is more to come.')
	const [overlay, setOverlay] = useState('')
	const over = value.length > LIMIT
	const remaining = LIMIT - value.length

	<Stack direction="vertical" gap={5} padding={6} style={{maxWidth: 560}}>
		<Heading level={1}>Textarea counter</Heading>
		<Text className="sb-type-body">A bounded composer with a live character count and a status row when the draft runs over the limit.</Text>
		<Card variant="outlined" padding={4}>
			<Stack direction="vertical" gap={2}>
				<Text className="sb-type-label">Draft ({`${value.length}/${LIMIT}`})</Text>
				<TextArea label="Draft" isLabelHidden value={value} onChange={setValue} rows={4} maxLength={LIMIT * 2} />
				{over
					? <FieldStatus type="error" message={`${-remaining} characters over the limit`} variant="detached" />
					: <FieldStatus type="success" message={`${remaining} characters remaining`} variant="detached" />}
			</Stack>
		</Card>
		<Card variant="outlined" padding={4}>
			<Stack direction="vertical" gap={2}>
				<Text className="sb-type-label">Overlay variant</Text>
				<TextArea label="Reply" isLabelHidden value={overlay} onChange={setOverlay} rows={3} maxLength={280} placeholder="Write a reply…" />
			</Stack>
		</Card>
	</Stack>
}
