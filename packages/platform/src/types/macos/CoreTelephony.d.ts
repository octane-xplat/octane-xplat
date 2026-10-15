export declare const kCTErrorDomainPOSIX: number;

export declare const kCTErrorDomainNoError: number;

export declare const kCTErrorDomainMach: number;

export declare const CTCellularPlanCapability: {
  Only: 0,
  AndVoice: 1,
};

export declare const CTCellularPlanProvisioningAddPlanResult: {
  Unknown: 0,
  Fail: 1,
  Success: 2,
  Cancel: 3,
};

export declare const CTCellularDataRestrictedState: {
  RestrictedStateUnknown: 0,
  Restricted: 1,
  NotRestricted: 2,
};

export declare class CTError {
  constructor(init?: CTError);
  domain: number;
  error: number;
}
