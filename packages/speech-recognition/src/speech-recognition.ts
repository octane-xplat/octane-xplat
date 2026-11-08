// Native-lane default — NativeScript resolves ./speech-recognition to
// speech-recognition.ios.ts or speech-recognition.android.ts on device;
// this unsuffixed file is what any other importer of the native barrel
// sees. iOS and Android engines land in phases 2 and 4.
export { unsupportedSpeechRecognition as speechRecognition } from './unsupported'
