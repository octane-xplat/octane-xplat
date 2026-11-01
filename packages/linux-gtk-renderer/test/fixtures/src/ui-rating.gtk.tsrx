/** @jsxImportSource @octane-xplat/jsx */
import { View, FormLayout, Field, Pressable, Text, IconRegistryProvider, createIconRegistry, InputRating } from '@octane-xplat/ui'
import type { InputRatingProps } from '@octane-xplat/ui'

const left = createIconRegistry()
left.registerIcon('rating-local', { text: '+' })
const right = createIconRegistry()
right.registerIcon('rating-local', { svg: 'M0 0h12v12H0z', viewBox: '0 0 12 12' })
right.registerIcon('☆', { text: 'R' })

export function RatingScene(props: InputRatingProps & { iconVersion?: number }) @{
	<View style={{ width: 320, height: 400 }}>
		<IconRegistryProvider value={props.iconVersion === 2 ? right : left}>
		<FormLayout defaultOptionality="required">
			<InputRating {...props} id="rating-control" />
		</FormLayout>
		</IconRegistryProvider>
		<Pressable className="rating-after" accessibilityRole="button"><Text>After</Text></Pressable>
	</View>
}
export function RatingContextScene(props: InputRatingProps) @{
	<View style={{ width: 320, height: 400 }}>
		<Field label="Parent rating" width={280} isGroupLabel isReadOnly isRequired size="sm">
			<InputRating {...props} />
		</Field>
	</View>
}
