import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Exercise the real root service and Octane root with host stand-ins. Native
// drawing, OS input and native class registration remain packed-host checks.
test('root services own registration, font inheritance and retirement independently', async () => {
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('.') && context.parentURL) {
        const candidate = new URL(specifier + '.ts', context.parentURL)
        if (existsSync(candidate)) {
          return nextResolve(candidate.href, context)
        }
      }
      return nextResolve(specifier, context)
    },
  })
  try {
    const { createRoots } = await import('../src/roots.ts')
    const observed: object[] = []
    const dependencies = {
      registry: { cssNodesByView: new WeakMap() },
      borderPaint: { syncBorderBox() {} },
      shadowPaint: { syncBoxShadow() {} },
      driver: {
        macOSDriver: {
          id: 'test',
          capabilities: { text: 'host' },
          prepareBatch() {
            return { apply() {}, abort() {} }
          },
        },
      },
      styleEnvironment: {
        installResizeObserver() {},
        installAccessibilityDisplayObserver() {},
        seedContainerMedia(container) {
          observed.push(container.hostView)
        },
      },
      automation: { installAutomation() {} },
    }
    const roots = createRoots(dependencies)
    const independent = createRoots(dependencies)
    const firstHost = {},
      secondHost = {},
      otherHost = {}
    const first = roots.createMacOSRoot(firstHost, { fontFamily: 'Example' })
    const second = roots.createMacOSRoot(secondHost)
    const other = independent.createMacOSRoot(otherHost)
    assert.deepEqual(observed, [firstHost, secondHost, otherHost])
    assert.equal(roots.fontFamilyForView({ superview: firstHost }), 'Example')
    assert.equal(independent.fontFamilyForView({ superview: firstHost }), undefined)
    const hosts: object[] = []
    roots.observeLayoutCommits(({ hostView }) => hosts.push(hostView))()
    assert.deepEqual(hosts, [firstHost, secondHost])
    first.unmount()
    const remaining: object[] = []
    roots.observeLayoutCommits(({ hostView }) => remaining.push(hostView))()
    assert.deepEqual(remaining, [secondHost])
    second.unmount()
    assert.equal(roots.appKitContainers.size, 0)
    assert.equal(independent.appKitContainers.size, 1)
    other.unmount()
    assert.equal(independent.appKitContainers.size, 0)
  } finally {
    hooks.deregister()
  }
})
