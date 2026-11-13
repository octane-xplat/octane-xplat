import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createContext,
  createPortal,
  createUniversalRoot,
  defineUniversalComponent,
  universalComponent,
  universalContext,
  universalKey,
  universalPlan,
  universalProps,
  universalValue,
  useContext,
  type UniversalHostCommand,
  type UniversalPortalTargetHandle,
  type UniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', async () => (await import('../tests/core-mock.js')).createCoreMock())

import * as core from '@nativescript/core'
import { MockLayoutBase, MockTextBase, type MockView } from '../tests/core-mock.js'
import { create, insert, mount, releaseMounted } from '../tests/mount.js'
import { NATIVESCRIPT_RENDERER_ID } from './config.js'
import {
  createNativeScriptContainer,
  createNativeScriptRoot,
  nativeScriptDriver,
  releaseNativeScriptContainer,
} from './driver.js'
import { type ElementConstructor, registerElement } from './elements.js'

registerElement('test-stack', core.StackLayout as unknown as ElementConstructor)
registerElement('test-grid', core.GridLayout as unknown as ElementConstructor)

const RID = NATIVESCRIPT_RENDERER_ID

const labelPlan = universalPlan(RID, {
  kind: 'host',
  type: 'label',
  bindings: [['text', 0]],
})
const markerPlan = universalPlan(RID, { kind: 'host', type: 'test-stack' })
const cardPlan = universalPlan(RID, {
  kind: 'host',
  type: 'test-grid',
  children: [{ kind: 'host', type: 'label', props: { text: 'inner' } }],
})

/** A real Octane root over a mock host; `root.unmount()` cleans up. */
function renderRoot(host: MockView): UniversalRoot {
  return createNativeScriptRoot(host as unknown as core.ViewBase)
}

function labels(view: MockLayoutBase): MockTextBase[] {
  return view.children as unknown as MockTextBase[]
}

afterEach(releaseMounted)

describe('portals', () => {
  /**
   * A portal shares its declaration site's Octane root, so a consumer rendered
   * through it reads the context provided at the declaration site — including
   * later provider updates. Portals are not cross-root context inheritance:
   * they place native views, never move logical ownership.
   */
  it('renders into a native target with declaration-site context and live updates', () => {
    const Theme = createContext('default')
    const Reader = defineUniversalComponent(RID, () =>
      universalValue(labelPlan, [useContext(Theme)]),
    )
    const Scene = defineUniversalComponent(
      RID,
      (props: { theme: string; target: core.LayoutBase }) =>
        universalContext(Theme, props.theme, [
          universalValue(markerPlan),
          createPortal(universalComponent(RID, Reader), props.target),
        ]),
    )

    const host = new MockLayoutBase()
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const root = renderRoot(host)

    root.render(Scene, { theme: 'warm', target: target as never })
    // The marker stays in the root host; only the portal child lands on target.
    expect(host.children).toHaveLength(1)
    expect(labels(target)).toHaveLength(1)
    expect(labels(target)[0].text).toBe('warm')
    const leaf = labels(target)[0]

    // A provider update at the declaration site reaches the portal child,
    // which is updated in place rather than remounted.
    root.render(Scene, { theme: 'cool', target: target as never })
    expect(labels(target)[0]).toBe(leaf)
    expect(leaf.text).toBe('cool')

    root.unmount()
    expect(target.children).toHaveLength(0)
    expect((leaf as unknown as MockView).parent).toBeNull()
  })

  it('keeps a portal inside a Page root without disturbing page content', () => {
    const Reader = defineUniversalComponent(RID, () => universalValue(labelPlan, ['leaf']))
    const Scene = defineUniversalComponent(RID, (props: { target: core.LayoutBase }) => [
      universalValue(markerPlan),
      createPortal(universalComponent(RID, Reader), props.target),
    ])

    const page = new core.Page() as unknown as core.ContentView & {
      content: MockView | null
    }
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const root = renderRoot(page as unknown as MockView)

    root.render(Scene, { target: target as never })
    // The authored page content is the scene's marker; the portal adds nothing
    // to the page — only to the selected target view.
    const content = page.content
    expect(content).not.toBeNull()
    expect(content?.typeName).toBe('StackLayout')
    expect(labels(target)).toHaveLength(1)

    root.unmount()
    expect(page.content).toBeNull()
    expect(target.children).toHaveLength(0)
  })

  it('shares one target between portals and keeps declaration order', () => {
    const Scene = defineUniversalComponent(RID, (props: { target: core.LayoutBase }) => [
      createPortal(universalValue(labelPlan, ['first']), props.target),
      createPortal(universalValue(labelPlan, ['second']), props.target),
    ])

    const host = new MockLayoutBase()
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const root = renderRoot(host)

    root.render(Scene, { target: target as never })
    expect(labels(target).map((label) => label.text)).toEqual(['first', 'second'])

    root.unmount()
    expect(target.children).toHaveLength(0)
  })

  it('reorders keyed portal children within their target in place', () => {
    const Scene = defineUniversalComponent(
      RID,
      (props: { order: readonly string[]; target: core.LayoutBase }) =>
        createPortal(
          props.order.map((label) => universalKey(label, universalValue(labelPlan, [label]))),
          props.target,
        ),
    )

    const host = new MockLayoutBase()
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const root = renderRoot(host)

    root.render(Scene, {
      order: ['first', 'second'],
      target: target as never,
    })
    const [first, second] = labels(target)
    expect(labels(target).map((label) => label.text)).toEqual(['first', 'second'])

    root.render(Scene, {
      order: ['second', 'first'],
      target: target as never,
    })
    expect(target.children).toEqual([second, first])

    root.unmount()
  })

  it('preserves keyed order when another root shares a caller-owned target', () => {
    const Scene = defineUniversalComponent(
      RID,
      (props: { order: readonly string[]; target: core.LayoutBase }) =>
        createPortal(
          props.order.map((text) => universalKey(text, universalValue(labelPlan, [text]))),
          props.target,
        ),
    )
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const firstRoot = renderRoot(new MockLayoutBase())
    const secondRoot = renderRoot(new MockLayoutBase())

    try {
      firstRoot.render(Scene, {
        order: ['a1', 'a2', 'a3'],
        target: target as never,
      })
      const original = labels(target).slice()
      secondRoot.render(Scene, { order: ['b1'], target: target as never })
      const foreign = labels(target)[3]

      firstRoot.render(Scene, {
        order: ['a3', 'a2', 'a1'],
        target: target as never,
      })
      const ownLabels = () => labels(target).filter((view) => view !== foreign)
      expect(ownLabels().map((view) => view.text)).toEqual(['a3', 'a2', 'a1'])
      expect(ownLabels()[0]).toBe(original[2])
      expect(ownLabels()[1]).toBe(original[1])
      expect(ownLabels()[2]).toBe(original[0])
      expect(foreign.parent).toBe(target)

      // Prepending also uses a native sibling anchor, rather than a tail offset.
      firstRoot.render(Scene, {
        order: ['a0', 'a3', 'a2', 'a1'],
        target: target as never,
      })
      expect(ownLabels().map((view) => view.text)).toEqual(['a0', 'a3', 'a2', 'a1'])
      expect(foreign.parent).toBe(target)
    } finally {
      firstRoot.unmount()
      secondRoot.unmount()
    }
    expect(target.children).toHaveLength(0)
  })

  it('moves the subtree to the new target on retarget without remounting', () => {
    const Scene = defineUniversalComponent(RID, (props: { target: core.LayoutBase }) =>
      createPortal(universalValue(cardPlan), props.target),
    )

    const host = new MockLayoutBase()
    const targetA = new core.GridLayout() as unknown as MockLayoutBase
    const targetB = new core.GridLayout() as unknown as MockLayoutBase
    const root = renderRoot(host)

    root.render(Scene, { target: targetA as never })
    const card = targetA.children[0]
    expect(labels(card as unknown as MockLayoutBase)[0].text).toBe('inner')

    root.render(Scene, { target: targetB as never })
    expect(targetA.children).toHaveLength(0)
    expect(targetB.children[0]).toBe(card)
    expect((card as unknown as MockView).parent).toBe(targetB)

    root.unmount()
    expect(targetB.children).toHaveLength(0)
  })

  /**
   * A portal may target the root host itself. The entry tracks only portal
   * children while root children use `container.children`, and both write to
   * the same native view — so portal children take the tail, keeping ordinary
   * children ahead of them however the tree is updated.
   */
  it('keeps portal children after ordinary children when the target is the root host', () => {
    const Scene = defineUniversalComponent(
      RID,
      (props: { second: boolean; target: core.LayoutBase }) => [
        universalValue(labelPlan, ['first']),
        props.second ? universalValue(labelPlan, ['second']) : null,
        createPortal(universalValue(labelPlan, ['portal']), props.target),
      ],
    )

    const host = new core.StackLayout() as unknown as MockLayoutBase
    const root = renderRoot(host)

    root.render(Scene, { second: false, target: host as never })
    expect(labels(host).map((label) => label.text)).toEqual(['first', 'portal'])

    // Ordinary children inserted or removed later keep their order and stay
    // ahead of the portal children.
    root.render(Scene, { second: true, target: host as never })
    expect(labels(host).map((label) => label.text)).toEqual(['first', 'second', 'portal'])
    root.render(Scene, { second: false, target: host as never })
    expect(labels(host).map((label) => label.text)).toEqual(['first', 'portal'])

    root.unmount()
    expect(host.children).toHaveLength(0)
  })

  /**
   * A portal may also target a layout this root mounted — its view passes the
   * ownership check and already hosts the node's ordinary children, which are
   * tracked on the host node rather than the portal entry. Portal children
   * again take the tail.
   */
  it('keeps portal children after the ordinary children of a host layout target', () => {
    const layoutPlan = universalPlan(RID, {
      kind: 'host',
      type: 'test-grid',
      propsSlot: 0,
    })
    const Scene = defineUniversalComponent(
      RID,
      (props: { second: boolean; target: core.LayoutBase | null }) => [
        universalValue(layoutPlan, [
          universalProps(
            [],
            [
              universalValue(labelPlan, ['inner']),
              ...(props.second ? [universalValue(labelPlan, ['second'])] : []),
            ],
          ),
        ]),
        props.target === null
          ? null
          : createPortal(universalValue(labelPlan, ['portal']), props.target),
      ],
    )

    const host = new MockLayoutBase()
    const root = renderRoot(host)

    root.render(Scene, { second: false, target: null })
    const target = host.children[0] as unknown as MockLayoutBase
    expect(target.typeName).toBe('GridLayout')
    expect(labels(target).map((label) => label.text)).toEqual(['inner'])

    root.render(Scene, { second: false, target: target as never })
    expect(labels(target).map((label) => label.text)).toEqual(['inner', 'portal'])

    // An ordinary child appended inside the target stays ahead of the portal
    // children, and removing it leaves them undisturbed.
    root.render(Scene, { second: true, target: target as never })
    expect(labels(target).map((label) => label.text)).toEqual(['inner', 'second', 'portal'])
    root.render(Scene, { second: false, target: target as never })
    expect(labels(target).map((label) => label.text)).toEqual(['inner', 'portal'])

    // Unmount detaches the layout from the host; its own subtree stays, and
    // only the portal child is released from it.
    root.unmount()
    expect(labels(target).map((label) => label.text)).toEqual(['inner'])
  })

  /**
   * Re-registering the target's element class swaps its view under a live
   * registration: the entry keeps its handle and the portal children move to
   * the replacement, after the ordinary children. The stable target id moves
   * with the view, so the next render mints the same handle and the
   * registration is recognized as already committed.
   */
  it('keeps a portal on a driver-owned target whose element class is replaced', () => {
    const Theme = createContext('default')
    const Reader = defineUniversalComponent(RID, () =>
      universalValue(labelPlan, [useContext(Theme)]),
    )
    const layoutPlan = universalPlan(RID, {
      kind: 'host',
      type: 'test-grid',
      propsSlot: 0,
    })
    const Scene = defineUniversalComponent(
      RID,
      (props: { theme: string; target: core.LayoutBase | null }) =>
        universalContext(Theme, props.theme, [
          universalValue(layoutPlan, [universalProps([], [universalValue(labelPlan, ['inner'])])]),
          props.target === null
            ? null
            : createPortal(universalComponent(RID, Reader), props.target),
        ]),
    )

    const host = new MockLayoutBase()
    const container = createNativeScriptContainer(host as unknown as core.ViewBase)
    const root = createUniversalRoot(container, nativeScriptDriver, {
      scheduleMicrotask: (callback) => {
        Promise.resolve().then(callback)
      },
    })
    container.root = root

    let unmounted = false
    try {
      root.render(Scene, { theme: 'warm', target: null })
      const target = host.children[0] as unknown as MockLayoutBase
      expect(target.typeName).toBe('GridLayout')

      root.render(Scene, { theme: 'warm', target: target as never })
      expect(labels(target).map((label) => label.text)).toEqual(['inner', 'warm'])
      const leaf = labels(target)[1]
      const entry = [...container.portalTargets.values()][0]
      expect(entry.view).toBe(target)

      class NextGridLayout extends MockLayoutBase {}
      try {
        registerElement('test-grid', NextGridLayout as unknown as ElementConstructor)

        const replacement = host.children[0] as unknown as MockLayoutBase
        expect(replacement).not.toBe(target)
        expect(replacement).toBeInstanceOf(NextGridLayout)
        // The same portal child moved to the replacement, still after the
        // node's ordinary children; the old view is left with nothing.
        expect(labels(replacement).map((label) => label.text)).toEqual(['inner', 'warm'])
        expect(labels(replacement)[1]).toBe(leaf)
        expect((leaf as unknown as MockView).parent).toBe(replacement)
        expect(target.children).toHaveLength(0)
        expect(entry.view).toBe(replacement)

        // Re-rendering against the replacement mints the same target handle:
        // the entry is untouched and context updates reach the portal child.
        root.render(Scene, { theme: 'cool', target: replacement as never })
        expect([...container.portalTargets.values()]).toEqual([entry])
        expect(labels(replacement)[1]).toBe(leaf)
        expect(leaf.text).toBe('cool')
      } finally {
        // The restore pass recreates the view once more, portal child included.
        registerElement('test-grid', core.GridLayout as unknown as ElementConstructor)
      }

      // Teardown detaches the portal child and releases the registration; the
      // node's own subtree stays with the current replacement view.
      const restored = host.children[0] as unknown as MockLayoutBase
      expect(labels(restored)[1]).toBe(leaf)
      unmounted = true
      root.unmount()
      expect(container.portalTargets.size).toBe(0)
      expect(labels(restored).map((label) => label.text)).toEqual(['inner'])
      expect((leaf as unknown as MockView).parent).toBeNull()
    } finally {
      if (!unmounted) {
        root.unmount()
      }
      releaseNativeScriptContainer(container)
    }
  })

  it('reopens against the current view after repeated target replacement', () => {
    const layoutPlan = universalPlan(RID, { kind: 'host', type: 'test-grid' })
    const Scene = defineUniversalComponent(
      RID,
      (props: { target: core.LayoutBase | null; open: boolean }) => [
        universalValue(layoutPlan),
        props.open && props.target !== null
          ? createPortal(universalValue(labelPlan, ['leaf']), props.target)
          : null,
      ],
    )
    const host = new MockLayoutBase()
    const root = renderRoot(host)
    class NextGridLayout extends MockLayoutBase {}
    class LatestGridLayout extends MockLayoutBase {}
    let latest: MockLayoutBase | undefined

    try {
      root.render(Scene, { target: null, open: false })
      const original = host.children[0] as unknown as MockLayoutBase
      root.render(Scene, { target: original as never, open: true })
      const initialLeaf = labels(original)[0]

      registerElement('test-grid', NextGridLayout as unknown as ElementConstructor)
      const replacement = host.children[0] as unknown as MockLayoutBase
      expect(labels(replacement)[0]).toBe(initialLeaf)
      root.render(Scene, { target: original as never, open: false })
      expect(replacement.children).toHaveLength(0)

      // Replace again while there are no active portal registrations. Both
      // the original reference and the intermediate reference remain valid.
      registerElement('test-grid', LatestGridLayout as unknown as ElementConstructor)
      latest = host.children[0] as unknown as MockLayoutBase
      root.render(Scene, { target: original as never, open: true })
      const reopenedLeaf = labels(latest)[0]
      expect(reopenedLeaf?.text).toBe('leaf')
      expect(reopenedLeaf?.parent).toBe(latest)
      expect(original.children).toHaveLength(0)
      expect(replacement.children).toHaveLength(0)

      root.render(Scene, { target: replacement as never, open: true })
      expect(labels(latest)[0]).toBe(reopenedLeaf)
      root.render(Scene, { target: latest as never, open: true })
      expect(labels(latest)[0]).toBe(reopenedLeaf)
    } finally {
      root.unmount()
      registerElement('test-grid', core.GridLayout as unknown as ElementConstructor)
    }
    expect(latest?.children).toHaveLength(0)
  })

  /**
   * A replacement that is no longer a layout cannot honor the target
   * contract, so the swap fails before any view detaches: the previous view
   * keeps the portal children and the registration stays live.
   */
  it('fails a target replacement that can no longer host children', () => {
    const layoutPlan = universalPlan(RID, { kind: 'host', type: 'test-grid' })
    const Scene = defineUniversalComponent(RID, (props: { target: core.LayoutBase | null }) => [
      universalValue(layoutPlan),
      props.target === null
        ? null
        : createPortal(universalValue(labelPlan, ['leaf']), props.target),
    ])

    const host = new MockLayoutBase()
    const container = createNativeScriptContainer(host as unknown as core.ViewBase)
    const root = createUniversalRoot(container, nativeScriptDriver, {
      scheduleMicrotask: (callback) => {
        Promise.resolve().then(callback)
      },
    })
    container.root = root

    let unmounted = false
    try {
      root.render(Scene, { target: null })
      const target = host.children[0] as unknown as MockLayoutBase
      root.render(Scene, { target: target as never })
      expect(labels(target)).toHaveLength(1)
      const leaf = labels(target)[0]

      try {
        expect(() =>
          registerElement('test-grid', core.Label as unknown as ElementConstructor),
        ).toThrow(/cannot host portal children/)

        // The rejected swap left the live portal untouched.
        expect(host.children[0]).toBe(target)
        expect(labels(target)).toHaveLength(1)
        expect(container.portalTargets.size).toBe(1)
      } finally {
        // Restoring a layout-capable class recreates the view normally.
        registerElement('test-grid', core.GridLayout as unknown as ElementConstructor)
      }

      const replacement = host.children[0] as unknown as MockLayoutBase
      expect(replacement).toBeInstanceOf(core.GridLayout)
      expect(labels(replacement)[0]).toBe(leaf)

      unmounted = true
      root.unmount()
      expect(container.portalTargets.size).toBe(0)
      expect(replacement.children).toHaveLength(0)
      expect((leaf as unknown as MockView).parent).toBeNull()
    } finally {
      if (!unmounted) {
        root.unmount()
      }
      releaseNativeScriptContainer(container)
    }
  })

  it('rejects non-view and non-layout targets', () => {
    const Scene = defineUniversalComponent(RID, (props: { target: unknown }) =>
      createPortal(universalValue(labelPlan, ['leaf']), props.target),
    )

    const host = new MockLayoutBase()
    const root = renderRoot(host)
    const ready = universalValue(markerPlan)

    root.render(
      defineUniversalComponent(RID, () => ready),
      undefined,
    )

    expect(() => root.render(Scene, { target: 42 })).toThrow(/must be a NativeScript view/)
    expect(() => root.render(Scene, { target: null })).toThrow(/must be a NativeScript view/)
    expect(() => root.render(Scene, { target: new core.Label() })).toThrow(
      /cannot host portal children/,
    )

    // Failed renders leave the committed tree intact.
    expect(host.children).toHaveLength(1)
    root.unmount()
  })

  it('rejects a target view owned by another root', () => {
    const foreign = mount(new MockLayoutBase())
    foreign.apply(create(1, 'test-grid'), insert(1))
    const foreignView = foreign.view<MockLayoutBase>(1)

    const Scene = defineUniversalComponent(RID, (props: { target: core.LayoutBase }) =>
      createPortal(universalValue(labelPlan, ['leaf']), props.target),
    )
    const root = renderRoot(new MockLayoutBase())

    expect(() => root.render(Scene, { target: foreignView as never })).toThrow(
      /another Octane root/,
    )
    root.unmount()
  })

  it('resolves handle parents only while their registration is active', () => {
    const { container, apply } = mount(new MockLayoutBase())
    const target = new core.GridLayout() as unknown as MockLayoutBase
    const prepareTarget = nativeScriptDriver.portals!.prepareTarget
    const mint = (id: string | number): UniversalPortalTargetHandle => ({
      $$kind: 'octane.universal.portal-target',
      renderer: RID,
      root: 0,
      id,
    })
    const context = {
      container,
      renderer: RID,
      transported: false,
      createPortalTargetHandle: mint,
    }

    const registration = prepareTarget({ ...context, target: target as never })
    apply(create(1, 'label', { text: 'leaf' }), {
      op: 'insert',
      id: 1,
      parent: registration.handle,
      before: null,
    } as UniversalHostCommand)
    expect(labels(target).map((label) => label.text)).toEqual(['leaf'])

    // A fabricated or foreign-root handle never resolves to the root container.
    expect(() =>
      apply(create(2, 'label'), {
        op: 'insert',
        id: 2,
        parent: mint('forged'),
        before: null,
      } as UniversalHostCommand),
    ).toThrow(/inactive portal target/)
    expect(() =>
      apply(create(3, 'label'), {
        op: 'insert',
        id: 3,
        parent: 'bogus',
        before: null,
      } as unknown as UniversalHostCommand),
    ).toThrow(/must be a host id/)

    // After release the same handle is stale and fails instead of attaching.
    registration.release()
    expect(container.portalTargets.size).toBe(0)
    expect(() =>
      apply(create(4, 'label'), {
        op: 'insert',
        id: 4,
        parent: registration.handle,
        before: null,
      } as UniversalHostCommand),
    ).toThrow(/inactive portal target/)
  })

  it('unmount releases every portal registration and orphans nothing', () => {
    const Scene = defineUniversalComponent(
      RID,
      (props: { targets: readonly core.LayoutBase[] }) => [
        createPortal(universalValue(labelPlan, ['a']), props.targets[0]),
        createPortal(
          [universalValue(labelPlan, ['b']), universalValue(labelPlan, ['c'])],
          props.targets[1],
        ),
      ],
    )

    const container = createNativeScriptContainer(new MockLayoutBase() as unknown as core.ViewBase)
    const root = createUniversalRoot(container, nativeScriptDriver, {
      scheduleMicrotask: (callback) => {
        Promise.resolve().then(callback)
      },
    })
    container.root = root

    const targetA = new core.GridLayout() as unknown as MockLayoutBase
    const targetB = new core.GridLayout() as unknown as MockLayoutBase
    root.render(Scene, {
      targets: [targetA, targetB] as never,
    })
    expect(container.portalTargets.size).toBe(2)
    const b = labels(targetB)[0]

    root.unmount()
    expect(container.portalTargets.size).toBe(0)
    expect(targetA.children).toHaveLength(0)
    expect(targetB.children).toHaveLength(0)
    expect((b as unknown as MockView).parent).toBeNull()
  })
})
