/** @jsxImportSource @octane-xplat/jsx */
import { View, FormLayout, Field, Text, Switch } from '@octane-xplat/ui'
import { CheckboxList } from '@octane-xplat/ui'
import { CheckboxListItem } from '@octane-xplat/ui'
import type { CheckboxGroupProps, CheckboxListItemProps, SwitchProps } from '../../../../ui/src/props'

const options = [
  { value: 'a', label: 'Alpha', description: 'Alpha help', endContent: <Text className="checkbox-test-end">Free</Text> },
  { value: 'b', label: 'Beta', isDisabled: true },
  { value: 'c', label: 'Gamma' },
]
export function CheckboxListScene(props: CheckboxGroupProps & {
  parts?: boolean; reverse?: boolean; hideMiddle?: boolean; empty?: boolean; longDescription?: boolean
}) @{
  const available = props.empty ? [] : options.filter(option => !props.hideMiddle || option.value !== 'b')
  const ordered = props.reverse ? [...available].reverse() : available
  const items = ordered.map(option => ({ ...option, description: option.value === 'a' && props.longDescription
    ? 'A long explanation of this optional feature that must wrap inside the available row without pushing the trailing price beyond the field edge.'
    : option.description }))

  <View style={{ width: 320, height: 400 }}>
    <FormLayout defaultOptionality="required">
      <CheckboxList {...props} id="checkbox-group" options={props.parts ? undefined : items}>
        {props.parts ? (
          items.map(item => <CheckboxListItem key={item.value} {...item} />)
        ) : null}
      </CheckboxList>
    </FormLayout>
  </View>
}
export function CheckboxListContextScene(props: CheckboxGroupProps) @{
  <View style={{ width: 320, height: 400 }}>
    <Field label="Parent features" description="Parent help" width={280} isGroupLabel isReadOnly isRequired size="sm">
      <CheckboxList {...props} options={options} />
    </Field>
  </View>
}
export function CheckboxStandaloneScene(props: CheckboxListItemProps) @{
  <View style={{ width: 280, height: 120 }}>
    <CheckboxListItem {...props} label="Select all" description="All features" />
  </View>
}

export function SwitchFocusScene(props: Pick<SwitchProps, 'isReadOnly' | 'isDisabled' | 'onChange'>) @{
  <View style={{ width: 280, height: 160 }}>
    <CheckboxListItem label="Focus origin" isChecked={false} />
    <Switch {...props} label="Focus switch" value={false} />
  </View>
}
