/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it } from 'vitest'
import { Application, isAndroid } from '@nativescript/core'
import { Drawer } from '@octane-xplat/drawer'
import { Text } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

type NativeDrawer = {
  isOpened(side: string): boolean
  close(side: string, duration: number): Promise<void>
  gestureEnabled: boolean
  panGestureHandler: unknown
  mainContent: unknown
  leftDrawer?: { getActualSize(): { width: number } }
}

function findHost(view: any, id: string): NativeDrawer | undefined {
  let host: NativeDrawer | undefined
  const find = (node: any): void => {
    if (node.id === id) {
      host = node
    }

    node.eachChildView?.((child: unknown) => {
      find(child)
      return true
    })
  }

  find(view)
  return host
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
  it('mounts the gesture host, lays out slots and opens after layout', async () => {
    const { view } = await mountXplat(OpenDrawer)
    const host = findHost(view, 'drawer-host')

    expect(host).toBeDefined()
    await waitUntil(() => host!.isOpened('left'), {
      message: 'defaultOpen never opened after layout',
    })

    expect(host!.gestureEnabled).toBe(true)
    expect(host!.panGestureHandler).toBeDefined()
    expect(host!.mainContent).toBeDefined()
    expect(host!.leftDrawer!.getActualSize().width).toBe(280)
    await host!.close('left', 0)
    expect(host!.isOpened('left')).toBe(false)
  })

  it.skipIf(!isAndroid)('consumes one hardware Back press to dismiss the open panel', async () => {
    backChanges.length = 0
    backDismissals = 0

    const { view } = await mountXplat(BackDrawer)
    const host = findHost(view, 'drawer-back-host')

    expect(host).toBeDefined()
    await waitUntil(() => host!.isOpened('left'), {
      message: 'defaultOpen never opened after layout',
    })

    expect(hardwareBack()).toBe(true)
    expect(backChanges).toEqual([false])
    expect(backDismissals).toBe(1)
    await waitUntil(() => !host!.isOpened('left'), {
      message: 'Back dismissal did not close the panel',
    })

    // A closed panel must not consume Back or echo another dismissal.
    expect(hardwareBack()).toBe(false)
    expect(backChanges).toEqual([false])
    expect(backDismissals).toBe(1)
  })
})
