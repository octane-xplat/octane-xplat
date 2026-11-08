import { describe, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  defineUniversalComponent,
  flushUniversalSync,
  universalComponent,
  universalPlan,
  universalValue,
} from 'octane/universal/native'

import { FormApi, useField, useForm, useFormStore } from './index'

const plan = universalPlan('object', { kind: 'host', type: 'label', bindings: [['text', 0]] })
const label = (text: string) => universalValue(plan, [text])

describe('form subscriptions on the universal runtime', () => {
  it('updates a retained child with stable props and unregisters on removal', () => {
    const form = new FormApi({ defaultValues: { name: '' } })
    const Child = defineUniversalComponent('object', () => {
      const field = useField({
        form,
        name: 'name',
        validators: { onBlur: ({ value }) => (value ? undefined : 'Required') },
      })

      return label(field.state.value + ':' + field.state.meta.errors.join(','))
    })

    const Parent = defineUniversalComponent('object', (props: { show: boolean }) => {
      useFormStore(form.store, (state) => state.isDirty)
      return props.show ? universalComponent('object', Child, { stable: true }) : label('hidden')
    })

    const container = createObjectContainer()
    const root = createUniversalRoot(container, createObjectDriver())

    try {
      root.render(Parent, { show: true })
      expect(container.children[0].props.text).toBe(':')
      flushUniversalSync(() => form.getFieldInfo('name').instance!.handleBlur())
      expect(container.children[0].props.text).toBe(':Required')
      flushUniversalSync(() => form.setFieldValue('name', 'Ada'))
      expect(container.children[0].props.text).toBe('Ada:Required')
      flushUniversalSync(() => form.getFieldInfo('name').instance!.handleBlur())
      expect(container.children[0].props.text).toBe('Ada:')
      flushUniversalSync(() => form.reset())
      expect(container.children[0].props.text).toBe(':')
      root.render(Parent, { show: false })
      expect(form.getFieldInfo('name').instance).toBeNull()
    } finally {
      root.unmount()
    }
  })

  it('owns form lifecycle and updates callbacks before submission', async () => {
    const mount = vi.fn(),
      save = vi.fn()

    let submit: () => Promise<void> = async () => {}
    const Screen = defineUniversalComponent('object', () => {
      const form = useForm({
        defaultValues: { enabled: false },
        listeners: { onMount: mount },
        onSubmit: ({ value }) => {
          save(value)
        },
      })

      const field = useField({ form, name: 'enabled' })

      submit = form.handleSubmit
      return label(String(field.state.value))
    })

    const container = createObjectContainer()
    const root = createUniversalRoot(container, createObjectDriver())

    try {
      root.render(Screen, {})
      expect(mount).toHaveBeenCalledTimes(1)
      await submit()
      expect(save).toHaveBeenCalledWith({ enabled: false })
    } finally {
      root.unmount()
    }
  })
})
