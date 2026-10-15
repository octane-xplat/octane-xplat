import type { NSArray, NSError } from './Foundation'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSExtensionContext } from './Foundation'



export declare const FPUIErrorDomain: string;

export declare const FPUIExtensionErrorCode: {
  UserCancelled: 0,
  Failed: 1,
};

export declare class FPUIActionExtensionContext extends NSExtensionContext {
  readonly domainIdentifier: string;

  completeRequest(): void;

  cancelRequestWithError(error: NSError): void;
}

export declare class FPUIActionExtensionViewController extends NSViewController {
  // @ts-ignore MemberDecl.tsIgnore
  readonly extensionContext: FPUIActionExtensionContext;

  prepareForError(error: NSError): void;

  prepareForActionWithIdentifierItemIdentifiers(actionIdentifier: string, itemIdentifiers: NSArray<interop.Object> | Array<interop.Object>): void;
}
