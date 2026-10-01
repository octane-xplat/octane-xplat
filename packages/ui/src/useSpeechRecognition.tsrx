/** @jsxImportSource @nativescript-community/octane */
import { useCallback } from 'octane';
import type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from './props';

const EMPTY: number[] = [0, 0, 0, 0, 0];
const noop = () => {};

/** Speech recognition is a browser API — native has no shared engine in
 *  `ui` (a plugin-backed leaf package could host one). The contract is
 *  honest rather than absent: `isSupported` is false and the controls are
 *  inert no-ops. */
export function useSpeechRecognition(
	_options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
	const start = useCallback(noop, []);
	const stop = useCallback(noop, []);
	const abort = useCallback(noop, []);
	const toggle = useCallback(noop, []);

	return {
		isSupported: false,
		isListening: false,
		isSpeaking: false,
		volume: 0,
		bands: EMPTY,
		rawBands: EMPTY,
		interimTranscript: '',
		start,
		stop,
		abort,
		toggle,
	};
}
