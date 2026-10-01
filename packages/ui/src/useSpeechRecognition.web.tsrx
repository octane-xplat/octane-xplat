import { useCallback, useEffect, useMemo, useRef, useState } from 'octane';
import type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from './props';

type SpeechRecognitionInstance = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onstart: (() => void) | null;
	onend: (() => void) | null;
	onresult: ((event: any) => void) | null;
	onspeechstart: (() => void) | null;
	onspeechend: (() => void) | null;
	onerror: ((event: { error: string; message?: string }) => void) | null;
	onnomatch: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
	if (typeof window === 'undefined') return null;
	const w = window as any;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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

/** Web SpeechRecognition wrapper: start/stop/abort/toggle, interim +
 *  final transcripts, live mic volume + voice bands via an AudioContext
 *  analyser with noise-floor calibration. */
export function useSpeechRecognition(
	options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
	const {
		lang,
		continuous = true,
		interimResults = true,
		onTranscript,
		onResult,
		onError,
		onStart,
		onEnd,
		audioContext: externalAudioContext,
		transformTranscript,
	} = options;

	const getAudioContext = useCallback(
		() => externalAudioContext ?? getDefaultAudioContext(),
		[externalAudioContext],
	);

	const isSupported = useMemo(() => getSpeechRecognition() != null, []);
	const [isListening, setIsListening] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [volume, setVolume] = useState(0);
	const [bands, setBands] = useState<number[]>([0, 0, 0, 0, 0]);
	const [rawBands, setRawBands] = useState<number[]>([0, 0, 0, 0, 0]);
	const [interimTranscript, setInterimTranscript] = useState('');

	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
	const getAudioContextRef = useRef(getAudioContext);
	getAudioContextRef.current = getAudioContext;
	const analyserRef = useRef<VolumeAnalyser | null>(null);
	const rafRef = useRef(0);

	const callbacksRef = useRef({ onTranscript, onResult, onError, onStart, onEnd, transformTranscript });
	callbacksRef.current = { onTranscript, onResult, onError, onStart, onEnd, transformTranscript };

	useEffect(
		() => () => {
			recognitionRef.current?.abort();
			recognitionRef.current = null;
			analyserRef.current?.cleanup();
			analyserRef.current = null;
			cancelAnimationFrame(rafRef.current);
		},
		[],
	);

	const startVolumePolling = useCallback(() => {
		const poll = () => {
			const a = analyserRef.current;
			if (a) {
				setVolume(a.getVolume());
				setBands(a.getBands(5));
				setRawBands(a.getRawBands(5));
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
		analyserRef.current?.cleanup();
		analyserRef.current = null;
	}, []);

	const start = useCallback(() => {
		const SR = getSpeechRecognition();
		if (!SR) return;
		recognitionRef.current?.abort();
		const recognition = new SR();
		if (lang) recognition.lang = lang;
		recognition.continuous = continuous;
		recognition.interimResults = interimResults;

		recognition.onstart = () => {
			setIsListening(true);
			callbacksRef.current.onStart?.();
			void createVolumeAnalyser(getAudioContextRef.current).then((a) => {
				if (a) {
					analyserRef.current = a;
					startVolumePolling();
				}
			});
		};

		recognition.onend = () => {
			setIsListening(false);
			setIsSpeaking(false);
			setInterimTranscript('');
			stopVolumePolling();
			callbacksRef.current.onEnd?.();
		};

		recognition.onspeechstart = () => setIsSpeaking(true);
		recognition.onspeechend = () => setIsSpeaking(false);

		recognition.onresult = (event: any) => {
			let interim = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				let transcript = result[0].transcript;
				if (callbacksRef.current.transformTranscript) {
					transcript = callbacksRef.current.transformTranscript(transcript);
				}
				if (result.isFinal) {
					callbacksRef.current.onResult?.(transcript);
					callbacksRef.current.onTranscript?.(transcript, true);
					setInterimTranscript('');
				} else {
					interim += transcript;
				}
			}
			if (interim) {
				setInterimTranscript(interim);
				callbacksRef.current.onTranscript?.(interim, false);
			}
		};

		recognition.onerror = (event) => {
			callbacksRef.current.onError?.({ error: event.error, message: event.message });
		};

		recognition.onnomatch = () => {
			callbacksRef.current.onError?.({ error: 'no-speech', message: 'No speech detected' });
		};

		recognitionRef.current = recognition;
		recognition.start();
	}, [lang, continuous, interimResults, startVolumePolling, stopVolumePolling]);

	const stop = useCallback(() => {
		recognitionRef.current?.stop();
	}, []);

	const abort = useCallback(() => {
		recognitionRef.current?.abort();
		stopVolumePolling();
	}, [stopVolumePolling]);

	const toggle = useCallback(() => {
		if (isListening) stop();
		else start();
	}, [isListening, start, stop]);

	return {
		isSupported,
		isListening,
		isSpeaking,
		volume,
		bands,
		rawBands,
		interimTranscript,
		start,
		stop,
		abort,
		toggle,
	};
}
