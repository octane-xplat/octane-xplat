/** @jsxImportSource @octane-xplat/jsx/dom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { FormApi, useField, useForm, useFormStore } from './index'

const roots: { unmount(): void }[] = []
afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
})

function mount() {
  const host = document.createElement('div')
  const root = createRoot(host)
  roots.push(root)
  return { host, root }
}

// Each test mounts actual compiled Octane hooks and the real TanStack engine.
describe('Octane TanStack Form adapter', () => {
  it('connects text/boolean fields, validates on blur, submits and resets', async () => {
    const saved = vi.fn()
    const form = new FormApi({
      defaultValues: { name: '', enabled: false },
      onSubmit: ({ value }) => saved(value),
    })

    function Screen() {
      const name = useField({
        form,
        name: 'name',
        validators: { onBlur: ({ value }) => (value ? undefined : 'Name required') },
      })

      const enabled = useField({ form, name: 'enabled' })
      const submitting = useFormStore(form.store, (state) => state.isSubmitting)
      return (
        <div>
          <input
            value={name.state.value}
            onInput={(e) => name.handleChange(e.currentTarget.value)}
            onBlur={name.handleBlur}
          />
          <button onClick={() => enabled.handleChange(!enabled.state.value)}>
            {String(enabled.state.value)}
          </button>
          <span>{name.state.meta.errors.join(',')}</span>
          <output>{String(submitting)}</output>
        </div>
      )
    }

    const { host, root } = mount()
    act(() => root.render(<Screen />))
    const input = host.querySelector('input')!
    act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
    expect(host.querySelector('span')?.textContent).toBe('Name required')
    await act(async () => {
      await form.handleSubmit()
    })

    expect(saved).not.toHaveBeenCalled()
    act(() => {
      input.value = 'Ada'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      host.querySelector('button')!.click()
    })

    expect(host.querySelector('span')?.textContent).toBe('')
    await act(async () => {
      await form.handleSubmit()
    })

    expect(saved).toHaveBeenCalledWith({ name: 'Ada', enabled: true })
    act(() => form.reset())
    expect(input.value).toBe('')
    expect(host.querySelector('button')?.textContent).toBe('false')
    expect(form.state.isDirty).toBe(false)
  })

  it('mounts once, updates callbacks, and replaces forms when formId changes', async () => {
    const mounted = vi.fn(),
      first = vi.fn(),
      second = vi.fn()

    const instances: FormApi<
      { name: string },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      unknown
    >[] = []

    function Screen(props: { id: string; save: () => void }) {
      const form = useForm({
        formId: props.id,
        defaultValues: { name: '' },
        listeners: { onMount: mounted },
        onSubmit: props.save,
      })

      instances.push(form)
      return <span>{useFormStore(form.store, (s) => s.values.name)}</span>
    }

    const { root } = mount()
    act(() => root.render(<Screen id="one" save={first} />))
    act(() => root.render(<Screen id="one" save={second} />))
    expect(instances.at(-1)).toBe(instances[0])
    expect(mounted).toHaveBeenCalledTimes(1)
    await act(async () => {
      await instances[0].handleSubmit()
    })

    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
    act(() => root.render(<Screen id="two" save={second} />))
    expect(instances.at(-1)).not.toBe(instances[0])
    expect(mounted).toHaveBeenCalledTimes(2)
  })

  it('replaces renamed fields and unregisters conditional fields', () => {
    const form = new FormApi({ defaultValues: { first: 'A', last: 'B' } })
    function Reader(props: { name: 'first' | 'last' }) {
      const field = useField({ form, name: props.name })
      return <span>{field.state.value}</span>
    }

    function Screen(props: { name: 'first' | 'last'; show: boolean }) {
      return <div>{props.show && <Reader name={props.name} />}</div>
    }

    const { host, root } = mount()
    act(() => root.render(<Screen name="first" show />))
    expect(host.textContent).toBe('A')
    expect(form.getFieldInfo('first').instance).toBeDefined()
    act(() => root.render(<Screen name="last" show />))
    expect(host.textContent).toBe('B')
    expect(form.getFieldInfo('first').instance).toBeNull()
    act(() => root.render(<Screen name="last" show={false} />))
    expect(form.getFieldInfo('last').instance).toBeNull()
    expect(form.state.values.last).toBe('B')
  })

  it('subscribes only to the selected slice and unsubscribes on teardown', () => {
    const form = new FormApi({ defaultValues: { name: '', other: '' } })
    const originalSubscribe = form.store.subscribe.bind(form.store)
    let active = 0
    const subscribe = vi.spyOn(form.store, 'subscribe').mockImplementation((listener) => {
      active++
      const subscription = originalSubscribe(listener)
      return {
        unsubscribe() {
          active--
          subscription.unsubscribe()
        },
      }
    })

    let renders = 0
    function Reader() {
      renders++
      return <span>{useFormStore(form.store, (s) => s.values.name)}</span>
    }

    const { host, root } = mount()
    act(() => root.render(<Reader />))
    const baseline = renders
    act(() => form.setFieldValue('other', 'ignored'))
    expect(renders).toBe(baseline)
    act(() => form.setFieldValue('name', 'updated'))
    expect(host.textContent).toBe('updated')
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(active).toBe(1)
    act(() => root.unmount())
    expect(active).toBe(0)
    const unmounted = renders
    act(() => form.setFieldValue('name', 'after teardown'))
    expect(renders).toBe(unmounted)
    roots.pop()
  })

  it('shows async validation and suppresses stale results after unmount', async () => {
    const form = new FormApi({ defaultValues: { name: '' } })
    let finish: (error: string | undefined) => void = () => {}
    const validate = vi.fn(
      () =>
        new Promise<string | undefined>((resolve) => {
          finish = resolve
        }),
    )

    function Screen() {
      const field = useField({ form, name: 'name', validators: { onChangeAsync: validate } })
      return (
        <span>
          {String(field.state.meta.isValidating)}:{field.state.meta.errors.join(',')}
        </span>
      )
    }

    const { host, root } = mount()
    act(() => root.render(<Screen />))
    await act(async () => {
      form.setFieldValue('name', 'taken')
      await new Promise((resolve) => setTimeout(resolve, 5))
    })

    expect(host.textContent).toBe('true:')
    await act(async () => {
      finish('Already used')
      await new Promise((resolve) => setTimeout(resolve, 5))
    })

    expect(host.textContent).toBe('false:Already used')
    await act(async () => {
      form.setFieldValue('name', 'later')
      await new Promise((resolve) => setTimeout(resolve, 5))
    })

    act(() => root.unmount())
    roots.pop()
    await act(async () => {
      finish('Stale')
      await new Promise((resolve) => setTimeout(resolve, 5))
    })

    expect(form.getFieldInfo('name').instance).toBeNull()
    expect(form.state.fieldMeta.name?.errors).not.toContain('Stale')
  })

  it('reports pending saves and restores submit state after rejection', async () => {
    let rejectSave: (error: Error) => void = () => {}
    const save = () =>
      new Promise<void>((_, reject) => {
        rejectSave = reject
      })

    function Screen() {
      const form = useForm({ defaultValues: { name: 'Ada' }, onSubmit: save })
      const pending = useFormStore(form.store, (state) => state.isSubmitting)
      return (
        <button
          disabled={pending}
          onClick={() => {
            void form.handleSubmit().catch(() => {})
          }}
        >
          {String(pending)}
        </button>
      )
    }

    const { host, root } = mount()
    act(() => root.render(<Screen />))
    const button = host.querySelector('button')!
    await act(async () => {
      button.click()
      await Promise.resolve()
    })

    expect(button.disabled).toBe(true)
    expect(button.textContent).toBe('true')
    await act(async () => {
      rejectSave(new Error('Offline'))
      await Promise.resolve()
    })

    expect(button.disabled).toBe(false)
    expect(button.textContent).toBe('false')
  })
})
