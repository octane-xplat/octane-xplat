// Port of upstream FieldStatus/FieldStatusBasic.tsx (Astryx 0.6.4, MIT).
import { FieldStatus, VStack } from '@octane-xplat/ui'

export function FieldStatusBasic() @{
	<VStack gap={4}>
		<FieldStatus type="error" message="This field is required" variant="detached" />
		<FieldStatus type="success" message="Your changes have been saved" variant="detached" />
	</VStack>
}
