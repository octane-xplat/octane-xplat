// Port of upstream Text/TextHeadingLevels.tsx (Astryx 0.6.4, MIT).
import { Heading, Stack } from '@octane-xplat/ui'

const LEVELS = [1, 2, 3, 4, 5, 6] as const

export function TextHeadingLevels() @{
	return (
		<Stack direction="vertical" gap={3}>
			{LEVELS.map((level) => (
				<Heading key={level} level={level}>
					Heading {level}
				</Heading>
			))}
		</Stack>
	)
}
