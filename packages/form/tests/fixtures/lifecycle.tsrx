import { useState } from 'octane'
// Keep the dev probe's module graph bounded; the public example uses the UI barrel.
import { Button } from '../../../ui/src/components/actions/Button.tsrx'
import { Checkbox as CheckboxInput } from '../../../ui/src/components/forms/Checkbox.tsrx'
import { TextInput } from '../../../ui/src/components/forms/TextInput.tsrx'
import { Text } from '../../../ui/src/components/content/Text.tsrx'
import { VStack } from '../../../ui/src/components/layout/VStack.tsrx'
import { useField, useForm, useFormStore } from '../../src/index'
import type { ProbeContext } from '../../../../tools/probe/context'

function useFixtureForm(saved: (value: string) => void) {
  return useForm({
    defaultValues: { name: '', enabled: false, note: '' },
    onSubmit: ({ value }) => {
      saved(value.name + ':' + value.enabled)
    },
  })
}

type FixtureForm = ReturnType<typeof useFixtureForm>

function Name(props: { form: FixtureForm }) @{
  const field = useField({
    form: props.form,
    name: 'name',
    validators: { onBlur: ({ value }) => (value ? undefined : 'Required') },
  })

  <VStack>
    <TextInput
      id="form-name"
      label="Name"
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
    />
    <Text id="form-value">{field.state.value}</Text>
    <Text id="form-error">{field.state.meta.errors.join(',')}</Text>
    <Button id="form-blur" label="Validate" clickAction={field.handleBlur} />
  </VStack>
}

function Note(props: { form: FixtureForm }) @{
  const field = useField({ form: props.form, name: 'note' })

  <TextInput label="Note" value={field.state.value} onChange={field.handleChange} />
}

export default function FormLifecycle() @{
  const [saved, setSaved] = useState('none')
  const [show, setShow] = useState(false)
  const [released, setReleased] = useState('pending')
  const form = useFixtureForm(setSaved)
  const enabled = useField({ form, name: 'enabled' })
  const dirty = useFormStore(form.store, (state) => state.isDirty)

  <VStack>
    <Name form={form} />
    <CheckboxInput label="Enabled" value={enabled.state.value} onChange={enabled.handleChange} />
    <Button
      id="form-toggle"
      label="Toggle"
      clickAction={() => enabled.handleChange(!enabled.state.value)}
    />
    <Button id="form-submit" label="Submit" clickAction={() => form.handleSubmit()} />
    <Button id="form-reset" label="Reset" clickAction={() => form.reset()} />
    <Button id="form-note" label="Toggle note" clickAction={() => setShow(!show)} />
    @if (show) {
      <Note form={form} />
    }
    <Button
      id="form-check"
      label="Check release"
      clickAction={() => setReleased(form.getFieldInfo('note').instance ? 'mounted' : 'released')}
    />
    <Text id="form-saved">{saved}</Text>
    <Text id="form-dirty">{String(dirty)}</Text>
    <Text id="form-release">{released}</Text>
  </VStack>
}

export async function run(ctx: ProbeContext) {
  await ctx.waitFor(() => ctx.find('form-blur'))
  await ctx.press('form-blur')
  await ctx.waitFor(() => ctx.inspect('form-error').text === 'Required')
  ctx.assert('blur validation', ctx.inspect('form-error').text, 'Required')
  await ctx.press('form-submit')
  ctx.assert('invalid submit blocked', ctx.inspect('form-saved').text, 'none')
  await ctx.setText('form-name', 'Ada')
  await ctx.press('form-blur')
  await ctx.waitFor(() => ctx.inspect('form-value').text === 'Ada')
  ctx.assert('retained child updates', ctx.inspect('form-value').text, 'Ada')
  await ctx.press('form-toggle')
  await ctx.press('form-submit')
  await ctx.waitFor(() => ctx.inspect('form-saved').text === 'Ada:true')
  ctx.assert('submitted values', ctx.inspect('form-saved').text, 'Ada:true')
  await ctx.press('form-reset')
  await ctx.waitFor(() => ctx.inspect('form-dirty').text === 'false')
  ctx.assert('reset name', ctx.inspect('form-value').text ?? '', '')
  await ctx.press('form-note')
  await ctx.press('form-check')
  await ctx.waitFor(() => ctx.inspect('form-release').text === 'mounted')
  await ctx.press('form-note')
  await ctx.press('form-check')
  await ctx.waitFor(() => ctx.inspect('form-release').text === 'released')
  ctx.assert('conditional field cleanup', ctx.inspect('form-release').text, 'released')
}
