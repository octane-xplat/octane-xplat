import type { NSArray, NSData, NSDictionary, NSError, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const CHHapticPatternKeyParameterCurve: string;

export declare const CHHapticPatternKeyParameter: string;

export declare const CHHapticPatternKeyEventParameters: string;

export declare const CHHapticPatternKeyEventWaveformPath: string;

export declare const CHHapticPatternKeyTime: string;

export declare const CHHapticPatternKeyPattern: string;

export declare const CHHapticPatternKeyVersion: string;

export declare const CHHapticEventTypeAudioCustom: string;

export declare const CHHapticEventTypeAudioContinuous: string;

export declare const CHHapticEventTypeHapticTransient: string;

export declare const CHHapticDynamicParameterIDAudioPitchControl: string;

export declare const CHHapticDynamicParameterIDAudioBrightnessControl: string;

export declare const CHHapticDynamicParameterIDAudioPanControl: string;

export declare const CHHapticDynamicParameterIDHapticReleaseTimeControl: string;

export declare const CHHapticEventParameterIDAudioPan: string;

export declare const CHHapticEventParameterIDAudioVolume: string;

export declare const CHHapticEventParameterIDReleaseTime: string;

export declare const CHHapticEventParameterIDAttackTime: string;

export declare const CHHapticEventParameterIDHapticSharpness: string;

export declare const CHHapticEventParameterIDAudioPitch: string;

export declare const CHHapticDynamicParameterIDHapticDecayTimeControl: string;

export declare const CHHapticPatternKeyParameterID: string;

export declare const CHHapticEventTypeHapticContinuous: string;

export declare const CHHapticDynamicParameterIDHapticIntensityControl: string;

export declare const CHHapticEventParameterIDHapticIntensity: string;

export declare const CHHapticEventParameterIDDecayTime: string;

export declare const CHHapticEventParameterIDSustained: string;

export declare const CHHapticPatternKeyParameterCurveControlPoints: string;

export declare const CHHapticDynamicParameterIDHapticAttackTimeControl: string;

export declare const CHHapticPatternKeyEvent: string;

export declare const CHHapticPatternKeyEventType: string;

export declare const CHHapticDynamicParameterIDAudioReleaseTimeControl: string;

export declare const CHHapticPatternKeyParameterValue: string;

export declare const CHHapticEventParameterIDAudioBrightness: string;

export declare const CHHapticDynamicParameterIDAudioVolumeControl: string;

export declare const CHHapticDynamicParameterIDAudioAttackTimeControl: string;

export declare const CHHapticPatternKeyEventDuration: string;

export declare const CoreHapticsErrorDomain: string;

export declare const CHHapticDynamicParameterIDHapticSharpnessControl: string;

export declare const CHHapticDynamicParameterIDAudioDecayTimeControl: string;

export declare const CHHapticEngineStoppedReason: {
  AudioSessionInterrupt: 1,
  ApplicationSuspended: 2,
  IdleTimeout: 3,
  NotifyWhenFinished: 4,
  EngineDestroyed: 5,
  GameControllerDisconnect: 6,
  SystemError: -1,
};

export declare const CHHapticErrorCode: {
  EngineNotRunning: -4805,
  OperationNotPermitted: -4806,
  EngineStartTimeout: -4808,
  NotSupported: -4809,
  ServerInitFailed: -4810,
  ServerInterrupted: -4811,
  InvalidPatternPlayer: -4812,
  InvalidPatternData: -4813,
  InvalidPatternDictionary: -4814,
  InvalidAudioSession: -4815,
  InvalidEngineParameter: -4816,
  InvalidParameterType: -4820,
  InvalidEventType: -4821,
  InvalidEventTime: -4822,
  InvalidEventDuration: -4823,
  InvalidAudioResource: -4824,
  ResourceNotAvailable: -4825,
  BadEventEntry: -4830,
  BadParameterEntry: -4831,
  InvalidTime: -4840,
  FileNotFound: -4851,
  InsufficientPower: -4897,
  UnknownError: -4898,
  MemoryError: -4899,
};

export declare const CHHapticEngineFinishedAction: {
  StopEngine: 1,
  LeaveEngineRunning: 2,
};

export declare interface CHHapticAdvancedPatternPlayer extends CHHapticPatternPlayer {
  pauseAtTimeError(time: number, outError: interop.PointerConvertible): boolean;

  resumeAtTimeError(time: number, outError: interop.PointerConvertible): boolean;

  seekToOffsetError(offsetTime: number, outError: interop.PointerConvertible): boolean;

  loopEnabled: boolean;

  loopEnd: number;

  playbackRate: number;

  isMuted: boolean;

  completionHandler: (p1: NSError) => void;
}

export declare class CHHapticAdvancedPatternPlayer extends NativeObject implements CHHapticAdvancedPatternPlayer {
}

export declare interface CHHapticPatternPlayer extends NSObjectProtocol {
  startAtTimeError(time: number, outError: interop.PointerConvertible): boolean;

  stopAtTimeError(time: number, outError: interop.PointerConvertible): boolean;

  sendParametersAtTimeError(parameters: NSArray<interop.Object> | Array<interop.Object>, time: number, outError: interop.PointerConvertible): boolean;

  scheduleParameterCurveAtTimeError(parameterCurve: CHHapticParameterCurve, time: number, outError: interop.PointerConvertible): boolean;

  cancelAndReturnError(outError: interop.PointerConvertible): boolean;

  isMuted: boolean;
}

export declare class CHHapticPatternPlayer extends NativeObject implements CHHapticPatternPlayer {
}

export declare interface CHHapticParameterAttributes extends NSObjectProtocol {
  readonly minValue: number;

  readonly maxValue: number;

  readonly defaultValue: number;
}

export declare class CHHapticParameterAttributes extends NativeObject implements CHHapticParameterAttributes {
}

export declare interface CHHapticDeviceCapability {
  readonly supportsHaptics: boolean;

  readonly supportsAudio: boolean;

  attributesForEventParameterEventTypeError(inParameter: string, type: string, outError: interop.PointerConvertible): CHHapticParameterAttributes;

  attributesForDynamicParameterError(inParameter: string, outError: interop.PointerConvertible): CHHapticParameterAttributes;
}

export declare class CHHapticDeviceCapability extends NativeObject implements CHHapticDeviceCapability {
}

export declare class CHHapticPattern extends NSObject {
  readonly duration: number;

  initWithEventsParametersError(events: NSArray<interop.Object> | Array<interop.Object>, parameters: NSArray<interop.Object> | Array<interop.Object>, outError: interop.PointerConvertible): this;

  initWithEventsParameterCurvesError(events: NSArray<interop.Object> | Array<interop.Object>, parameterCurves: NSArray<interop.Object> | Array<interop.Object>, outError: interop.PointerConvertible): this;

  initWithDictionaryError(patternDict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): this;

  exportDictionaryAndReturnError(outError: interop.PointerConvertible): NSDictionary;
}

export declare class CHHapticEvent extends NSObject {
  readonly type: string;

  readonly eventParameters: NSArray;

  relativeTime: number;

  duration: number;

  initWithEventTypeParametersRelativeTime(type: string, eventParams: NSArray<interop.Object> | Array<interop.Object>, time: number): this;

  initWithEventTypeParametersRelativeTimeDuration(type: string, eventParams: NSArray<interop.Object> | Array<interop.Object>, time: number, duration: number): this;

  initWithAudioResourceIDParametersRelativeTime(resID: number, eventParams: NSArray<interop.Object> | Array<interop.Object>, time: number): this;

  initWithAudioResourceIDParametersRelativeTimeDuration(resID: number, eventParams: NSArray<interop.Object> | Array<interop.Object>, time: number, duration: number): this;
}

export declare class CHHapticParameterCurve extends NSObject {
  readonly parameterID: string;

  relativeTime: number;

  readonly controlPoints: NSArray;

  initWithParameterIDControlPointsRelativeTime(parameterID: string, controlPoints: NSArray<interop.Object> | Array<interop.Object>, relativeTime: number): this;
}

export declare class CHHapticDynamicParameter extends NSObject {
  readonly parameterID: string;

  value: number;

  relativeTime: number;

  initWithParameterIDValueRelativeTime(parameterID: string, value: number, time: number): this;
}

export declare class CHHapticEventParameter extends NSObject {
  readonly parameterID: string;

  value: number;

  initWithParameterIDValue(parameterID: string, value: number): this;
}

export declare class CHHapticParameterCurveControlPoint extends NSObject {
  relativeTime: number;

  value: number;

  initWithRelativeTimeValue(time: number, value: number): this;
}

export declare class CHHapticEngine extends NSObject {
  static capabilitiesForHardware(): CHHapticDeviceCapability;

  readonly currentTime: number;

  stoppedHandler: (p1: interop.Enum<typeof CHHapticEngineStoppedReason>) => void;

  resetHandler: () => void;

  playsHapticsOnly: boolean;

  isMutedForAudio: boolean;

  isMutedForHaptics: boolean;

  autoShutdownEnabled: boolean;

  initAndReturnError(error: interop.PointerConvertible): this;

  initWithAudioSessionError(audioSession: AVAudioSession | null, error: interop.PointerConvertible): this;

  startWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  startAndReturnError(outError: interop.PointerConvertible): boolean;

  stopWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  notifyWhenPlayersFinished(finishedHandler: (p1: NSError) => interop.Enum<typeof CHHapticEngineFinishedAction>): void;

  createPlayerWithPatternError(pattern: CHHapticPattern, outError: interop.PointerConvertible): CHHapticPatternPlayer;

  createAdvancedPlayerWithPatternError(pattern: CHHapticPattern, outError: interop.PointerConvertible): CHHapticAdvancedPatternPlayer;

  registerAudioResourceOptionsError(resourceURL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): number;

  unregisterAudioResourceError(resourceID: number, outError: interop.PointerConvertible): boolean;

  playPatternFromURLError(fileURL: NSURL, outError: interop.PointerConvertible): boolean;

  playPatternFromDataError(data: NSData, outError: interop.PointerConvertible): boolean;

  isAutoShutdownEnabled(): boolean;
}
