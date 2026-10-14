/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AEAssessmentErrorDomain: string;

declare const AEAutocorrectMode: {
  None: 0,
  Spelling: 1,
  Punctuation: 2,
};

declare const AEAssessmentErrorCode: {
  AEAssessmentErrorUnknown: 1,
};

declare interface AEAssessmentSessionDelegate extends NSObjectProtocol {
  assessmentSessionDidBegin?(session: AEAssessmentSession): void;

  assessmentSessionFailedToBeginWithError?(session: AEAssessmentSession, error: NSError): void;

  assessmentSessionWasInterruptedWithError?(session: AEAssessmentSession, error: NSError): void;

  assessmentSessionDidEnd?(session: AEAssessmentSession): void;
}

declare class AEAssessmentSessionDelegate extends NativeObject implements AEAssessmentSessionDelegate {
}

declare class AEAssessmentConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class AEAssessmentSession extends NSObject {
  delegate: AEAssessmentSessionDelegate;

  readonly active: boolean;

  initWithConfiguration(configuration: AEAssessmentConfiguration): this;

  begin(): void;

  end(): void;

  isActive(): boolean;
}

