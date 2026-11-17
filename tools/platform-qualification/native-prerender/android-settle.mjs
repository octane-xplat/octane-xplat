import { execFile } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const pause = (ms) => new Promise((done) => setTimeout(done, ms))

// sys.boot_completed precedes System UI and launcher settling. On a cold
// swiftshader boot they can raise "Application Not Responding" dialogs 30-80s
// later; a fixture launched then loses focus or is recreated. Wait until the
// HOME activity holds focus for a stable window, dismissing those dialogs.
export async function settleAndroid({
  adb,
  serial,
  timeoutMs = 240000,
  stableMs = 15000,
  log = () => {},
}) {
  const shell = async (...args) =>
    (await run(adb, ['-s', serial, 'shell', ...args], { timeout: 15000 })).stdout.trim()
  // Re-resolve each poll: before user unlock, HOME resolves to Settings'
  // FallbackHome, which is not the launcher fixtures return to.
  const resolveHome = async () => {
    const home = (
      await shell(
        'cmd',
        'package',
        'resolve-activity',
        '--brief',
        '-a',
        'android.intent.action.MAIN',
        '-c',
        'android.intent.category.HOME',
      )
    )
      .split(/\r?\n/)
      .pop()
    // resolve-activity abbreviates the class (`pkg/.Name`); focus reports it in full.
    const [packageName, className = ''] = home.split('/')
    return className && !className.endsWith('FallbackHome')
      ? packageName + '/' + (className.startsWith('.') ? packageName : '') + className
      : undefined
  }
  const deadline = Date.now() + timeoutMs
  let stableSince
  let dismissed = 0
  let home

  while (Date.now() < deadline) {
    home = await resolveHome()
    const focus = (await shell('dumpsys', 'window')).match(/mCurrentFocus=(.*)/)?.[1] ?? ''

    if (focus.includes('Not Responding')) {
      dismissed++
      log('dismissing boot dialog: ' + focus)
      await shell('am', 'broadcast', '-a', 'android.intent.action.CLOSE_SYSTEM_DIALOGS')
      stableSince = undefined
    } else if (home && focus.includes(home)) {
      stableSince ??= Date.now()
      if (Date.now() - stableSince >= stableMs) {
        return { home, dismissed }
      }
    } else {
      stableSince = undefined
    }
    await pause(2000)
  }
  throw new Error('Android launcher did not settle after boot: ' + home)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [adb, serial] = process.argv.slice(2)
  const result = await settleAndroid({ adb, serial, log: (line) => console.log(line) })
  console.log('Android settled: ' + JSON.stringify(result))
}
