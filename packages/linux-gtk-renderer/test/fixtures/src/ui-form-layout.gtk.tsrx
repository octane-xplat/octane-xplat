/** @jsxImportSource @octane-xplat/jsx */
import { View, TextInput, FormLayout, Field } from '@octane-xplat/ui'
import type { FormLayoutProps, TextInputHandle } from '@octane-xplat/ui'
export const formRef: { current: any } = { current: null }
export const handles: Array<TextInputHandle | null> = []
export function FormScene(props: Pick<FormLayoutProps, 'direction' | 'defaultOptionality'> & { count: number; optionalLast?: boolean }) @{
	<View style={{ width: 620, height: 480 }}>
		<FormLayout direction={props.direction} defaultOptionality={props.defaultOptionality}
			ref={formRef} style={{ width: 600, height: 360, gap: 16 }}>
			{Array.from({ length: props.count }, (_, index) => (
				<Field key={index} id={'field-' + index} inputID={'control-' + index}
					label={'Field ' + index} description={'Description ' + index}
					status={{ type: 'error', message: 'Check ' + index }} isOptional={props.optionalLast && index === props.count - 1}>
					<TextInput id={'control-' + index} defaultValue={'Value ' + index}
						ref={(handle) => { handles[index] = handle }} />
				</Field>
			))}
		</FormLayout>
	</View>
}
