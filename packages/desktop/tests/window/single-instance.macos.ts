import '@nativescript/macos-node-api'
import { app } from '@octane-xplat/desktop'
import { runMacOSApp } from '../../../macos-appkit/src/host.ts'


if (!app.supportsSingleInstanceLock) {
  throw new Error('The packaged host has no single-instance bridge')
}

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', (_event, argv, directory) => {
    const expected = ['résumé notes.txt', '--integration-flag']
    if (JSON.stringify(argv) !== JSON.stringify(expected) || !directory?.endsWith('/second-launch')) {
      throw new Error('The second launch did not preserve arguments and working directory')
    }
    console.log('DESKTOP_SECOND_INSTANCE_OK')
    Reflect.get(globalThis, '__xplatStopHost')()
  })
  void app.whenReady().then(() => console.log('DESKTOP_WAITING_FOR_SECOND_INSTANCE'))
  runMacOSApp({ title: 'Desktop second launch fixture' }, () => {})
} else {
  console.log('DESKTOP_REDIRECTED_OK')
}
