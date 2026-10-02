import { useCallback, useEffect, useRef, useState } from 'octane';
import type { UseChatDictationOptions, UseChatDictationReturn } from './props';
import { useSpeechRecognition } from './useSpeechRecognition.web.tsrx';

interface VolumeAnalyser {
	calibrate: () => void;
	getVolume: () => number;
	getBands: (count: number) => number[];
	getRawBands: (count: number) => number[];
	cleanup: () => void;
}

async function createVolumeAnalyser(getCtx: () => any): Promise<VolumeAnalyser | null> {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const audioContext = getCtx();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.5;
		source.connect(analyser);

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		const noiseFloor = new Float32Array(analyser.frequencyBinCount);
		let calibrationSamples = 0;
		const CALIBRATION_FRAMES = 60;

		function calibrate() {
			analyser.getByteFrequencyData(dataArray);
			calibrationSamples++;
			for (let i = 0; i < dataArray.length; i++) {
				const val = dataArray[i] / 255;
				if (val > noiseFloor[i]) noiseFloor[i] = val;
			}
		}

		function getCleanBin(i: number): number {
			const raw = dataArray[i] / 255;
			if (calibrationSamples < CALIBRATION_FRAMES) return 0;
			return Math.max(0, raw - noiseFloor[i] * 1.1);
		}

		const bandsFor = (count: number, clean: boolean) => {
			analyser.getByteFrequencyData(dataArray);
			if (clean && calibrationSamples < CALIBRATION_FRAMES) calibrate();
			const bands: number[] = [];
			const binCount = dataArray.length;
			const voiceSplits = [3, 6, 11, 18, binCount];
			const splits = count <= voiceSplits.length ? voiceSplits.slice(0, count) : voiceSplits;
			let start = 1;
			for (let b = 0; b < splits.length; b++) {
				const end = splits[b];
				let sum = 0;
				for (let i = start; i < end; i++) {
					sum += clean ? getCleanBin(i) : dataArray[i] / 255;
				}

				bands.push(sum / (end - start));
				start = end;
			}

			return bands;
		};

		return {
			calibrate,
			getVolume: () => {
				analyser.getByteFrequencyData(dataArray);
				if (calibrationSamples < CALIBRATION_FRAMES) calibrate();
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) sum += getCleanBin(i);
				return sum / dataArray.length;
			},
			getBands: (count) => bandsFor(count, true),
			getRawBands: (count) => bandsFor(count, false),
			cleanup: () => {
				source.disconnect();
				for (const track of stream.getTracks()) track.stop();
			},
		};
	} catch {
		return null;
	}
}

let _sharedAudioCtx: any = null;

function getDefaultAudioContext(): any {
	if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
		_sharedAudioCtx = new AudioContext();
	}

	if (_sharedAudioCtx.state === 'suspended') {
		void _sharedAudioCtx.resume();
	}

	return _sharedAudioCtx;
}

const isIOS =
	typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

function playPlop(freq: number, delay: number, getCtx: () => any, volume = 0.25) {
	try {
		const ctx = getCtx();
		const now = ctx.currentTime;
		const dur = freq < 200 ? 0.18 : 0.06;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq * 1.3, now + delay);
		osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.01);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.93, now + delay + dur);
		gain.gain.setValueAtTime(0.001, now);
		gain.gain.exponentialRampToValueAtTime(volume, now + delay);
		gain.exponentialRampToValueAtTime(volume * 0.2, now + delay + dur * 0.12);
		gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now + delay);
		osc.stop(now + delay + dur);
	} catch {
		/* audio cues are best-effort */
	}
}

function playStartSound(getCtx: () => any) {
	if (isIOS) return;
	playPlop(392, 0, getCtx);
	playPlop(523, 0.07, getCtx);
}

function playStopSound(getCtx: () => any) {
	if (isIOS) return;
	playPlop(523, 0, getCtx);
	playPlop(392, 0.07, getCtx);
}

/** Dictation for the chat composer — useSpeechRecognition plus a
 *  calibrated volume/bands analyser, start/stop audio cues, sustained-volume
 *  CAPS transform, and interim ghost text inside the composer input when
 *  `inputRef` is supplied (`.vx-chatinput` contenteditable). */
export function useChatDictation(options: UseChatDictationOptions = {}): UseChatDictationReturn {
	const {
		lang,
		continuous,
		interimResults,
		transformTranscript: userTransform,
		onTranscript: onTranscriptProp,
		onResult: onResultProp,
		onError,
		onStart: onStartProp,
		onEnd: onEndProp,
		hasSounds = false,
		audioContext: externalAudioContext,
		inputRef,
	} = options;

	const getAudioContext = useCallback(
		() => externalAudioContext ?? getDefaultAudioContext(),
		[externalAudioContext],
	);

	const [volume, setVolume] = useState(0);
	const [bands, setBands] = useState<number[]>([0, 0, 0, 0, 0]);
	const [rawBands, setRawBands] = useState<number[]>([0, 0, 0, 0, 0]);

	const volumeHistoryRef = useRef<number[]>([]);
	const getAudioContextRef = useRef(getAudioContext);
	getAudioContextRef.current = getAudioContext;
	const analyserRef = useRef<VolumeAnalyser | null>(null);
	const rafRef = useRef(0);
	const interimSpanRef = useRef<HTMLSpanElement | null>(null);

	const callbacksRef = useRef({ onTranscriptProp, onResultProp, onStartProp, onEndProp });
	callbacksRef.current = { onTranscriptProp, onResultProp, onStartProp, onEndProp };

	const startVolumePolling = useCallback(() => {
		const poll = () => {
			const analyser = analyserRef.current;
			if (analyser) {
				const vol = analyser.getVolume();
				setVolume(vol);
				const hist = volumeHistoryRef.current;
				hist.push(vol);
				if (hist.length > 30) hist.shift();
				setBands(analyser.getBands(5));
				setRawBands(analyser.getRawBands(5));
			}

			rafRef.current = requestAnimationFrame(poll);
		};

		rafRef.current = requestAnimationFrame(poll);
	}, []);

	const stopVolumePolling = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		setVolume(0);
		setBands([0, 0, 0, 0, 0]);
		setRawBands([0, 0, 0, 0, 0]);
		volumeHistoryRef.current = [];
		analyserRef.current?.cleanup();
		analyserRef.current = null;
	}, []);

	const getEditable = useCallback((): HTMLDivElement | null => {
		const active = document.activeElement;
		if (active?.getAttribute('contenteditable') === 'true') {
			return active as HTMLDivElement;
		}

		return document.querySelector<HTMLDivElement>(
			'.vx-chatinput [contenteditable="true"], [role="textbox"][contenteditable="true"]',
		);
	}, []);

	const insertInterimSpan = useCallback(() => {
		const editable = getEditable();
		if (!editable) return;
		const span = document.createElement('span');
		span.setAttribute('data-vx-chat-dictation-interim', '');
		span.contentEditable = 'false';
		span.className = 'vx-chatinput-interim';
		editable.appendChild(span);
		interimSpanRef.current = span;
		editable.dispatchEvent(new Event('input', { bubbles: true }));
	}, [getEditable]);

	const removeInterimSpan = useCallback(() => {
		const span = interimSpanRef.current;
		if (span?.isConnected) {
			try {
				span.remove();
			} catch {
				/* already removed */
			}
		}

		interimSpanRef.current = null;
	}, []);

	const transformTranscript = useCallback(
		(text: string) => {
			let t = text;
			if (userTransform) t = userTransform(t);
			// Sustained loud speech → CAPS LOCK.
			const hist = volumeHistoryRef.current;
			const avg = hist.length > 0 ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;
			if (avg >= 0.15 && hist.length >= 10) t = t.toUpperCase();
			return t;
		},
		[userTransform],
	);

	useEffect(
		() => () => {
			analyserRef.current?.cleanup();
			analyserRef.current = null;
			cancelAnimationFrame(rafRef.current);
		},
		[],
	);

	const speech = useSpeechRecognition({
		lang,
		continuous,
		interimResults,
		transformTranscript,
		onTranscript: (transcript, isFinal) => {
			if (inputRef) {
				if (isFinal) {
					removeInterimSpan();
					const handle = inputRef.current;
					if (handle) {
						handle.focus();
						handle.insertText(transcript + ' ');
					}

					callbacksRef.current.onResultProp?.(transcript);
					insertInterimSpan();
				} else {
					const span = interimSpanRef.current;
					if (span) {
						span.textContent = transcript;
					} else {
						insertInterimSpan();
						if (interimSpanRef.current) interimSpanRef.current.textContent = transcript;
					}
				}
			}

			callbacksRef.current.onTranscriptProp?.(transcript, isFinal);
		},
		onResult: inputRef ? undefined : onResultProp,
		onError,
		onStart: () => {
			if (hasSounds) playStartSound(getAudioContextRef.current);
			void createVolumeAnalyser(getAudioContextRef.current).then((analyser) => {
				if (analyser) {
					analyserRef.current = analyser;
					startVolumePolling();
				}
			});

			if (inputRef) insertInterimSpan();
			callbacksRef.current.onStartProp?.();
		},
		onEnd: () => {
			stopVolumePolling();
			if (hasSounds) playStopSound(getAudioContextRef.current);
			if (inputRef) {
				removeInterimSpan();
				getEditable()?.dispatchEvent(new Event('input', { bubbles: true }));
			}

			callbacksRef.current.onEndProp?.();
		},
	});

	const speechAbort = speech.abort;
	const wrappedAbort = useCallback(() => {
		speechAbort();
		stopVolumePolling();
	}, [speechAbort, stopVolumePolling]);

	return {
		isSupported: speech.isSupported,
		isListening: speech.isListening,
		isSpeaking: speech.isSpeaking,
		interimTranscript: speech.interimTranscript,
		volume,
		bands,
		rawBands,
		start: speech.start,
		stop: speech.stop,
		abort: wrappedAbort,
		toggle: speech.toggle,
	};
}
