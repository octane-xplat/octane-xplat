import type { Driver, Step, StepResult } from './types'
import type { DriverBindings } from './driver-contract'
import { waitUntil } from './runner'

export function createHarnessDriver(bindings: DriverBindings): Driver {
  return {
    target: 'web',
    build: import.meta.env.DEV ? 'development / workspace sources' : 'production / workspace build',
    evidence: 'dom-dispatch-and-inspection',
    async mount(spec, signal) {
      bindings.clear()
      await waitUntil(
        () =>
          !document.getElementById('hf-fixture') && bindings.resources() === 0
            ? 'Previous fixture retired'
            : undefined,
        signal,
      )

      const generation = bindings.mount(spec)

      await waitUntil(
        () =>
          document.getElementById('hf-generation')?.textContent ===
          'Fixture generation: ' + generation
            ? 'Fresh fixture committed'
            : undefined,
        signal,
      )
    },
    async cleanup() {
      bindings.clear()
      await waitUntil(
        () =>
          !document.getElementById('hf-fixture') && bindings.resources() === 0
            ? 'Fixture detached; resources released'
            : undefined,
        new AbortController().signal,
      )
    },
    async perform(step: Step, signal): Promise<StepResult> {
      let observed = 'Element not present'
      const expected =
        'expected' in step
          ? String(step.expected)
          : step.action === 'alignment'
            ? 'Aligned columns within 1px'
            : step.action === 'visibility'
              ? 'Hidden retains space; collapsed removes space'
              : step.action + ' ' + step.id

      try {
        const result = await waitUntil(() => {
          const element = document.getElementById(step.id)

          if (step.action === 'absent') {
            observed = element ? 'Element still attached' : 'Element detached'
            return element ? undefined : observed
          }

          if (!(element instanceof HTMLElement)) {
            return undefined
          }

          if (step.action === 'press') {
            element.click()
            return 'DOM click dispatched (no OS input or hit-testing claim)'
          }

          if (step.action === 'fill') {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
              throw new Error('Fixture target is not a text control.')
            }

            const owner =
              element instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype

            const setter = Object.getOwnPropertyDescriptor(owner, 'value')?.set

            if (!setter) {
              throw new Error('Native value setter unavailable.')
            }

            setter.call(element, step.value)
            element.dispatchEvent(new Event('input', { bubbles: true }))
            element.dispatchEvent(new Event('change', { bubbles: true }))
            return 'Input value and DOM input/change events dispatched'
          }

          if (step.action === 'text') {
            observed = element.textContent?.trim() ?? ''
            return observed === step.expected ? observed : undefined
          }

          if (step.action === 'value') {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
              throw new Error('Expected a text control.')
            }

            observed = element.value
            return observed === step.expected ? observed : undefined
          }

          if (step.action === 'checked') {
            if (!(element instanceof HTMLInputElement)) {
              throw new Error('Expected a checkbox.')
            }

            observed = String(element.checked)
            return element.checked === step.expected ? observed : undefined
          }

          if (step.action === 'alignment') {
            const head = [...element.querySelectorAll('thead th')].map((c) =>
              c.getBoundingClientRect(),
            )

            const cells = [...element.querySelectorAll('tbody tr:first-child td')].map((c) =>
              c.getBoundingClientRect(),
            )

            const aligned =
              head.length > 0 &&
              head.length === cells.length &&
              head.every(
                (h, i) =>
                  Math.abs(h.left - cells[i].left) < 1 && Math.abs(h.width - cells[i].width) < 1,
              )

            observed = aligned
              ? 'All header/body columns align within 1px'
              : 'Header/body columns differ or rows are absent'

            return aligned ? observed : undefined
          }

          const hidden = document.getElementById('hf-hidden')
          const collapsed = document.getElementById('hf-collapsed')
          const tail = document.getElementById('hf-tail-action')

          if (!hidden || !collapsed || !tail) {
            return undefined
          }

          const hiddenBounds = hidden.getBoundingClientRect(),
            collapsedBounds = collapsed.getBoundingClientRect()

          const valid =
            getComputedStyle(hidden).visibility === 'hidden' &&
            hiddenBounds.height > 0 &&
            collapsedBounds.height === 0 &&
            tail.getBoundingClientRect().height > 0

          observed = `Hidden height ${hiddenBounds.height}; collapsed height ${collapsedBounds.height}; tail height ${tail.getBoundingClientRect().height}`
          return valid ? observed : undefined
        }, signal)

        return { name: step.name, expected, observed: result }
      } catch (error) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)} Expected: ${expected}. Observed: ${observed}.`,
        )
      }
    },
  }
}
