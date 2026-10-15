import type { AVAudioBuffer, AVAudioFormat } from './AVFAudio'

import type { MLModel } from './CoreML'

import type { CMTimeRange } from './CoreMedia'

import type { NSArray, NSError, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const SNErrorDomain: string;

export declare const SNErrorCode: {
  UnknownError: 1,
  OperationFailed: 2,
  InvalidFormat: 3,
  InvalidModel: 4,
  InvalidFile: 5,
};

export declare interface SNResultsObserving extends NSObjectProtocol {
  requestDidProduceResult(request: SNRequest, result: SNResult): void;

  requestDidFailWithError?(request: SNRequest, error: NSError): void;

  requestDidComplete?(request: SNRequest): void;
}

export declare class SNResultsObserving extends NativeObject implements SNResultsObserving {
}

export declare interface SNResult extends NSObjectProtocol {
}

export declare class SNResult extends NativeObject implements SNResult {
}

export declare interface SNRequest extends NSObjectProtocol {
}

export declare class SNRequest extends NativeObject implements SNRequest {
}

export declare class SNClassificationResult extends NSObject implements SNResult {
  readonly classifications: NSArray;

  readonly timeRange: CMTimeRange;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class SNClassification extends NSObject {
  readonly identifier: string;

  readonly confidence: number;
}

export declare class SNClassifySoundRequest extends NSObject implements SNRequest {
  overlapFactor: number;

  initWithMLModelError(mlModel: MLModel, error: interop.PointerConvertible): this;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class SNAudioFileAnalyzer extends NSObject {
  initWithURLError(url: NSURL, error: interop.PointerConvertible): this;

  addRequestWithObserverError(request: SNRequest, observer: SNResultsObserving, error: interop.PointerConvertible): boolean;

  removeRequest(request: SNRequest): void;

  removeAllRequests(): void;

  analyze(): void;

  analyzeWithCompletionHandler(completionHandler: (p1: boolean) => void): void;

  cancelAnalysis(): void;
}

export declare class SNAudioStreamAnalyzer extends NSObject {
  initWithFormat(format: AVAudioFormat): this;

  addRequestWithObserverError(request: SNRequest, observer: SNResultsObserving, error: interop.PointerConvertible): boolean;

  removeRequest(request: SNRequest): void;

  removeAllRequests(): void;

  analyzeAudioBufferAtAudioFramePosition(audioBuffer: AVAudioBuffer, audioFramePosition: number): void;

  completeAnalysis(): void;
}
