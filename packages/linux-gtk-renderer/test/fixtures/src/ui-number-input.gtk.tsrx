/** @jsxImportSource @octane-xplat/jsx */
import { View, FormLayout, Field, SizeProvider } from '@octane-xplat/ui'
import { NumberInput } from '@octane-xplat/ui'
import type { InputNumberProps } from '../../../../ui/src/props'

export function NumberScene(props: InputNumberProps) @{
  <View style={{ width: 320, height: 400 }}>
    <FormLayout defaultOptionality="required">
      <NumberInput {...props} id="number-control" />
    </FormLayout>
  </View>
}
export function NumberContextScene(props: InputNumberProps) @{
  <SizeProvider size="lg">
    <View style={{ width: 320, height: 400 }}>
      <Field label="Parent amount" description="Parent help" width={280} isReadOnly isRequired size="sm">
        <NumberInput {...props} id="number-control" />
      </Field>
    </View>
  </SizeProvider>
}
