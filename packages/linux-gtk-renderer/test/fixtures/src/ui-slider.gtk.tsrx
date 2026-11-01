/** @jsxImportSource @octane-xplat/jsx */
import { View, FormLayout, Field, Pressable, Text, Slider } from '@octane-xplat/ui'
import type { SliderProps } from '@octane-xplat/ui'

export function SliderScene(props: SliderProps) @{
  <View style={{ width: 320, height: 400 }}>
    <FormLayout defaultOptionality="required">
      <Slider {...props} id="slider-control" />
    </FormLayout>
    <Pressable className="slider-after" accessibilityRole="button"><Text>After</Text></Pressable>
  </View>
}
export function SliderContextScene(props: SliderProps) @{
  <View style={{ width: 320, height: 400 }}>
    <Field label="Parent level" width={280} isReadOnly isRequired size="sm">
      <Slider {...props} />
    </Field>
  </View>
}
