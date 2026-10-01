/** @jsxImportSource @nativescript-community/octane */
import type { UseChatDictationOptions, UseChatDictationReturn } from './props';
import { useSpeechRecognition } from './useSpeechRecognition.tsrx';

/** Dictation — same contract as web, but there is no shared speech engine
 *  on native: `isSupported` is false and controls are inert (the speech
 *  recognition API is browser-only; a plugin leaf could host a real one). */
export function useChatDictation(options: UseChatDictationOptions = {}): UseChatDictationReturn {
	return useSpeechRecognition(options);
}
