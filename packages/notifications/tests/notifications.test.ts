import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { notificationBody } from '../src/notification-body.ts'
import { notificationBody as iosBody } from '../src/notification-body.ios.ts'

// Exercise the actual leaves with injected plugin/host boundaries, without an OS runtime.
function loadLeaf(name: string, globals: Record<string, unknown>) {
  const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace('export const notifications', 'const notifications')

  return runInNewContext(stripTypeScriptTypes(source) + '\nnotifications', globals)
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

test('mobile notify checks permission without prompting and drops denied sends', async () => {
  for (const granted of [false, true]) {
    const calls: unknown[] = []
    const leaf = loadLeaf('notifications', {
      notificationBody,
      LocalNotifications: {
        hasPermission: async () => granted,
        requestPermission: () => {
          throw Error('notify must not prompt')
        },
        schedule: async (options: unknown) => calls.push(options),
      },
    })

    assert.equal(leaf.notify('title', 'body'), undefined)
    await flush()
    assert.equal(calls.length, granted ? 1 : 0)
  }
})

test('mobile notify consumes permission and schedule failures', async () => {
  for (const failing of ['hasPermission', 'schedule']) {
    const leaf = loadLeaf('notifications', {
      notificationBody,
      LocalNotifications: {
        hasPermission: async () => {
          if (failing === 'hasPermission') {
            throw Error('permission failure')
          }

          return true
        },
        schedule: async () => {
          throw Error('schedule failure')
        },
      },
    })

    assert.doesNotThrow(() => leaf.notify('title'))
    await flush() // Node's test runner fails on unhandled promise rejections.
  }
})

test('mobile IDs stay distinct with a frozen clock and wrap within signed int range', async () => {
  const entries: any[] = []
  const leaf = loadLeaf('notifications', {
    Date: { now: () => 2147483646 },
    notificationBody,
    LocalNotifications: {
      hasPermission: async () => true,
      schedule: async (options: any[]) => entries.push(...options),
    },
  })

  for (let i = 0; i < 3; i++) {
    leaf.notify(`title ${i}`)
  }

  await flush()
  assert.deepEqual(
    entries.map((entry) => entry.id),
    [2147483646, 0, 1],
  )

  assert.equal(entries[0].body, '')
})

test('iOS preserves title for missing/empty bodies under plugin 7.0.0 normalization', () => {
  // Pinned index.ios.js content mapping: title = body || subtitle ? title : undefined;
  // body = body || subtitle || title || ' '. No subtitle is sent by this leaf.
  for (const input of [undefined, '', 'message']) {
    const body = iosBody(input)
    const title: string = 'title'
    const content = { title: body ? title : undefined, body: body || title || ' ' }
    assert.equal(content.title, 'title')
    assert.equal(content.body, input || ' ')
  }

  assert.equal(notificationBody(''), '')
})

function iosFixture({ granted = true } = {}) {
  const requests: any[] = []
  const added: any[] = []
  const leaf = loadLeaf('notifications.ios', {
    notificationBody: iosBody,
    UNMutableNotificationContent: {
      new: () => ({}),
    },
    UNNotificationSound: { defaultSound: 'default-sound' },
    UNNotificationRequest: {
      requestWithIdentifierContentTrigger: (identifier: string, content: any, trigger: any) => {
        const request = { identifier, content, trigger }
        requests.push(request)
        return request
      },
    },
    UNUserNotificationCenter: {
      currentNotificationCenter: () => ({
        addNotificationRequestWithCompletionHandler: (request: any, done: () => void) => {
          added.push(request)
          done()
        },
      }),
    },
    NSMutableDictionary: {
      new: () => {
        const dict: Record<string, unknown> = {}
        return {
          setObjectForKey: (value: unknown, key: string) => {
            dict[key] = value
          },
          dict,
        }
      },
    },
    LocalNotifications: {
      hasPermission: async () => granted,
      requestPermission: () => {
        throw Error('notify must not prompt')
      },
      schedule: async () => {
        throw Error('the iOS leaf must not schedule through the plugin')
      },
    },
  })
  return { leaf, requests, added }
}

test('iOS notify posts an untriggered request for immediate delivery', async () => {
  const { leaf, requests, added } = iosFixture()
  leaf.notify('title', 'body')
  await flush()

  assert.equal(requests.length, 1)
  // A nil trigger is the only immediate-delivery path — the plugin always
  // builds a fixed ~2s UNTimeIntervalNotificationTrigger.
  assert.equal(requests[0].trigger, null)
  assert.equal(added.length, 1)

  const { content } = requests[0]
  assert.equal(content.title, 'title')
  assert.equal(content.body, 'body')
  assert.equal(content.sound, 'default-sound')
  assert.equal(content.userInfo.dict.__NotificationType, 'nativescript-local-notifications')
  assert.equal(content.userInfo.dict.forceShowWhenInForeground, false)
})

test('iOS notify keeps the title slot and blank-body fallback', async () => {
  const { leaf, requests } = iosFixture()
  leaf.notify('title')
  await flush()
  assert.equal(requests[0].content.title, 'title')
  assert.equal(requests[0].content.body, ' ')
})

test('iOS notify drops denied sends without touching the center', async () => {
  const { leaf, requests, added } = iosFixture({ granted: false })
  leaf.notify('title', 'body')
  await flush()
  assert.equal(requests.length, 0)
  assert.equal(added.length, 0)
})

test('web absence is unsupported and notify throws UnavailabilityError', async () => {
  const leaf = loadLeaf('notifications.web', {
    desktopHost: () => null,
    UnavailabilityError,
  })
  assert.equal(leaf.supported, false)
  assert.equal(await leaf.isAvailable(), false)
  const response = await leaf.getPermissions()
  assert.equal(response.status, 'unsupported')
  assert.equal(response.granted, false)
  assert.equal(response.canAskAgain, false)
  assert.throws(() => leaf.notify('title'), UnavailabilityError)
})

test('web forwards granted notifications and preserves desktop host delivery', async () => {
  const calls: unknown[] = []
  class Notification {
    static permission = 'granted'
    constructor(title: string, options: unknown) {
      calls.push([title, options])
    }
  }

  const leaf = loadLeaf('notifications.web', { desktopHost: () => null, Notification })
  leaf.notify('title', 'body')
  assert.equal(calls.length, 1)
  Notification.permission = 'denied'
  leaf.notify('blocked')
  assert.equal(calls.length, 1)
  const hostLeaf = loadLeaf('notifications.web', {
    desktopHost: () => ({ notifications: { notify: async (title: string) => calls.push(title) } }),
  })

  hostLeaf.notify('host')
  await flush()
  assert.equal(calls[1], 'host')
})
