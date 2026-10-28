// Port of upstream FieldLabel/FieldLabelShowcase.tsx (Astryx 0.6.4, MIT).
import { FieldLabel, VStack, Icon } from '@octane-xplat/ui'

export function FieldLabelShowcase() @{
	<VStack gap={4}>
		<FieldLabel label="Email address" inputID="email-input" isRequired />
		<FieldLabel
			label="Phone number"
			inputID="phone-input"
			isOptional
			description="Include country code for international numbers"
		/>
		<FieldLabel
			label="API key"
			inputID="api-input"
			labelTooltip="Your API key can be found in the developer settings"
			labelIcon={<Icon name="sandbox-lock" size={14} />}
		/>
		<FieldLabel label="Disabled field" inputID="disabled-input" isDisabled />
	</VStack>
}
