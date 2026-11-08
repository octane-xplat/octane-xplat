// Android leaf — the android.speech.SpeechRecognizer engine lives in
// android-engine.ts (unsuffixed so it stays out of platform-suffix
// resolution). The service surface is identical to every other leaf.
export { speechRecognition } from './android-engine'
