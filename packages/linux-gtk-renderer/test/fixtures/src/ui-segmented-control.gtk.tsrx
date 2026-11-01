/** @jsxImportSource @octane-xplat/jsx */
import { View, Field, FormLayout, Text } from '@octane-xplat/ui'
import { SegmentedControl } from '@octane-xplat/ui'
import { SegmentedControlItem } from '@octane-xplat/ui'
import type { SegmentedControlProps, SegmentedControlItemProps } from '../../../../ui/src/props'

const options = [
  { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', isDisabled: true }, { value: 'c', label: 'Gamma' },
]
export function SegmentedScene(props: SegmentedControlProps & {
  parts?: boolean; hidden?: boolean; reverse?: boolean; hideMiddle?: boolean; empty?: boolean; enableMiddle?: boolean; rtl?: boolean
}) @{
  const available = props.empty ? [] : options.filter(option => !props.hideMiddle || option.value !== 'b')
  const items = (props.reverse ? [...available].reverse() : available)
    .map(option => ({ ...option, isDisabled: option.value === 'b' ? !props.enableMiddle : option.isDisabled }))

  <View style={{ width: 320, height: 320, direction: props.rtl ? 'rtl' : 'ltr' }}>
    <textfield id="segment-before" hint="Before segments" />
    <FormLayout defaultOptionality="required">
      <SegmentedControl {...props} id="segmented-group" options={props.parts ? undefined : items}>
        {props.parts ? (
          items.map(item => <SegmentedControlItem key={item.value} {...item}
            icon={item.value === 'c' ? <Text className="segmented-test-icon">G</Text> : undefined}
            isLabelHidden={item.value === 'c' && props.hidden} />)
        ) : null}
      </SegmentedControl>
    </FormLayout>
    <textfield id="segment-after" hint="After segments" />
  </View>
}
export function SegmentedContextScene(props: SegmentedControlProps) @{
  <View style={{ width: 320, height: 320 }}>
    <Field label="Parent mode" width={280} isGroupLabel isReadOnly isRequired size="sm">
      <SegmentedControl {...props} options={options} />
    </Field>
  </View>
}
export function SegmentedStandaloneScene(props: SegmentedControlItemProps) @{
  <View style={{ width: 280, height: 80 }}>
    <SegmentedControlItem {...props} />
  </View>
}
