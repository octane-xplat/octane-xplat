import type { interop } from './objc-runtime'



export declare const kSMDomainSystemLaunchd: interop.Pointer;

export declare const kSMErrorLaunchDeniedByUser: number;

export declare const kSMErrorInvalidPlist: number;

export declare const kSMErrorJobPlistNotFound: number;

export declare const kSMErrorJobNotFound: number;

export declare const kSMErrorAuthorizationFailure: number;

export declare const kSMErrorInternalFailure: number;

export declare const kSMErrorDomainFramework: interop.Pointer;

export declare const kSMDomainUserLaunchd: interop.Pointer;

export declare const kSMErrorDomainLaunchd: interop.Pointer;

export declare const kSMErrorAlreadyRegistered: number;

export declare const kSMErrorDomainIPC: interop.Pointer;

export declare const kSMErrorServiceUnavailable: number;

export declare const kSMErrorJobMustBeEnabled: number;

export declare const kSMErrorInvalidSignature: number;

export declare const kSMErrorToolNotValid: number;

export declare const SMAppServiceStatus: {
  NotRegistered: 0,
  Enabled: 1,
  RequiresApproval: 2,
  NotFound: 3,
};

export declare function SMLoginItemSetEnabled(identifier: interop.Object, enabled: number): number;

export declare function SMJobCopyDictionary(domain: interop.Object, jobLabel: interop.Object): interop.Object;

export declare function SMCopyAllJobDictionaries(domain: interop.Object): interop.Object;

export declare function SMJobSubmit(domain: interop.Object, job: interop.Object, auth: interop.PointerConvertible, outError: interop.PointerConvertible): number;

export declare function SMJobRemove(domain: interop.Object, jobLabel: interop.Object, auth: interop.PointerConvertible, wait: number, outError: interop.PointerConvertible): number;

export declare function SMJobBless(domain: interop.Object, executableLabel: interop.Object, auth: interop.PointerConvertible, outError: interop.PointerConvertible): number;
