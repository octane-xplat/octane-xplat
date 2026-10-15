import type { NSCopying, NSError } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const AEAssessmentErrorDomain: string;

export declare const AEAutocorrectMode: {
  None: 0,
  Spelling: 1,
  Punctuation: 2,
};

export declare const AEAssessmentErrorCode: {
  AEAssessmentErrorUnknown: 1,
};

export declare interface AEAssessmentSessionDelegate extends NSObjectProtocol {
  assessmentSessionDidBegin?(session: AEAssessmentSession): void;

  assessmentSessionFailedToBeginWithError?(session: AEAssessmentSession, error: NSError): void;

  assessmentSessionWasInterruptedWithError?(session: AEAssessmentSession, error: NSError): void;

  assessmentSessionDidEnd?(session: AEAssessmentSession): void;
}

export declare class AEAssessmentSessionDelegate extends NativeObject implements AEAssessmentSessionDelegate {
}

export declare class AEAssessmentConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class AEAssessmentSession extends NSObject {
  delegate: AEAssessmentSessionDelegate;

  readonly active: boolean;

  initWithConfiguration(configuration: AEAssessmentConfiguration): this;

  begin(): void;

  end(): void;

  isActive(): boolean;
}
