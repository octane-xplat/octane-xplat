/** @jsxImportSource @octane-xplat/jsx */
import { View, FormLayout, Field, PinInput } from '@octane-xplat/ui'
import type { PinInputProps } from '@octane-xplat/ui'

export function PinScene(props: PinInputProps) @{
  <View style={{ width: 320, height: 400 }}>
    <FormLayout defaultOptionality="required">
      <PinInput {...props} id="pin-group" />
    </FormLayout>
  </View>
}
export function PinContextScene(props: PinInputProps) @{
  <View style={{ width: 320, height: 400 }}>
    <Field label="Parent code" width={280} isGroupLabel isReadOnly isRequired size="sm">
      <PinInput {...props} />
    </Field>
  </View>
}
