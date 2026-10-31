/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AVSpeechUtteranceDefaultSpeechRate: number

declare const AVSpeechUtteranceMaximumSpeechRate: number

declare const AVAudioUnitComponentManagerRegistrationsChangedNotification: string

declare const AVAudioUnitComponentTagsDidChangeNotification: string

declare const AVAudioUnitTypeMIDIProcessor: string

declare const AVAudioUnitTypeGenerator: string

declare const AVAudioUnitTypeMixer: string

declare const AVAudioUnitTypeFormatConverter: string

declare const AVAudioUnitTypeMusicDevice: string

declare const AVAudioSessionPolarPatternSubcardioid: string

declare const AVAudioSessionPolarPatternOmnidirectional: string

declare const AVAudioSessionOrientationRight: string

declare const AVAudioSessionOrientationFront: string

declare const AVAudioSessionOrientationTop: string

declare const AVAudioSessionLocationLower: string

declare const AVSampleRateConverterAlgorithm_MinimumPhase: string

declare const AVSampleRateConverterAlgorithm_Mastering: string

declare const AVSampleRateConverterAlgorithm_Normal: string

declare const AVAudioBitRateStrategy_Variable: string

declare const AVAudioBitRateStrategy_VariableConstrained: string

declare const AVAudioBitRateStrategy_LongTermAverage: string

declare const AVAudioBitRateStrategy_Constant: string

declare const AVChannelLayoutKey: string

declare const AVSampleRateConverterAudioQualityKey: string

declare const AVEncoderBitDepthHintKey: string

declare const AVEncoderBitRateStrategyKey: string

declare const AVEncoderBitRatePerChannelKey: string

declare const AVEncoderAudioQualityForVBRKey: string

declare const AVEncoderAudioQualityKey: string

declare const AVAudioFileTypeKey: string

declare const AVLinearPCMIsNonInterleaved: string

declare const AVLinearPCMIsFloatKey: string

declare const AVLinearPCMBitDepthKey: string

declare const AVNumberOfChannelsKey: string

declare const AVFormatIDKey: string

declare const AVAudioUnitTypeMusicEffect: string

declare const AVAudioSessionOrientationBottom: string

declare const AVAudioUnitTypeOutput: string

declare const AVAudioSessionOrientationBack: string

declare const AVAudioSessionLocationUpper: string

declare const AVSpeechUtteranceMinimumSpeechRate: number

declare const AVAudioSessionInterruptionWasSuspendedKey: string

declare const AVAudioSessionPolarPatternCardioid: string

declare const AVSpeechSynthesisVoiceIdentifierAlex: string

declare const AVSpeechSynthesisIPANotationAttribute: string

declare const AVAudioUnitManufacturerNameApple: string

declare const AVAudioSessionOrientationLeft: string

declare const AVLinearPCMIsBigEndianKey: string

declare const AVSampleRateKey: string

declare const AVSampleRateConverterAlgorithmKey: string

declare const AVAudioEngineConfigurationChangeNotification: string

declare const AVAudioUnitTypeOfflineEffect: string

declare const AVEncoderBitRateKey: string

declare const AVAudioUnitTypeEffect: string

declare const AVAudioUnitTypePanner: string

declare const AVAudioApplicationMicrophoneInjectionPermission: {
	ServiceDisabled: 1936876659
	Undetermined: 1970168948
	Denied: 1684369017
	Granted: 1735552628
}

declare const AVSpeechSynthesisVoiceGender: {
	Unspecified: 0
	Male: 1
	Female: 2
}

declare const AVSpeechSynthesisVoiceQuality: {
	Default: 1
	Enhanced: 2
}

declare const AVAudioUnitDistortionPreset: {
	DrumsBitBrush: 0
	DrumsBufferBeats: 1
	DrumsLoFi: 2
	MultiBrokenSpeaker: 3
	MultiCellphoneConcert: 4
	MultiDecimated1: 5
	MultiDecimated2: 6
	MultiDecimated3: 7
	MultiDecimated4: 8
	MultiDistortedFunk: 9
	MultiDistortedCubed: 10
	MultiDistortedSquared: 11
	MultiEcho1: 12
	MultiEcho2: 13
	MultiEchoTight1: 14
	MultiEchoTight2: 15
	MultiEverythingIsBroken: 16
	SpeechAlienChatter: 17
	SpeechCosmicInterference: 18
	SpeechGoldenPi: 19
	SpeechRadioTower: 20
	SpeechWaves: 21
}

declare const AVMusicTrackLoopCount: {
	AVMusicTrackLoopCountForever: -1
}

declare const AVAudioPlayerNodeBufferOptions: {
	Loops: 1
	Interrupts: 2
	InterruptsAtLoop: 4
}

declare const AVAudioSessionRenderingMode: {
	NotApplicable: 0
	MonoStereo: 1
	Surround: 2
	SpatialAudio: 3
	DolbyAudio: 4
	DolbyAtmos: 5
}

declare const AVAudioSessionPromptStyle: {
	None: 1852796517
	Short: 1936224884
	Normal: 1852992876
}

declare const AVAudioSessionSetActiveOptions: {
	AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation: 1
}

declare const AVAudioSessionCategoryOptions: {
	MixWith: 1
	Duck: 2
}

declare const AVAudioSessionRouteChangeReason: {
	Unknown: 0
	NewDeviceAvailable: 1
	OldDeviceUnavailable: 2
	CategoryChange: 3
	Override: 4
	WakeFromSleep: 6
	NoSuitableRouteForCategory: 7
	RouteConfigurationChange: 8
}

declare const AVAudioSessionPortOverride: {
	AVAudioSessionPortOverrideNone: 0
}

declare const AVAudioSessionDeactivationOptions: {
	AVAudioSessionDeactivationOptionNone: 0
}

declare const AVAudioSessionActivationOptions: {
	AVAudioSessionActivationOptionNone: 0
}

declare const AVAudioEnvironmentOutputType: {
	Auto: 0
	Headphones: 1
	BuiltInSpeakers: 2
	ExternalSpeakers: 3
}

declare const AVAudioEnvironmentDistanceAttenuationModel: {
	Exponential: 1
	Inverse: 2
	Linear: 3
}

declare const AVAudioUnitEQFilterType: {
	Parametric: 0
	LowPass: 1
	HighPass: 2
	ResonantLowPass: 3
	ResonantHighPass: 4
	BandPass: 5
	BandStop: 6
	LowShelf: 7
	HighShelf: 8
	ResonantLowShelf: 9
	ResonantHighShelf: 10
}

declare const AVAudioUnitReverbPreset: {
	SmallRoom: 0
	MediumRoom: 1
	LargeRoom: 2
	MediumHall: 3
	LargeHall: 4
	Plate: 5
	MediumChamber: 6
	LargeChamber: 7
	Cathedral: 8
	LargeRoom2: 9
	MediumHall2: 10
	MediumHall3: 11
	LargeHall2: 12
}

declare const AVAudio3DMixingSourceMode: {
	SpatializeIfMono: 0
	Bypass: 1
	PointSource: 2
	AmbienceBed: 3
}

declare const AVAudioConverterInputStatus: {
	HaveData: 0
	NoDataNow: 1
	EndOfStream: 2
}

declare const AVAudioConverterPrimeMethod: {
	Pre: 0
	Normal: 1
	None: 2
}

declare const AVAudioDynamicRangeControlConfiguration: {
	None: 0
	Music: 1
	Speech: 2
	Movie: 3
	Capture: 4
}

declare const AVAudioCommonFormat: {
	OtherFormat: 0
	PCMFormatFloat32: 1
	PCMFormatFloat64: 2
	PCMFormatInt16: 3
	PCMFormatInt32: 4
}

declare const AVAudioQuality: {
	Min: 0
	Low: 32
	Medium: 64
	High: 96
	Max: 127
}

declare const AVAudioStereoOrientation: {
	None: 0
	Portrait: 1
	PortraitUpsideDown: 2
	LandscapeRight: 3
	LandscapeLeft: 4
}

declare const AVAudioEngineManualRenderingError: {
	InvalidMode: -80800
	Initialized: -80801
	NotRunning: -80802
}

declare const AVAudioSessionInterruptionOptions: {
	AVAudioSessionInterruptionOptionShouldResume: 1
}

declare const AVAudioSessionIOType: {
	NotSpecified: 0
	Aggregated: 1
}

declare const AVSpeechBoundary: {
	Immediate: 0
	Word: 1
}

declare const AVAudioEngineManualRenderingStatus: {
	Error: -1
	Success: 0
	InsufficientDataFromInputNode: 1
	CannotDoInCurrentContext: 2
}

declare const AVAudioPlayerNodeCompletionCallbackType: {
	Consumed: 0
	Rendered: 1
	PlayedBack: 2
}

declare const AVMusicSequenceLoadOptions: {
	Preserve: 0
	ChannelsTo: 1
}

declare const AVAudioApplicationRecordPermission: {
	Undetermined: 1970168948
	Denied: 1684369017
	Granted: 1735552628
}

declare const AVAudioSessionInterruptionType: {
	Began: 1
	Ended: 0
}

declare const AVAudio3DMixingRenderingAlgorithm: {
	EqualPowerPanning: 0
	SphericalHead: 1
	HRTF: 2
	SoundField: 3
	StereoPassThrough: 5
	HRTFHQ: 6
	Auto: 7
}

declare const AVAudio3DMixingPointSourceInHeadMode: {
	Mono: 0
	Bypass: 1
}

declare const AVAudioConverterOutputStatus: {
	HaveData: 0
	InputRanDry: 1
	EndOfStream: 2
	Error: 3
}

declare const AVAudioSessionSilenceSecondaryAudioHintType: {
	Begin: 1
	End: 0
}

declare const AVAudioSessionMicrophoneInjectionMode: {
	None: 0
	SpokenAudio: 1
}

declare const AVAudioSessionInterruptionReason: {
	Default: 0
	AppWasSuspended: 1
	BuiltInMicMuted: 2
}

declare const AVAudioEngineManualRenderingMode: {
	Offline: 0
	Realtime: 1
}

declare const AVAudioRoutingArbitrationCategory: {
	Playback: 0
	PlayAndRecord: 1
	PlayAndRecordVoice: 2
}

declare const AVAudioSessionRouteSharingPolicy: {
	Default: 0
	LongFormAudio: 1
	Independent: 2
}

declare class AVAudio3DVectorOrientation {
	constructor(init?: AVAudio3DVectorOrientation)
	forward: AVAudio3DPoint
	up: AVAudio3DPoint
}

declare class AVAudio3DPoint {
	constructor(init?: AVAudio3DPoint)
	x: number
	y: number
	z: number
}

declare class _AVBeatRange {
	constructor(init?: _AVBeatRange)
	start: number
	length: number
}

declare class AVAudioConverterPrimeInfo {
	constructor(init?: AVAudioConverterPrimeInfo)
	leadingFrames: number
	trailingFrames: number
}

declare class AVAudio3DAngularOrientation {
	constructor(init?: AVAudio3DAngularOrientation)
	yaw: number
	pitch: number
	roll: number
}

declare interface AVAudio3DMixing extends NSObjectProtocol {
	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudio3DMixing extends NativeObject implements AVAudio3DMixing {}

declare interface AVSpeechSynthesizerDelegate extends NSObjectProtocol {
	speechSynthesizerDidStartSpeechUtterance?(
		synthesizer: AVSpeechSynthesizer,
		utterance: AVSpeechUtterance,
	): void

	speechSynthesizerDidFinishSpeechUtterance?(
		synthesizer: AVSpeechSynthesizer,
		utterance: AVSpeechUtterance,
	): void

	speechSynthesizerDidPauseSpeechUtterance?(
		synthesizer: AVSpeechSynthesizer,
		utterance: AVSpeechUtterance,
	): void

	speechSynthesizerDidContinueSpeechUtterance?(
		synthesizer: AVSpeechSynthesizer,
		utterance: AVSpeechUtterance,
	): void

	speechSynthesizerDidCancelSpeechUtterance?(
		synthesizer: AVSpeechSynthesizer,
		utterance: AVSpeechUtterance,
	): void

	speechSynthesizerWillSpeakRangeOfSpeechStringUtterance?(
		synthesizer: AVSpeechSynthesizer,
		characterRange: _NSRange,
		utterance: AVSpeechUtterance,
	): void
}

declare class AVSpeechSynthesizerDelegate
	extends NativeObject
	implements AVSpeechSynthesizerDelegate {}

declare interface AVAudioRecorderDelegate extends NSObjectProtocol {
	audioRecorderDidFinishRecordingSuccessfully?(recorder: AVAudioRecorder, flag: boolean): void

	audioRecorderEncodeErrorDidOccurError?(recorder: AVAudioRecorder, error: NSError | null): void
}

declare class AVAudioRecorderDelegate extends NativeObject implements AVAudioRecorderDelegate {}

declare interface AVAudioStereoMixing extends NSObjectProtocol {
	pan: number
}

declare class AVAudioStereoMixing extends NativeObject implements AVAudioStereoMixing {}

declare interface AVAudioMixing extends AVAudioStereoMixing, AVAudio3DMixing {
	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number
}

declare class AVAudioMixing extends NativeObject implements AVAudioMixing {}

declare interface AVAudioPlayerDelegate extends NSObjectProtocol {
	audioPlayerDidFinishPlayingSuccessfully?(player: AVAudioPlayer, flag: boolean): void

	audioPlayerDecodeErrorDidOccurError?(player: AVAudioPlayer, error: NSError | null): void
}

declare class AVAudioPlayerDelegate extends NativeObject implements AVAudioPlayerDelegate {}

declare class AVSpeechUtterance extends NSObject implements NSCopying, NSSecureCoding {
	static speechUtteranceWithString<This extends abstract new (...args: any) => any>(
		this: This,
		string: string,
	): InstanceType<This>

	static speechUtteranceWithAttributedString<This extends abstract new (...args: any) => any>(
		this: This,
		string: NSAttributedString,
	): InstanceType<This>

	initWithString(string: string): this

	initWithAttributedString(string: NSAttributedString): this

	voice: AVSpeechSynthesisVoice

	readonly speechString: string

	readonly attributedSpeechString: NSAttributedString

	rate: number

	pitchMultiplier: number

	volume: number

	prefersAssistiveTechnologySettings: boolean

	preUtteranceDelay: number

	postUtteranceDelay: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class AVAudioUnitTimePitch extends AVAudioUnitTimeEffect {
	rate: number

	pitch: number

	overlap: number
}

declare class AVAudioUnitTimeEffect extends AVAudioUnit {
	initWithAudioComponentDescription(audioComponentDescription: AudioComponentDescription): this

	bypass: boolean
}

declare class AVAudioUnitMIDIInstrument extends AVAudioUnit implements AVAudioMixing {
	initWithAudioComponentDescription(description: AudioComponentDescription): this

	startNoteWithVelocityOnChannel(note: number, velocity: number, channel: number): void

	stopNoteOnChannel(note: number, channel: number): void

	sendControllerWithValueOnChannel(controller: number, value: number, channel: number): void

	sendPitchBendOnChannel(pitchbend: number, channel: number): void

	sendPressureOnChannel(pressure: number, channel: number): void

	sendPressureForKeyWithValueOnChannel(key: number, value: number, channel: number): void

	sendProgramChangeOnChannel(program: number, channel: number): void

	sendProgramChangeBankMSBBankLSBOnChannel(
		program: number,
		bankMSB: number,
		bankLSB: number,
		channel: number,
	): void

	sendMIDIEventData1Data2(midiStatus: number, data1: number, data2: number): void

	sendMIDIEventData1(midiStatus: number, data1: number): void

	sendMIDISysExEvent(midiData: NSData): void

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioUnitGenerator extends AVAudioUnit implements AVAudioMixing {
	initWithAudioComponentDescription(audioComponentDescription: AudioComponentDescription): this

	bypass: boolean

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioUnitDistortion extends AVAudioUnitEffect {
	loadFactoryPreset(preset: interop.Enum<typeof AVAudioUnitDistortionPreset>): void

	preGain: number

	wetDryMix: number
}

declare class AVAudioUnitComponentManager extends NSObject {
	readonly tagNames: NSArray

	readonly standardLocalizedTagNames: NSArray

	static sharedAudioUnitComponentManager<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	componentsMatchingPredicate(predicate: NSPredicate): NSArray

	componentsPassingTest(
		testHandler: (p1: AVAudioUnitComponent, p2: interop.PointerConvertible) => boolean,
	): NSArray

	componentsMatchingDescription(desc: AudioComponentDescription): NSArray
}

declare class AVAudioSinkNode extends AVAudioNode {
	initWithReceiverBlock(
		block: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number,
	): this
}

declare class AVAudioMixerNode extends AVAudioNode implements AVAudioMixing {
	init(): this

	outputVolume: number

	readonly nextAvailableInputBus: number

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioFile extends NSObject {
	init(): this

	initForReadingError(fileURL: NSURL, outError: interop.PointerConvertible): this

	initForReadingCommonFormatInterleavedError(
		fileURL: NSURL,
		format: interop.Enum<typeof AVAudioCommonFormat>,
		interleaved: boolean,
		outError: interop.PointerConvertible,
	): this

	initForWritingSettingsError(
		fileURL: NSURL,
		settings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		outError: interop.PointerConvertible,
	): this

	initForWritingSettingsCommonFormatInterleavedError(
		fileURL: NSURL,
		settings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		format: interop.Enum<typeof AVAudioCommonFormat>,
		interleaved: boolean,
		outError: interop.PointerConvertible,
	): this

	readIntoBufferError(buffer: AVAudioPCMBuffer, outError: interop.PointerConvertible): boolean

	readIntoBufferFrameCountError(
		buffer: AVAudioPCMBuffer,
		frames: number,
		outError: interop.PointerConvertible,
	): boolean

	writeFromBufferError(buffer: AVAudioPCMBuffer, outError: interop.PointerConvertible): boolean

	readonly url: NSURL

	readonly fileFormat: AVAudioFormat

	readonly processingFormat: AVAudioFormat

	readonly length: number

	framePosition: number
}

declare class AVAudioOutputNode extends AVAudioIONode {}

declare class AVAudioMixingDestination extends NSObject implements AVAudioMixing {
	readonly connectionPoint: AVAudioConnectionPoint

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioConverter extends NSObject {
	initFromFormatToFormat(fromFormat: AVAudioFormat, toFormat: AVAudioFormat): this

	reset(): void

	readonly inputFormat: AVAudioFormat

	readonly outputFormat: AVAudioFormat

	get channelMap(): NSArray
	set channelMap(value: NSArray<interop.Object> | Array<interop.Object>)

	magicCookie: NSData

	downmix: boolean

	dither: boolean

	sampleRateConverterQuality: number

	sampleRateConverterAlgorithm: string

	primeMethod: interop.Enum<typeof AVAudioConverterPrimeMethod>

	primeInfo: AVAudioConverterPrimeInfo

	convertToBufferFromBufferError(
		outputBuffer: AVAudioPCMBuffer,
		inputBuffer: AVAudioPCMBuffer,
		outError: interop.PointerConvertible,
	): boolean

	convertToBufferErrorWithInputFromBlock(
		outputBuffer: AVAudioBuffer,
		outError: interop.PointerConvertible,
		inputBlock: (p1: number, p2: interop.PointerConvertible) => AVAudioBuffer,
	): interop.Enum<typeof AVAudioConverterOutputStatus>

	bitRate: number

	bitRateStrategy: string

	readonly maximumOutputPacketSize: number

	readonly availableEncodeBitRates: NSArray

	readonly applicableEncodeBitRates: NSArray

	readonly availableEncodeSampleRates: NSArray

	readonly applicableEncodeSampleRates: NSArray

	readonly availableEncodeChannelLayoutTags: NSArray
}

declare class AVAudioTime extends NSObject {
	initWithAudioTimeStampSampleRate(ts: interop.PointerConvertible, sampleRate: number): this

	initWithHostTime(hostTime: number): this

	initWithSampleTimeAtRate(sampleTime: number, sampleRate: number): this

	initWithHostTimeSampleTimeAtRate(hostTime: number, sampleTime: number, sampleRate: number): this

	static timeWithAudioTimeStampSampleRate<This extends abstract new (...args: any) => any>(
		this: This,
		ts: interop.PointerConvertible,
		sampleRate: number,
	): InstanceType<This>

	static timeWithHostTime<This extends abstract new (...args: any) => any>(
		this: This,
		hostTime: number,
	): InstanceType<This>

	static timeWithSampleTimeAtRate<This extends abstract new (...args: any) => any>(
		this: This,
		sampleTime: number,
		sampleRate: number,
	): InstanceType<This>

	static timeWithHostTimeSampleTimeAtRate<This extends abstract new (...args: any) => any>(
		this: This,
		hostTime: number,
		sampleTime: number,
		sampleRate: number,
	): InstanceType<This>

	static hostTimeForSeconds(seconds: number): number

	static secondsForHostTime(hostTime: number): number

	extrapolateTimeFromAnchor(anchorTime: AVAudioTime): AVAudioTime

	readonly hostTimeValid: boolean

	readonly hostTime: number

	readonly sampleTimeValid: boolean

	readonly sampleTime: number

	readonly sampleRate: number

	readonly audioTimeStamp: AudioTimeStamp

	isHostTimeValid(): boolean

	isSampleTimeValid(): boolean
}

declare class AVAudioChannelLayout extends NSObject implements NSSecureCoding {
	initWithLayoutTag(layoutTag: number): this

	initWithLayout(layout: interop.PointerConvertible): this

	isEqual(object: interop.Object): boolean

	static layoutWithLayoutTag<This extends abstract new (...args: any) => any>(
		this: This,
		layoutTag: number,
	): InstanceType<This>

	static layoutWithLayout<This extends abstract new (...args: any) => any>(
		this: This,
		layout: interop.PointerConvertible,
	): InstanceType<This>

	readonly layoutTag: number

	readonly layout: interop.Pointer

	readonly channelCount: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class AVAudioCompressedBuffer extends AVAudioBuffer {
	initWithFormatPacketCapacityMaximumPacketSize(
		format: AVAudioFormat,
		packetCapacity: number,
		maximumPacketSize: number,
	): this

	initWithFormatPacketCapacity(format: AVAudioFormat, packetCapacity: number): this

	readonly packetCapacity: number

	packetCount: number

	readonly maximumPacketSize: number

	readonly data: interop.Pointer

	readonly byteCapacity: number

	byteLength: number

	readonly packetDescriptions: interop.Pointer
}

declare class AVAudioBuffer extends NSObject implements NSCopying, NSMutableCopying {
	readonly format: AVAudioFormat

	readonly audioBufferList: interop.Pointer

	readonly mutableAudioBufferList: interop.Pointer

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class AVAudioUnitSampler extends AVAudioUnitMIDIInstrument {
	loadSoundBankInstrumentAtURLProgramBankMSBBankLSBError(
		bankURL: NSURL,
		program: number,
		bankMSB: number,
		bankLSB: number,
		outError: interop.PointerConvertible,
	): boolean

	loadInstrumentAtURLError(instrumentURL: NSURL, outError: interop.PointerConvertible): boolean

	loadAudioFilesAtURLsError(
		audioFiles: NSArray<interop.Object> | Array<interop.Object>,
		outError: interop.PointerConvertible,
	): boolean

	stereoPan: number

	masterGain: number

	globalTuning: number
}

declare class AVAudioEnvironmentNode extends AVAudioNode implements AVAudioMixing {
	init(): this

	outputType: interop.Enum<typeof AVAudioEnvironmentOutputType>

	outputVolume: number

	readonly nextAvailableInputBus: number

	listenerPosition: AVAudio3DPoint

	listenerVectorOrientation: AVAudio3DVectorOrientation

	listenerAngularOrientation: AVAudio3DAngularOrientation

	readonly distanceAttenuationParameters: AVAudioEnvironmentDistanceAttenuationParameters

	readonly reverbParameters: AVAudioEnvironmentReverbParameters

	readonly applicableRenderingAlgorithms: NSArray

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioPlayer extends NSObject {
	initWithContentsOfURLError(url: NSURL, outError: interop.PointerConvertible): this

	initWithDataError(data: NSData, outError: interop.PointerConvertible): this

	initWithContentsOfURLFileTypeHintError(
		url: NSURL,
		utiString: string | null,
		outError: interop.PointerConvertible,
	): this

	initWithDataFileTypeHintError(
		data: NSData,
		utiString: string | null,
		outError: interop.PointerConvertible,
	): this

	prepareToPlay(): boolean

	play(): boolean

	playAtTime(time: number): boolean

	pause(): void

	stop(): void

	readonly playing: boolean

	readonly numberOfChannels: number

	readonly duration: number

	currentDevice: string

	delegate: AVAudioPlayerDelegate

	readonly url: NSURL

	readonly data: NSData

	pan: number

	volume: number

	setVolumeFadeDuration(volume: number, duration: number): void

	enableRate: boolean

	rate: number

	currentTime: number

	readonly deviceCurrentTime: number

	numberOfLoops: number

	readonly settings: NSDictionary

	readonly format: AVAudioFormat

	meteringEnabled: boolean

	updateMeters(): void

	peakPowerForChannel(channelNumber: number): number

	averagePowerForChannel(channelNumber: number): number

	isPlaying(): boolean

	isMeteringEnabled(): boolean
}

declare class AVAudioFormat extends NSObject implements NSSecureCoding {
	initWithStreamDescription(asbd: interop.PointerConvertible): this

	initWithStreamDescriptionChannelLayout(
		asbd: interop.PointerConvertible,
		layout: AVAudioChannelLayout | null,
	): this

	initStandardFormatWithSampleRateChannels(sampleRate: number, channels: number): this

	initStandardFormatWithSampleRateChannelLayout(
		sampleRate: number,
		layout: AVAudioChannelLayout,
	): this

	initWithCommonFormatSampleRateChannelsInterleaved(
		format: interop.Enum<typeof AVAudioCommonFormat>,
		sampleRate: number,
		channels: number,
		interleaved: boolean,
	): this

	initWithCommonFormatSampleRateInterleavedChannelLayout(
		format: interop.Enum<typeof AVAudioCommonFormat>,
		sampleRate: number,
		interleaved: boolean,
		layout: AVAudioChannelLayout,
	): this

	initWithSettings(
		settings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCMAudioFormatDescription(formatDescription: interop.Object): this

	isEqual(object: interop.Object): boolean

	readonly standard: boolean

	readonly commonFormat: interop.Enum<typeof AVAudioCommonFormat>

	readonly channelCount: number

	readonly sampleRate: number

	readonly interleaved: boolean

	readonly streamDescription: interop.Pointer

	readonly channelLayout: AVAudioChannelLayout

	magicCookie: NSData

	readonly settings: NSDictionary

	readonly formatDescription: interop.Object

	isStandard(): boolean

	isInterleaved(): boolean

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class AVAudioSequencer extends NSObject {
	init(): this

	initWithAudioEngine(engine: AVAudioEngine): this

	loadFromURLOptionsError(
		fileURL: NSURL,
		options: interop.Enum<typeof AVMusicSequenceLoadOptions>,
		outError: interop.PointerConvertible,
	): boolean

	loadFromDataOptionsError(
		data: NSData,
		options: interop.Enum<typeof AVMusicSequenceLoadOptions>,
		outError: interop.PointerConvertible,
	): boolean

	writeToURLSMPTEResolutionReplaceExistingError(
		fileURL: NSURL,
		resolution: number,
		replace: boolean,
		outError: interop.PointerConvertible,
	): boolean

	dataWithSMPTEResolutionError(
		SMPTEResolution: number,
		outError: interop.PointerConvertible,
	): NSData

	secondsForBeats(beats: number): number

	beatsForSeconds(seconds: number): number

	readonly tracks: NSArray

	readonly tempoTrack: AVMusicTrack

	readonly userInfo: NSDictionary

	currentPositionInSeconds: number

	currentPositionInBeats: number

	readonly playing: boolean

	rate: number

	hostTimeForBeatsError(inBeats: number, outError: interop.PointerConvertible): number

	beatsForHostTimeError(inHostTime: number, outError: interop.PointerConvertible): number

	prepareToPlay(): void

	startAndReturnError(outError: interop.PointerConvertible): boolean

	stop(): void

	isPlaying(): boolean
}

declare class AVAudioUnitComponent extends NSObject {
	readonly name: string

	readonly typeName: string

	readonly localizedTypeName: string

	readonly manufacturerName: string

	readonly version: number

	readonly versionString: string

	readonly componentURL: NSURL

	readonly availableArchitectures: NSArray

	readonly sandboxSafe: boolean

	readonly hasMIDIInput: boolean

	readonly hasMIDIOutput: boolean

	readonly audioComponent: interop.Pointer

	get userTagNames(): NSArray
	set userTagNames(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly allTagNames: NSArray

	readonly audioComponentDescription: AudioComponentDescription

	readonly iconURL: NSURL

	readonly icon: NSImage

	readonly passesAUVal: boolean

	readonly hasCustomView: boolean

	readonly configurationDictionary: NSDictionary

	supportsNumberInputChannelsOutputChannels(
		numInputChannels: number,
		numOutputChannels: number,
	): boolean

	isSandboxSafe(): boolean
}

declare class AVMusicTrack extends NSObject {
	destinationAudioUnit: AVAudioUnit

	destinationMIDIEndpoint: number

	loopRange: _AVBeatRange

	loopingEnabled: boolean

	numberOfLoops: number

	offsetTime: number

	muted: boolean

	soloed: boolean

	lengthInBeats: number

	lengthInSeconds: number

	readonly timeResolution: number

	isLoopingEnabled(): boolean

	isMuted(): boolean

	isSoloed(): boolean
}

declare class AVAudioInputNode extends AVAudioIONode implements AVAudioMixing {
	setManualRenderingInputPCMFormatInputBlock(
		format: AVAudioFormat,
		block: (p1: number) => interop.Pointer,
	): boolean

	voiceProcessingBypassed: boolean

	voiceProcessingAGCEnabled: boolean

	voiceProcessingInputMuted: boolean

	isVoiceProcessingBypassed(): boolean

	isVoiceProcessingAGCEnabled(): boolean

	isVoiceProcessingInputMuted(): boolean

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioEnvironmentReverbParameters extends NSObject {
	enable: boolean

	level: number

	readonly filterParameters: AVAudioUnitEQFilterParameters

	loadFactoryReverbPreset(preset: interop.Enum<typeof AVAudioUnitReverbPreset>): void
}

declare class AVAudioUnitReverb extends AVAudioUnitEffect {
	loadFactoryPreset(preset: interop.Enum<typeof AVAudioUnitReverbPreset>): void

	wetDryMix: number
}

declare class AVSpeechSynthesizer extends NSObject {
	delegate: AVSpeechSynthesizerDelegate

	readonly speaking: boolean

	readonly paused: boolean

	speakUtterance(utterance: AVSpeechUtterance): void

	writeUtteranceToBufferCallback(
		utterance: AVSpeechUtterance,
		bufferCallback: (p1: AVAudioBuffer) => void,
	): void

	stopSpeakingAtBoundary(boundary: interop.Enum<typeof AVSpeechBoundary>): boolean

	pauseSpeakingAtBoundary(boundary: interop.Enum<typeof AVSpeechBoundary>): boolean

	continueSpeaking(): boolean

	isSpeaking(): boolean

	isPaused(): boolean
}

declare class AVAudioRecorder extends NSObject {
	initWithURLSettingsError(
		url: NSURL,
		settings: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		outError: interop.PointerConvertible,
	): this

	initWithURLFormatError(
		url: NSURL,
		format: AVAudioFormat,
		outError: interop.PointerConvertible,
	): this

	prepareToRecord(): boolean

	record(): boolean

	recordAtTime(time: number): boolean

	recordForDuration(duration: number): boolean

	recordAtTimeForDuration(time: number, duration: number): boolean

	pause(): void

	stop(): void

	deleteRecording(): boolean

	readonly recording: boolean

	readonly url: NSURL

	readonly settings: NSDictionary

	readonly format: AVAudioFormat

	delegate: AVAudioRecorderDelegate

	readonly currentTime: number

	readonly deviceCurrentTime: number

	meteringEnabled: boolean

	updateMeters(): void

	peakPowerForChannel(channelNumber: number): number

	averagePowerForChannel(channelNumber: number): number

	isRecording(): boolean

	isMeteringEnabled(): boolean
}

declare class AVAudioEnvironmentDistanceAttenuationParameters extends NSObject {
	distanceAttenuationModel: interop.Enum<typeof AVAudioEnvironmentDistanceAttenuationModel>

	referenceDistance: number

	maximumDistance: number

	rolloffFactor: number
}

declare class AVAudioUnitVarispeed extends AVAudioUnitTimeEffect {
	rate: number
}

declare class AVAudioConnectionPoint extends NSObject {
	initWithNodeBus(node: AVAudioNode, bus: number): this

	readonly node: AVAudioNode | null

	readonly bus: number
}

declare class AVAudioPlayerNode extends AVAudioNode implements AVAudioMixing {
	init(): this

	scheduleBufferCompletionHandler(
		buffer: AVAudioPCMBuffer,
		completionHandler: () => void | null,
	): void

	scheduleBufferCompletionCallbackTypeCompletionHandler(
		buffer: AVAudioPCMBuffer,
		callbackType: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		completionHandler: (
			p1: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		) => void | null,
	): void

	scheduleBufferAtTimeOptionsCompletionHandler(
		buffer: AVAudioPCMBuffer,
		when: AVAudioTime | null,
		options: interop.Enum<typeof AVAudioPlayerNodeBufferOptions>,
		completionHandler: () => void | null,
	): void

	scheduleBufferAtTimeOptionsCompletionCallbackTypeCompletionHandler(
		buffer: AVAudioPCMBuffer,
		when: AVAudioTime | null,
		options: interop.Enum<typeof AVAudioPlayerNodeBufferOptions>,
		callbackType: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		completionHandler: (
			p1: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		) => void | null,
	): void

	scheduleFileAtTimeCompletionHandler(
		file: AVAudioFile,
		when: AVAudioTime | null,
		completionHandler: () => void | null,
	): void

	scheduleFileAtTimeCompletionCallbackTypeCompletionHandler(
		file: AVAudioFile,
		when: AVAudioTime | null,
		callbackType: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		completionHandler: (
			p1: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		) => void | null,
	): void

	scheduleSegmentStartingFrameFrameCountAtTimeCompletionHandler(
		file: AVAudioFile,
		startFrame: number,
		numberFrames: number,
		when: AVAudioTime | null,
		completionHandler: () => void | null,
	): void

	scheduleSegmentStartingFrameFrameCountAtTimeCompletionCallbackTypeCompletionHandler(
		file: AVAudioFile,
		startFrame: number,
		numberFrames: number,
		when: AVAudioTime | null,
		callbackType: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		completionHandler: (
			p1: interop.Enum<typeof AVAudioPlayerNodeCompletionCallbackType>,
		) => void | null,
	): void

	stop(): void

	prepareWithFrameCount(frameCount: number): void

	play(): void

	playAtTime(when: AVAudioTime | null): void

	pause(): void

	nodeTimeForPlayerTime(playerTime: AVAudioTime): AVAudioTime | null

	playerTimeForNodeTime(nodeTime: AVAudioTime): AVAudioTime | null

	readonly playing: boolean

	isPlaying(): boolean

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioUnit extends AVAudioNode {
	static instantiateWithComponentDescriptionOptionsCompletionHandler(
		audioComponentDescription: AudioComponentDescription,
		options: interop.Enum<typeof AudioComponentInstantiationOptions>,
		completionHandler: (p1: AVAudioUnit, p2: NSError) => void | null,
	): void

	loadAudioUnitPresetAtURLError(url: NSURL, outError: interop.PointerConvertible): boolean

	readonly audioComponentDescription: AudioComponentDescription

	readonly audioUnit: interop.Pointer

	readonly AUAudioUnit: AUAudioUnit

	readonly name: string

	readonly manufacturerName: string

	readonly version: number
}

declare class AVAudioEngine extends NSObject {
	init(): this

	attachNode(node: AVAudioNode): void

	detachNode(node: AVAudioNode): void

	connectToFromBusToBusFormat(
		node1: AVAudioNode,
		node2: AVAudioNode,
		bus1: number,
		bus2: number,
		format: AVAudioFormat | null,
	): void

	connectToFormat(node1: AVAudioNode, node2: AVAudioNode, format: AVAudioFormat | null): void

	connectToConnectionPointsFromBusFormat(
		sourceNode: AVAudioNode,
		destNodes: NSArray<interop.Object> | Array<interop.Object>,
		sourceBus: number,
		format: AVAudioFormat | null,
	): void

	disconnectNodeInputBus(node: AVAudioNode, bus: number): void

	disconnectNodeInput(node: AVAudioNode): void

	disconnectNodeOutputBus(node: AVAudioNode, bus: number): void

	disconnectNodeOutput(node: AVAudioNode): void

	prepare(): void

	startAndReturnError(outError: interop.PointerConvertible): boolean

	pause(): void

	reset(): void

	stop(): void

	inputConnectionPointForNodeInputBus(node: AVAudioNode, bus: number): AVAudioConnectionPoint | null

	outputConnectionPointsForNodeOutputBus(node: AVAudioNode, bus: number): NSArray

	get musicSequence(): interop.Pointer
	set musicSequence(value: interop.PointerConvertible)

	readonly outputNode: AVAudioOutputNode

	readonly inputNode: AVAudioInputNode

	readonly mainMixerNode: AVAudioMixerNode

	readonly running: boolean

	autoShutdownEnabled: boolean

	readonly attachedNodes: NSSet

	enableManualRenderingModeFormatMaximumFrameCountError(
		mode: interop.Enum<typeof AVAudioEngineManualRenderingMode>,
		pcmFormat: AVAudioFormat,
		maximumFrameCount: number,
		outError: interop.PointerConvertible,
	): boolean

	disableManualRenderingMode(): void

	renderOfflineToBufferError(
		numberOfFrames: number,
		buffer: AVAudioPCMBuffer,
		outError: interop.PointerConvertible,
	): interop.Enum<typeof AVAudioEngineManualRenderingStatus>

	readonly manualRenderingBlock: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Enum<typeof AVAudioEngineManualRenderingStatus>

	readonly isInManualRenderingMode: boolean

	readonly manualRenderingMode: interop.Enum<typeof AVAudioEngineManualRenderingMode>

	readonly manualRenderingFormat: AVAudioFormat

	readonly manualRenderingMaximumFrameCount: number

	readonly manualRenderingSampleTime: number

	connectMIDIToFormatBlock(
		sourceNode: AVAudioNode,
		destinationNode: AVAudioNode,
		format: AVAudioFormat | null,
		tapBlock: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number | null,
	): void

	connectMIDIToNodesFormatBlock(
		sourceNode: AVAudioNode,
		destinationNodes: NSArray<interop.Object> | Array<interop.Object>,
		format: AVAudioFormat | null,
		tapBlock: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number | null,
	): void

	disconnectMIDIFrom(sourceNode: AVAudioNode, destinationNode: AVAudioNode): void

	disconnectMIDIFromNodes(
		sourceNode: AVAudioNode,
		destinationNodes: NSArray<interop.Object> | Array<interop.Object>,
	): void

	disconnectMIDIInput(node: AVAudioNode): void

	disconnectMIDIOutput(node: AVAudioNode): void

	isRunning(): boolean

	isAutoShutdownEnabled(): boolean
}

declare class AVAudioIONode extends AVAudioNode {
	readonly presentationLatency: number

	readonly audioUnit: interop.Pointer

	readonly voiceProcessingEnabled: boolean

	setVoiceProcessingEnabledError(enabled: boolean, outError: interop.PointerConvertible): boolean

	isVoiceProcessingEnabled(): boolean
}

declare class AVAudioSourceNode extends AVAudioNode implements AVAudioMixing {
	initWithRenderBlock(
		block: (
			p1: interop.PointerConvertible,
			p2: interop.PointerConvertible,
			p3: number,
			p4: interop.PointerConvertible,
		) => number,
	): this

	initWithFormatRenderBlock(
		format: AVAudioFormat,
		block: (
			p1: interop.PointerConvertible,
			p2: interop.PointerConvertible,
			p3: number,
			p4: interop.PointerConvertible,
		) => number,
	): this

	destinationForMixerBus(mixer: AVAudioNode, bus: number): AVAudioMixingDestination

	volume: number

	pan: number

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	renderingAlgorithm: interop.Enum<typeof AVAudio3DMixingRenderingAlgorithm>

	sourceMode: interop.Enum<typeof AVAudio3DMixingSourceMode>

	pointSourceInHeadMode: interop.Enum<typeof AVAudio3DMixingPointSourceInHeadMode>

	rate: number

	reverbBlend: number

	obstruction: number

	occlusion: number

	position: AVAudio3DPoint
}

declare class AVAudioUnitDelay extends AVAudioUnitEffect {
	delayTime: number

	feedback: number

	lowPassCutoff: number

	wetDryMix: number
}

declare class AVSpeechSynthesisVoice extends NSObject implements NSSecureCoding {
	static speechVoices(): NSArray

	static currentLanguageCode(): string

	static voiceWithLanguage(languageCode: string | null): AVSpeechSynthesisVoice

	static voiceWithIdentifier(identifier: string): AVSpeechSynthesisVoice

	readonly language: string

	readonly identifier: string

	readonly name: string

	readonly quality: interop.Enum<typeof AVSpeechSynthesisVoiceQuality>

	readonly gender: interop.Enum<typeof AVSpeechSynthesisVoiceGender>

	readonly audioFileSettings: NSDictionary

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class AVAudioPCMBuffer extends AVAudioBuffer {
	initWithPCMFormatFrameCapacity(format: AVAudioFormat, frameCapacity: number): this

	readonly frameCapacity: number

	frameLength: number

	readonly stride: number

	readonly floatChannelData: interop.Pointer

	readonly int16ChannelData: interop.Pointer

	readonly int32ChannelData: interop.Pointer
}

declare class AVAudioRoutingArbiter extends NSObject {
	static readonly sharedRoutingArbiter: AVAudioRoutingArbiter

	beginArbitrationWithCategoryCompletionHandler(
		category: interop.Enum<typeof AVAudioRoutingArbitrationCategory>,
		handler: (p1: boolean, p2: NSError) => void | null,
	): void

	leaveArbitration(): void
}

declare class AVAudioUnitEQ extends AVAudioUnitEffect {
	initWithNumberOfBands(numberOfBands: number): this

	readonly bands: NSArray

	globalGain: number
}

declare class AVAudioNode extends NSObject {
	reset(): void

	inputFormatForBus(bus: number): AVAudioFormat

	outputFormatForBus(bus: number): AVAudioFormat

	nameForInputBus(bus: number): string

	nameForOutputBus(bus: number): string

	installTapOnBusBufferSizeFormatBlock(
		bus: number,
		bufferSize: number,
		format: AVAudioFormat | null,
		tapBlock: (p1: AVAudioPCMBuffer, p2: AVAudioTime) => void,
	): void

	removeTapOnBus(bus: number): void

	readonly engine: AVAudioEngine

	readonly numberOfInputs: number

	readonly numberOfOutputs: number

	readonly lastRenderTime: AVAudioTime

	readonly AUAudioUnit: AUAudioUnit

	readonly latency: number

	readonly outputPresentationLatency: number
}

declare class AVAudioUnitEffect extends AVAudioUnit {
	initWithAudioComponentDescription(audioComponentDescription: AudioComponentDescription): this

	bypass: boolean
}

declare class AVAudioUnitEQFilterParameters extends NSObject {
	filterType: interop.Enum<typeof AVAudioUnitEQFilterType>

	frequency: number

	bandwidth: number

	gain: number

	bypass: boolean
}

declare class AVMIDIPlayer extends NSObject {
	initWithContentsOfURLSoundBankURLError(
		inURL: NSURL,
		bankURL: NSURL | null,
		outError: interop.PointerConvertible,
	): this

	initWithDataSoundBankURLError(
		data: NSData,
		bankURL: NSURL | null,
		outError: interop.PointerConvertible,
	): this

	prepareToPlay(): void

	play(completionHandler: () => void | null): void

	stop(): void

	readonly duration: number

	readonly playing: boolean

	rate: number

	currentPosition: number

	isPlaying(): boolean
}
