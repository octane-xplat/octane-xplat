// Native: the glb ships in the app bundle under src/assets; readBufferSync
// returns a real ArrayBuffer on both iOS (NSData -> interop) and Android.
import { getFileAccess, knownFolders, path } from '@nativescript/core'

export async function readModelBytes(): Promise<ArrayBuffer> {
  const file = path.join(knownFolders.currentApp().path, 'assets', 'DamagedHelmet.glb')
  return getFileAccess().readBufferSync(file)
}
