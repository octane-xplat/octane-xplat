export * from './types'
// Native + default lane. The unsuffixed specifier resolves to
// speech-recognition.ios.ts / .android.ts under NativeScript platform
// resolution and to speech-recognition.ts elsewhere — no eager platform
// imports, so this barrel stays loadable in any environment.
export { speechRecognition } from './speech-recognition'
