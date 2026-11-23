/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Button } from './Button.web.tsrx'

const roots: any[] = []
function mount(props: any = {}) {
  const el = document.createElement('div')

  document.body.append(el)

  const root = createRoot(el)

  roots.push(root)
  act(() => root.render(<Button {...props} />))
  return el.firstElementChild as HTMLElement
}

const click = (host: Element) =>
  act(() => host.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Button pressAction failure reporting', () => {
  it('reports a rejected pressAction through onActionError and clears pending', async () => {
    const error = new Error('save failed')
    const onActionError = vi.fn()
    let rejectAction: ((reason: unknown) => void) | undefined
    const host = mount({
      label: 'Save',
      pressAction: () =>
        new Promise<void>((_, reject) => {
          rejectAction = reject
        }),
      onActionError,
    })

    click(host)
    expect(host.getAttribute('aria-busy')).toBe('true')

    await act(async () => {
      rejectAction!(error)
      await Promise.resolve()
    })

    expect(onActionError).toHaveBeenCalledWith(error)
    expect(host.classList.contains('vx-button--loading')).toBe(false)
  })

  it('reports a synchronous pressAction throw through onActionError', () => {
    const error = new Error('sync failure')
    const onActionError = vi.fn()
    const host = mount({
      label: 'Save',
      pressAction: () => {
        throw error
      },
      onActionError,
    })

    click(host)
    expect(onActionError).toHaveBeenCalledWith(error)
  })

  it('surfaces an unhandled failure as an uncaught error when no handler is set', async () => {
    vi.useFakeTimers()

    const error = new Error('unhandled failure')
    let rejectAction: ((reason: unknown) => void) | undefined
    const host = mount({
      label: 'Save',
      pressAction: () =>
        new Promise<void>((_, reject) => {
          rejectAction = reject
        }),
    })

    click(host)
    await act(async () => {
      rejectAction!(error)
      await Promise.resolve()
    })

    expect(() => vi.advanceTimersByTime(0)).toThrow(error)
  })
})

describe('Button tooltip', () => {
  it('describes a focused button without overwriting an existing description', async () => {
    const host = mount({
      label: 'Save',
      tooltip: 'Save the document',
      web: { 'aria-describedby': 'instructions' },
    })

    act(() => host.focus())
    const panel = document.querySelector('[role="tooltip"]')!
    expect(panel.textContent).toBe('Save the document')
    expect(host.getAttribute('aria-describedby')?.split(' ')).toEqual(['instructions', panel.id])

    expect(document.activeElement).toBe(host)
    act(() => host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    await vi.waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).toBeNull()
      expect(host.getAttribute('aria-describedby')).toBe('instructions')
    })
  })
})

const loadingStatus = (host: HTMLElement) =>
  host.parentElement!.querySelector('[role="status"][aria-live="polite"]')!

describe('Button loading/pending semantics', () => {
  it('preserves the name and announces an initially loading button after mount', () => {
    vi.useFakeTimers()
    const host = mount({ label: 'Save', isLoading: true }) as HTMLButtonElement

    expect(host.getAttribute('aria-busy')).toBe('true')
    expect(host.disabled).toBe(false)
    expect(host.getAttribute('aria-disabled')).toBe('true')
    expect(host.getAttribute('aria-label')).toBe('Save')

    const content = host.querySelector('.vx-button-content')!

    expect(content.classList.contains('vx-button-content--hidden')).toBe(true)
    expect(content.getAttribute('aria-hidden')).toBe('true')
    expect(content.textContent).toContain('Save')
    expect(host.querySelector('.vx-button-spinner')).not.toBe(null)

    const status = loadingStatus(host)

    expect(status.textContent).toBe('')
    act(() => vi.advanceTimersByTime(32))
    expect(status.textContent).toBe('Loading')
  })

  it('reports an in-flight pressAction as busy and blocked until it settles', async () => {
    vi.useFakeTimers()
    let resolveAction: (() => void) | undefined
    const host = mount({
      label: 'Save',
      pressAction: () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve
        }),
    })

    host.focus()
    click(host)
    expect(document.activeElement).toBe(host)
    expect(host.getAttribute('aria-busy')).toBe('true')
    expect(host.getAttribute('aria-disabled')).toBe('true')
    const blocked = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => host.dispatchEvent(blocked))
    expect(blocked.defaultPrevented).toBe(true)
    expect(loadingStatus(host).textContent).toBe('Loading')
    expect(host.querySelector('.vx-button-spinner')).toBeNull()
    act(() => vi.advanceTimersByTime(200))
    expect(host.querySelector('.vx-button-spinner')).not.toBeNull()

    await act(async () => {
      resolveAction!()
      await Promise.resolve()
    })

    expect(host.getAttribute('aria-busy')).toBe(null)
    expect((host as HTMLButtonElement).disabled).toBe(false)
    expect(loadingStatus(host).textContent).toBe('')
  })

  it('keeps an interruptible loading button enabled but still busy', () => {
    const host = mount({
      label: 'Save',
      isLoading: true,
      isInterruptible: true,
    }) as HTMLButtonElement

    expect(host.getAttribute('aria-busy')).toBe('true')
    expect(host.disabled).toBe(false)
  })

  it('renders an empty status region when idle', () => {
    const host = mount({ label: 'Save' })
    const status = loadingStatus(host)

    expect(status.textContent).toBe('')
  })
})

describe('Button renders a native button element', () => {
  it('renders <button type="button">, not a role-button div', () => {
    const host = mount({ label: 'Save' })

    expect(host.tagName).toBe('BUTTON')
    expect(host.getAttribute('type')).toBe('button')
    expect(host.getAttribute('role')).toBe(null)
    expect(host.getAttribute('tabindex')).toBe(null)
  })

  it.each(['Enter', ' '])('activates once per %s keypress through native click', (key) => {
    const action = vi.fn()
    const host = mount({ label: 'Save', onPress: action })
    const type = key === 'Enter' ? 'keydown' : 'keyup'

    // Native buttons fire click for Enter (keydown) and Space (keyup);
    // jsdom does not synthesize it, so dispatch click as the browser would.
    act(() => {
      host.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }))
      host.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('activates once on pointer click', () => {
    const action = vi.fn()
    const host = mount({ label: 'Save', onPress: action })

    click(host)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('disabled renders the native attribute and does not activate', () => {
    const action = vi.fn()
    const host = mount({
      label: 'Save',
      isDisabled: true,
      onPress: action,
    }) as HTMLButtonElement

    expect(host.disabled).toBe(true)
    expect(host.getAttribute('aria-disabled')).toBe(null)
    click(host)
    expect(action).not.toHaveBeenCalled()
  })

  it('disabled + tooltip uses aria-disabled and stays focusable', () => {
    const action = vi.fn()
    const host = mount({
      label: 'Save',
      isDisabled: true,
      tooltip: 'Unavailable',
      onPress: action,
    }) as HTMLButtonElement

    expect(host.disabled).toBe(false)
    expect(host.getAttribute('aria-disabled')).toBe('true')
    click(host)
    expect(action).not.toHaveBeenCalled()
  })

  it('allows the first form submit and blocks repeated submit while the action is pending', () => {
    const pressAction = vi.fn(() => new Promise<void>(() => {}))
    const host = mount({
      label: 'Save',
      pressAction,
      web: { type: 'submit', name: 'intent', value: 'save' },
    })
    const form = document.createElement('form')
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    host.parentElement!.before(form)
    form.append(host.parentElement!)
    form.addEventListener('submit', onSubmit)

    act(() => (host as HTMLButtonElement).click())
    act(() => (host as HTMLButtonElement).click())

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(pressAction).toHaveBeenCalledTimes(1)
    expect((onSubmit.mock.calls[0][0] as SubmitEvent).submitter).toBe(host)
  })

  it('keeps busy links as anchors and uses button semantics for disabled links', () => {
    const busy = mount({ label: 'Open', href: 'https://example.com', isLoading: true })
    const blocked = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => busy.dispatchEvent(blocked))
    expect(busy.tagName).toBe('A')
    expect(blocked.defaultPrevented).toBe(true)

    const disabled = mount({ label: 'Open', href: 'https://example.com', isDisabled: true })
    expect(disabled.tagName).toBe('BUTTON')
    expect(disabled.hasAttribute('href')).toBe(false)
  })

  it('still exposes aria-busy while pending on the native element', async () => {
    let resolveAction: (() => void) | undefined
    const host = mount({
      label: 'Save',
      pressAction: () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve
        }),
    }) as HTMLButtonElement

    click(host)
    expect(host.tagName).toBe('BUTTON')
    expect(host.getAttribute('aria-busy')).toBe('true')
    expect(host.disabled).toBe(false)
    expect(host.getAttribute('aria-disabled')).toBe('true')

    await act(async () => {
      resolveAction!()
      await Promise.resolve()
    })

    expect(host.getAttribute('aria-busy')).toBe(null)
    expect(host.disabled).toBe(false)
  })
})

describe('Button synchronous effects and asynchronous work', () => {
  it('runs an immediate effect without a loading transition and preserves activation data', () => {
    const effect = vi.fn()
    const host = mount({ label: 'Open', onPress: effect })

    click(host)
    expect(effect).toHaveBeenCalledTimes(1)
    expect(effect.mock.calls[0][0].source).toBe('virtual')
    expect(host.classList.contains('vx-button--loading')).toBe(false)
  })

  it('runs the effect before the action and blocks a reentrant press before pending renders', async () => {
    const calls: string[] = []
    let finish!: () => void
    const task = new Promise<void>((resolve) => {
      finish = resolve
    })

    const host = mount({
      label: 'Save',
      onPress: () => {
        calls.push('effect')
        host.click()
      },
      pressAction: () => {
        calls.push('action')
        return task
      },
    })

    click(host)
    expect(calls).toEqual(['effect', 'action'])
    expect(host.getAttribute('aria-busy')).toBe('true')
    await act(async () => {
      finish()
      await task
    })

    expect(host.classList.contains('vx-button--loading')).toBe(false)
  })

  it('lets onPress veto both link navigation and the managed action', () => {
    const action = vi.fn(async () => {})
    const host = mount({
      label: 'Open',
      href: 'https://example.com',
      onPress: (event: { preventDefault(): void }) => event.preventDefault(),
      pressAction: action,
    })

    const event = new MouseEvent('click', { bubbles: true, cancelable: true })

    act(() => host.dispatchEvent(event))
    expect(host.tagName).toBe('A')
    expect(host.getAttribute('href')).toBe('https://example.com')
    expect(event.defaultPrevented).toBe(true)
    expect(action).not.toHaveBeenCalled()
    expect(host.classList.contains('vx-button--loading')).toBe(false)
  })

  it('keeps interruptible overlap busy until every accepted action settles', async () => {
    const ends: (() => void)[] = []
    const host = mount({
      label: 'Save',
      isInterruptible: true,
      pressAction: () => new Promise<void>((resolve) => ends.push(resolve)),
    })

    click(host)
    click(host)
    await act(async () => {
      ends[0]()
      await Promise.resolve()
    })

    expect(host.getAttribute('aria-busy')).toBe('true')
    await act(async () => {
      ends[1]()
      await Promise.resolve()
    })

    expect(host.classList.contains('vx-button--loading')).toBe(false)
  })
})
