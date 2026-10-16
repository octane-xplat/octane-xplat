import type { AVAudioFormat, AVAudioPCMBuffer } from './AVFAudio'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSError,
	NSLocale,
	NSOperationQueue,
	NSSecureCoding,
	NSSet,
	NSURL,
	_NSRange,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const SFSpeechRecognitionTaskHint: {
	Unspecified: 0
	Dictation: 1
	Search: 2
	Confirmation: 3
}

export declare const SFSpeechRecognitionTaskState: {
	Starting: 0
	Running: 1
	Finishing: 2
	Canceling: 3
	Completed: 4
}

export declare const SFSpeechRecognizerAuthorizationStatus: {
	NotDetermined: 0
	Denied: 1
	Restricted: 2
	Authorized: 3
}

export declare interface SFSpeechRecognizerDelegate extends NSObjectProtocol {
	speechRecognizerAvailabilityDidChange?(
		speechRecognizer: SFSpeechRecognizer,
		available: boolean,
	): void
}

export declare class SFSpeechRecognizerDelegate
	extends NativeObject
	implements SFSpeechRecognizerDelegate {}

export declare interface SFSpeechRecognitionTaskDelegate extends NSObjectProtocol {
	speechRecognitionDidDetectSpeech?(task: SFSpeechRecognitionTask): void

	speechRecognitionTaskDidHypothesizeTranscription?(
		task: SFSpeechRecognitionTask,
		transcription: SFTranscription,
	): void

	speechRecognitionTaskDidFinishRecognition?(
		task: SFSpeechRecognitionTask,
		recognitionResult: SFSpeechRecognitionResult,
	): void

	speechRecognitionTaskFinishedReadingAudio?(task: SFSpeechRecognitionTask): void

	speechRecognitionTaskWasCancelled?(task: SFSpeechRecognitionTask): void

	speechRecognitionTaskDidFinishSuccessfully?(
		task: SFSpeechRecognitionTask,
		successfully: boolean,
	): void

	speechRecognitionTaskDidProcessAudioDuration?(
		task: SFSpeechRecognitionTask,
		duration: number,
	): void
}

export declare class SFSpeechRecognitionTaskDelegate
	extends NativeObject
	implements SFSpeechRecognitionTaskDelegate {}

export declare class SFAcousticFeature extends NSObject implements NSCopying, NSSecureCoding {
	readonly acousticFeatureValuePerFrame: NSArray

	readonly frameDuration: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SFTranscription extends NSObject implements NSCopying, NSSecureCoding {
	readonly formattedString: string

	readonly segments: NSArray

	readonly speakingRate: number

	readonly averagePauseDuration: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SFSpeechURLRecognitionRequest extends SFSpeechRecognitionRequest {
	initWithURL(URL: NSURL): this

	readonly URL: NSURL
}

export declare class SFSpeechRecognizer extends NSObject {
	static supportedLocales(): NSSet

	static authorizationStatus(): interop.Enum<typeof SFSpeechRecognizerAuthorizationStatus>

	static requestAuthorization(
		handler: (p1: interop.Enum<typeof SFSpeechRecognizerAuthorizationStatus>) => void,
	): void

	init(): this

	initWithLocale(locale: NSLocale): this

	readonly available: boolean

	readonly locale: NSLocale

	supportsOnDeviceRecognition: boolean

	delegate: SFSpeechRecognizerDelegate | null

	defaultTaskHint: interop.Enum<typeof SFSpeechRecognitionTaskHint>

	recognitionTaskWithRequestResultHandler(
		request: SFSpeechRecognitionRequest,
		resultHandler: (p1: SFSpeechRecognitionResult, p2: NSError) => void | null,
	): SFSpeechRecognitionTask

	recognitionTaskWithRequestDelegate(
		request: SFSpeechRecognitionRequest,
		delegate: SFSpeechRecognitionTaskDelegate,
	): SFSpeechRecognitionTask

	queue: NSOperationQueue

	isAvailable(): boolean
}

export declare class SFTranscriptionSegment extends NSObject implements NSCopying, NSSecureCoding {
	readonly substring: string

	readonly substringRange: _NSRange

	readonly timestamp: number

	readonly duration: number

	readonly confidence: number

	readonly alternativeSubstrings: NSArray

	readonly voiceAnalytics: SFVoiceAnalytics

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SFSpeechRecognitionTask extends NSObject {
	readonly state: interop.Enum<typeof SFSpeechRecognitionTaskState>

	readonly finishing: boolean

	finish(): void

	readonly cancelled: boolean

	cancel(): void

	readonly error: NSError

	isFinishing(): boolean

	isCancelled(): boolean
}

export declare class SFSpeechRecognitionRequest extends NSObject {
	taskHint: interop.Enum<typeof SFSpeechRecognitionTaskHint>

	shouldReportPartialResults: boolean

	get contextualStrings(): NSArray
	set contextualStrings(value: NSArray<interop.Object> | Array<interop.Object>)

	interactionIdentifier: string

	requiresOnDeviceRecognition: boolean
}

export declare class SFSpeechAudioBufferRecognitionRequest extends SFSpeechRecognitionRequest {
	readonly nativeAudioFormat: AVAudioFormat

	appendAudioPCMBuffer(audioPCMBuffer: AVAudioPCMBuffer): void

	appendAudioSampleBuffer(sampleBuffer: interop.Object): void

	endAudio(): void
}

export declare class SFSpeechRecognitionResult
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	readonly bestTranscription: SFTranscription

	readonly transcriptions: NSArray

	readonly final: boolean

	readonly speechRecognitionMetadata: SFSpeechRecognitionMetadata

	isFinal(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SFVoiceAnalytics extends NSObject implements NSCopying, NSSecureCoding {
	readonly jitter: SFAcousticFeature

	readonly shimmer: SFAcousticFeature

	readonly pitch: SFAcousticFeature

	readonly voicing: SFAcousticFeature

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
