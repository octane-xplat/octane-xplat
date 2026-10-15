import type { NSCoder, NSCopying, NSDate, NSError, NSMeasurement, NSNumber, NSSecureCoding } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const CMHeadphoneActivityStatus: {
  Disconnected: 0,
  Connected: 1,
};

export declare const CMWaterSubmersionDepthState: {
  Unknown: 0,
  NotSubmerged: 100,
  SubmergedShallow: 200,
  SubmergedDeep: 300,
  ApproachingMaxDepth: 400,
  PastMaxDepth: 500,
  SensorDepthError: 600,
};

export declare const CMWaterSubmersionState: {
  Unknown: 0,
  NotSubmerged: 1,
  Submerged: 2,
};

export declare const CMPedometerEventType: {
  Pause: 0,
  Resume: 1,
};

export declare const CMDeviceMotionSensorLocation: {
  Default: 0,
  HeadphoneLeft: 1,
  HeadphoneRight: 2,
};

export declare const CMAttitudeReferenceFrame: {
  Arbitrary: 1,
  ArbitraryCorrected: 2,
  MagneticNorth: 4,
  TrueNorth: 8,
};

export declare const CMAuthorizationStatus: {
  NotDetermined: 0,
  Restricted: 1,
  Denied: 2,
  Authorized: 3,
};

export declare const CMFallDetectionEventUserResolution: {
  Confirmed: 0,
  Dismissed: 1,
  Rejected: 2,
  Unresponsive: 3,
};

export declare const CMOdometerOriginDevice: {
  Unknown: 0,
  Local: 1,
  Remote: 2,
};

export declare const CMError: {
  NULL: 100,
  DeviceRequiresMovement: 101,
  TrueNorthNotAvailable: 102,
  Unknown: 103,
  MotionActivityNotAvailable: 104,
  MotionActivityNotAuthorized: 105,
  MotionActivityNotEntitled: 106,
  InvalidParameter: 107,
  InvalidAction: 108,
  NotAvailable: 109,
  NotEntitled: 110,
  NotAuthorized: 111,
  NilData: 112,
  Size: 113,
};

export declare const CMMotionActivityConfidence: {
  Low: 0,
  Medium: 1,
  High: 2,
};

export declare const CMMagneticFieldCalibrationAccuracy: {
  Uncalibrated: -1,
  Low: 0,
  Medium: 1,
  High: 2,
};

export declare class CMMagneticField {
  constructor(init?: CMMagneticField);
  x: number;
  y: number;
  z: number;
}

export declare class CMRotationMatrix {
  constructor(init?: CMRotationMatrix);
  m11: number;
  m12: number;
  m13: number;
  m21: number;
  m22: number;
  m23: number;
  m31: number;
  m32: number;
  m33: number;
}

export declare class CMAcceleration {
  constructor(init?: CMAcceleration);
  x: number;
  y: number;
  z: number;
}

export declare class CMRotationRate {
  constructor(init?: CMRotationRate);
  x: number;
  y: number;
  z: number;
}

export declare class CMQuaternion {
  constructor(init?: CMQuaternion);
  x: number;
  y: number;
  z: number;
  w: number;
}

export declare class CMCalibratedMagneticField {
  constructor(init?: CMCalibratedMagneticField);
  field: CMMagneticField;
  accuracy: interop.Enum<typeof CMMagneticFieldCalibrationAccuracy>;
}

export declare class CMRotationRateData extends CMLogItem {
  readonly rotationRate: CMRotationRate;
}

export declare class CMPedometerEvent extends NSObject implements NSSecureCoding, NSCopying {
  readonly date: NSDate;

  readonly type: interop.Enum<typeof CMPedometerEventType>;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CMAttitude extends NSObject implements NSCopying, NSSecureCoding {
  readonly roll: number;

  readonly pitch: number;

  readonly yaw: number;

  readonly rotationMatrix: CMRotationMatrix;

  readonly quaternion: CMQuaternion;

  multiplyByInverseOfAttitude(attitude: CMAttitude): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class CMGyroData extends CMLogItem {
  readonly rotationRate: CMRotationRate;
}

export declare class CMRecordedRotationRateData extends CMRotationRateData {
  readonly startDate: NSDate;
}

export declare class CMLogItem extends NSObject implements NSSecureCoding, NSCopying {
  readonly timestamp: number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CMPedometer extends NSObject {
  static isStepCountingAvailable(): boolean;

  static isDistanceAvailable(): boolean;

  static isFloorCountingAvailable(): boolean;

  static isPaceAvailable(): boolean;

  queryPedometerDataFromDateToDateWithHandler(start: NSDate, end: NSDate, handler: (p1: CMPedometerData, p2: NSError) => void): void;

  startPedometerUpdatesFromDateWithHandler(start: NSDate, handler: (p1: CMPedometerData, p2: NSError) => void): void;

  stopPedometerUpdates(): void;
}

export declare class CMAmbientPressureData extends CMLogItem {
  readonly pressure: NSMeasurement;

  readonly temperature: NSMeasurement;
}

export declare class CMMagnetometerData extends CMLogItem {
  readonly magneticField: CMMagneticField;
}

export declare class CMDeviceMotion extends CMLogItem {
  readonly attitude: CMAttitude;

  readonly rotationRate: CMRotationRate;

  readonly gravity: CMAcceleration;

  readonly userAcceleration: CMAcceleration;

  readonly magneticField: CMCalibratedMagneticField;

  readonly heading: number;

  readonly headingAccuracy: number;

  readonly sensorLocation: interop.Enum<typeof CMDeviceMotionSensorLocation>;
}

export declare class CMOdometerData extends NSObject implements NSSecureCoding, NSCopying {
  readonly startDate: NSDate;

  readonly endDate: NSDate;

  readonly deltaDistance: number;

  readonly deltaDistanceAccuracy: number;

  readonly speed: number;

  readonly speedAccuracy: number;

  readonly gpsDate: NSDate;

  readonly deltaAltitude: number;

  readonly verticalAccuracy: number;

  readonly originDevice: interop.Enum<typeof CMOdometerOriginDevice>;

  readonly slope: NSNumber;

  readonly maxAbsSlope: NSNumber;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CMPedometerData extends NSObject implements NSSecureCoding, NSCopying {
  readonly startDate: NSDate;

  readonly endDate: NSDate;

  readonly numberOfSteps: NSNumber;

  readonly distance: NSNumber;

  readonly floorsAscended: NSNumber;

  readonly floorsDescended: NSNumber;

  readonly currentPace: NSNumber;

  readonly currentCadence: NSNumber;

  readonly averageActivePace: NSNumber;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CMAccelerometerData extends CMLogItem {
  readonly acceleration: CMAcceleration;
}
