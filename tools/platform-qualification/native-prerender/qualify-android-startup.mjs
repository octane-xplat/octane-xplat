import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Single-process startup control; FrameTimeline timing is analyzed separately. */
export async function qualifyAndroidStartup({
  build,
  path,
  events,
  readReceipt,
  device,
  alive,
  pause,
  report,
}) {
  const check = (value, reason) => {
    if (!value) throw new Error(reason)
  }
  const ordinary = path === 'ordinary'
  const ready = events.findLast((event) => event.event === 'startup-complete')
  const begin = events.find((event) => event.event === 'engine-init-begin')
  const end = events.find((event) => event.event === 'engine-init-end')
  const application = events.find(
    (event) => event.phase === 'application' && event.epoch === ready?.epoch,
  )
  const initialAccepted = events.find(
    (event) => event.phase === (ordinary ? 'ordinary-fallback' : 'adopted'),
  )
  const accepted =
    events.find((event) => event.phase === 'startup-restored' && event.epoch === ready?.epoch) ??
    initialAccepted
  const initialApplication = events.find(
    (event) => event.phase === 'application' && event.epoch === initialAccepted?.epoch,
  )
  const expectedProcess = build.id + (ordinary ? ':ordinary' : '')
  check(
    ready &&
      begin &&
      end &&
      application &&
      accepted &&
      initialAccepted &&
      initialApplication &&
      ready.drawnSafeBounds &&
      ready.claims === (ordinary ? 0 : 19) &&
      ready.nodes.length === 19 &&
      ready.nodes[9].text === '3' &&
      ready.nodes[18].text === 'Ready when you are.' &&
      ready.nodes.every((node) => node.attached && node.width > 0 && node.height > 0) &&
      events.every(
        (event) =>
          event.processName === expectedProcess &&
          event.debuggable === false &&
          event.pid === ready.pid,
      ) &&
      begin.runtimeStarted === false &&
      begin.runtimeLibraryLoaded === false &&
      end.runtimeStarted &&
      end.runtimeStarts === 1 &&
      events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
      application.entryCounts.factories === 1 &&
      application.entryCounts.launches === 1 &&
      application.sameRoot &&
      initialApplication.catchUp === !ordinary &&
      initialApplication.entryBeforeCommit &&
      accepted.elapsedRealtimeNanos < ready.elapsedRealtimeNanos,
    'Startup path, native tree, entry, process or VM invariants differ',
  )
  const native = events.find((event) => event.event === 'native-layout-before-runtime')
  if (ordinary) {
    const launch = events.find((event) => event.event === 'native-launch')
    check(
      begin.epoch === 0 &&
        end.elapsedRealtimeNanos < launch.elapsedRealtimeNanos &&
        !native &&
        !events.some((event) => event.event === 'native-home-decoded') &&
        initialAccepted.adoptionFactoryInstalled === false,
      'Ordinary control did not start JS eagerly in Application before Activity creation',
    )
  } else
    check(
      native?.runtimeStarted === false &&
        native.runtimeLibraryLoaded === false &&
        native.drawnSafeBounds &&
        native.firstCommittedFrameNanos < begin.elapsedRealtimeNanos &&
        initialAccepted.hookCalls === 19 &&
        initialAccepted.prepareAbortMutationFree === false,
      'Native-first control lacks pre-VM submission or retained extra abort-probe work',
    )
  const target = ready.nodes[12]
  const x = target.screenLeft + target.width / 2,
    y = target.screenTop + target.height / 2
  await device(['shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y))])
  const deadline = Date.now() + 5000
  let input
  while (Date.now() < deadline) {
    alive()
    events = JSON.parse((await readReceipt('probe-result.json', 5000, true)).output)
    writeFileSync(join(report, 'result.json'), JSON.stringify(events, null, 2))
    check(
      !events.some((event) => event.event === 'failed' || event.phase === 'failed'),
      'Startup OS input failed',
    )
    input = events.find(
      (event) =>
        event.event === 'startup-input' && event.epoch === ready.epoch && event.touchUps === 1,
    )
    if (input) break
    await pause(50)
  }
  check(
    input?.handled &&
      input.touchDowns === 1 &&
      input.nodes[9].text === '4' &&
      input.nodes[18].text === 'One more step completed.' &&
      input.nodes.length === 19 &&
      input.nodes.every(
        (node, index) =>
          node.nativeIdentity === ready.nodes[index].nativeIdentity &&
          node.attached &&
          node.width > 0 &&
          node.height > 0,
      ),
    'Startup Home did not accept an OS tap while preserving native identities',
  )
  const proof = {
    path,
    runToken: ready.runToken,
    apkHash: build.apkHash,
    processName: expectedProcess,
    pid: ready.pid,
    processStartNanos: ready.processStartNanos,
    application,
    accepted,
    ready,
    input,
    liveTreeAcceptedMs: (accepted.elapsedRealtimeNanos - ready.processStartNanos) / 1000000,
    engineBeginMs: (begin.elapsedRealtimeNanos - ready.processStartNanos) / 1000000,
    engineEndMs: (end.elapsedRealtimeNanos - ready.processStartNanos) / 1000000,
    presentationQualified: false,
    speedupQualified: false,
    scope:
      'Single release startup control, no artificial250ms delay or abort/parity probe; live-tree acceptance is not first possible input or presentation timing',
  }
  writeFileSync(join(report, 'startup.json'), JSON.stringify(proof, null, 2))
  return events
}
