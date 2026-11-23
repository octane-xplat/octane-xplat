/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it } from 'vitest'
import { Application, isAndroid, type View } from '@nativescript/core'
import { Drawer } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

function findHost(view: View, id: string): View | undefined {
  if (view.id === id) {
    return view
  }

  let result: View | undefined

  view.eachChildView?.((child) => {
    result ??= findHost(child, id)
    return true
  })

  return result
}

function hardwareBack(): boolean {
  const event = {
    eventName: 'activityBackPressed',
    object: Application.android,
    activity: Application.android.foregroundActivity,
    cancel: false,
  }

  Application.android.notify(event)
  return event.cancel
}

function OpenDrawer() @{
  <Drawer
    id="drawer-host"
    defaultOpen
    reducedMotion
    main={<Text>Main</Text>}
    drawer={<Text>Menu</Text>}
  />
}

const backChanges: boolean[] = []
let backDismissals = 0

function BackDrawer() @{
  <Drawer
    id="drawer-back-host"
    defaultOpen
    reducedMotion
    onOpenChange={(open) => {
      backChanges.push(open)
    }}
    onDismiss={() => {
      backDismissals += 1
    }}
    main={<Text>Main</Text>}
    drawer={<Text>Menu</Text>}
  />
}

describe('native Drawer', () => {
  it('mounts the composed host and opens the measured panel after layout', async () => {
    const { view } = await mountXplat(OpenDrawer)
    const host = findHost(view, 'drawer-host')
    const panel = findHost(view, 'drawer-host-panel')

    expect(host).toBeDefined()
    await waitUntil(() => panel!.visibility === 'visible' && panel!.translateX === 0, {
      message: 'defaultOpen never opened after layout',
    })

    expect(findHost(view, 'drawer-host-main')).toBeDefined()
    expect(panel!.getActualSize().width).toBe(280)
    expect(panel!.translateX).toBe(0)
  })

  it.skipIf(!isAndroid)('consumes one hardware Back press to dismiss the open panel', async () => {
    backChanges.length = 0
    backDismissals = 0

    const { view } = await mountXplat(BackDrawer)
    const host = findHost(view, 'drawer-back-host')
    const panel = findHost(view, 'drawer-back-host-panel')

    expect(host).toBeDefined()
    await waitUntil(() => panel!.visibility === 'visible' && panel!.translateX === 0, {
      message: 'defaultOpen never opened after layout',
    })

    expect(hardwareBack()).toBe(true)
    expect(backChanges).toEqual([false])
    expect(backDismissals).toBe(1)
    await waitUntil(() => panel!.visibility === 'hidden', {
      message: 'Back dismissal did not close the panel',
    })

    // A closed panel must not consume Back or echo another dismissal.
    expect(hardwareBack()).toBe(false)
    expect(backChanges).toEqual([false])
    expect(backDismissals).toBe(1)
  })
})
