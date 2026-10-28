// Port of upstream FieldLabel/FieldLabelBasic.tsx (Astryx 0.6.4, MIT).
import { FieldLabel, VStack } from '@octane-xplat/ui'

export function FieldLabelBasic() @{
	<VStack gap={4}>
		<FieldLabel label="Email address" inputID="email-input" isRequired />
		<FieldLabel
			label="Phone number"
			inputID="phone-input"
			isOptional
			description="Include country code for international numbers"
		/>
	</VStack>
}
