import type { CHHapticEngine } from './CoreHaptics'

import type { NSArray, NSCoder, NSCopying, NSData, NSDictionary, NSSecureCoding, NSSet } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const GCInputLeftThumbstick: string;

export declare const GCKeyCodeF1: number;

export declare const GCKeyCodeKeypad7: number;

export declare const GCHapticsLocalityLeftHandle: string;

export declare const GCKeyKeypad6: string;

export declare const GCKeyLANG4: string;

export declare const GCKeyCodeLANG8: number;

export declare const GCControllerDidStopBeingCurrentNotification: string;

export declare const GCKeyOne: string;

export declare const GCKeyD: string;

export declare const GCKeyCodeKeyT: number;

export declare const GCMouseDidStopBeingCurrentNotification: string;

export declare const GCKeyboardDidConnectNotification: string;

export declare const GCControllerDidBecomeCurrentNotification: string;

export declare const GCControllerDidDisconnectNotification: string;

export declare const GCKeyCodeCloseBracket: number;

export declare const GCKeyLeftGUI: string;

export declare const GCKeyLeftAlt: string;

export declare const GCKeyLeftControl: string;

export declare const GCKeyLANG7: string;

export declare const GCKeyLANG5: string;

export declare const GCKeyLANG2: string;

export declare const GCKeyLANG1: string;

export declare const GCKeyInternational9: string;

export declare const GCKeyInternational7: string;

export declare const GCKeyInternational4: string;

export declare const GCKeyInternational2: string;

export declare const GCKeyNonUSBackslash: string;

export declare const GCKeyKeypad0: string;

export declare const GCKeyKeypad4: string;

export declare const GCKeyKeypad3: string;

export declare const GCKeyKeypad2: string;

export declare const GCKeyKeypadPlus: string;

export declare const GCKeyKeypadAsterisk: string;

export declare const GCKeyKeypadNumLock: string;

export declare const GCKeyDownArrow: string;

export declare const GCKeyPageDown: string;

export declare const GCKeyEnd: string;

export declare const GCKeyDeleteForward: string;

export declare const GCKeyPageUp: string;

export declare const GCKeyF11: string;

export declare const GCKeyF10: string;

export declare const GCKeyF9: string;

export declare const GCKeyF8: string;

export declare const GCKeyF7: string;

export declare const GCKeyF6: string;

export declare const GCKeyF5: string;

export declare const GCKeyF4: string;

export declare const GCKeyCapsLock: string;

export declare const GCKeyPeriod: string;

export declare const GCKeyComma: string;

export declare const GCKeySemicolon: string;

export declare const GCKeyNonUSPound: string;

export declare const GCKeyCloseBracket: string;

export declare const GCKeyEqualSign: string;

export declare const GCKeySpacebar: string;

export declare const GCKeyZero: string;

export declare const GCKeyNine: string;

export declare const GCKeyEight: string;

export declare const GCKeyFour: string;

export declare const GCKeyThree: string;

export declare const GCKeyZ: string;

export declare const GCKeyW: string;

export declare const GCKeyU: string;

export declare const GCKeyT: string;

export declare const GCKeyR: string;

export declare const GCKeyO: string;

export declare const GCKeyJ: string;

export declare const GCKeyG: string;

export declare const GCKeyF: string;

export declare const GCKeyE: string;

export declare const GCKeyC: string;

export declare const GCKeyA: string;

export declare const GCKeyCodeRightGUI: number;

export declare const GCKeyCodeRightShift: number;

export declare const GCKeyCodeLeftGUI: number;

export declare const GCKeyCodeLeftAlt: number;

export declare const GCKeyCodeLeftControl: number;

export declare const GCKeyCodeLANG9: number;

export declare const GCKeyCodeLANG5: number;

export declare const GCKeyCodeLANG4: number;

export declare const GCKeyCodeLANG3: number;

export declare const GCKeyCodeInternational8: number;

export declare const GCKeyCodeInternational5: number;

export declare const GCKeyCodeInternational4: number;

export declare const GCKeyCodeInternational2: number;

export declare const GCKeyCodeInternational1: number;

export declare const GCKeyCodeNonUSBackslash: number;

export declare const GCKeyCodeKeypadPeriod: number;

export declare const GCKeyCodeKeypad8: number;

export declare const GCKeyCodeKeypad3: number;

export declare const GCKeyCodeKeypad2: number;

export declare const GCKeyCodeKeypadEnter: number;

export declare const GCKeyCodeKeypadAsterisk: number;

export declare const GCKeyCodeKeypadSlash: number;

export declare const GCKeyCodeUpArrow: number;

export declare const GCKeyCodePageDown: number;

export declare const GCKeyCodeEnd: number;

export declare const GCKeyCodeScrollLock: number;

export declare const GCKeyCodeF11: number;

export declare const GCKeyCodeF10: number;

export declare const GCKeyCodeF9: number;

export declare const GCKeyCodeF8: number;

export declare const GCKeyCodeF7: number;

export declare const GCKeyCodeF6: number;

export declare const GCKeyCodeF4: number;

export declare const GCKeyCodeF2: number;

export declare const GCKeyCodeCapsLock: number;

export declare const GCKeyCodeComma: number;

export declare const GCKeyCodeOpenBracket: number;

export declare const GCKeyCodeTab: number;

export declare const GCKeyCodeEscape: number;

export declare const GCKeyCodeReturnOrEnter: number;

export declare const GCKeyCodeNine: number;

export declare const GCKeyCodeEight: number;

export declare const GCKeyCodeSeven: number;

export declare const GCKeyCodeSix: number;

export declare const GCKeyCodeTwo: number;

export declare const GCKeyCodeOne: number;

export declare const GCKeyCodeKeyZ: number;

export declare const GCKeyCodeKeyY: number;

export declare const GCKeyCodeKeyX: number;

export declare const GCKeyCodeKeyW: number;

export declare const GCKeyCodeKeyU: number;

export declare const GCKeyCodeKeyR: number;

export declare const GCKeyCodeKeyQ: number;

export declare const GCKeyCodeKeyM: number;

export declare const GCHapticsLocalityTriggers: string;

export declare const GCKeyCodeKeyK: number;

export declare const GCKeyCodeKeyG: number;

export declare const GCKeyCodeKeyF: number;

export declare const GCKeyCodeKeyE: number;

export declare const GCKeyCodeKeyC: number;

export declare const GCKeyCodeKeyA: number;

export declare const GCCurrentExtendedGamepadSnapshotDataVersion: interop.Enum<typeof GCExtendedGamepadSnapshotDataVersion>;

export declare const GCHapticsLocalityRightTrigger: string;

export declare const GCHapticsLocalityHandles: string;

export declare const GCHapticsLocalityAll: string;

export declare const GCInputXboxPaddleThree: string;

export declare const GCInputXboxPaddleOne: string;

export declare const GCInputRightTrigger: string;

export declare const GCInputLeftTrigger: string;

export declare const GCInputRightShoulder: string;

export declare const GCInputRightThumbstickButton: string;

export declare const GCInputDirectionPad: string;

export declare const GCInputButtonY: string;

export declare const GCInputButtonA: string;

export declare const GCKeyKeypad1: string;

export declare const GCKeyLeftArrow: string;

export declare const GCKeyB: string;

export declare const GCKeyCodeKeyD: number;

export declare const GCInputXboxPaddleFour: string;

export declare const GCKeyCodeGraveAccentAndTilde: number;

export declare const GCKeyCodeKeypad0: number;

export declare const GCKeySlash: string;

export declare const GCInputDualShockTouchpadTwo: string;

export declare const GCKeyS: string;

export declare const GCKeyCodeKeyP: number;

export declare const GCKeyInternational8: string;

export declare const GCKeyKeypad7: string;

export declare const GCKeyLANG8: string;

export declare const GCHapticDurationInfinite: number;

export declare const GCKeyKeypadPeriod: string;

export declare const GCKeyQ: string;

export declare const GCKeyCodeHyphen: number;

export declare const GCKeyKeypad8: string;

export declare const GCKeyCodeKeyL: number;

export declare const GCKeyCodeLeftArrow: number;

export declare const GCKeyCodeKeypad5: number;

export declare const GCInputLeftThumbstickButton: string;

export declare const GCKeyCodeKeyI: number;

export declare const GCKeyCodeRightControl: number;

export declare const GCInputXboxPaddleTwo: string;

export declare const GCKeyM: string;

export declare const GCKeyCodeKeyO: number;

export declare const GCKeyPause: string;

export declare const GCKeyGraveAccentAndTilde: string;

export declare const GCKeyCodeKeyH: number;

export declare const GCKeyH: string;

export declare const GCKeyV: string;

export declare const GCKeyRightGUI: string;

export declare const GCKeyFive: string;

export declare const GCKeyKeypadSlash: string;

export declare const GCKeyCodeKeypad9: number;

export declare const GCKeyRightShift: string;

export declare const GCInputButtonHome: string;

export declare const GCKeyTwo: string;

export declare const GCKeyCodeInternational3: number;

export declare const GCKeyDeleteOrBackspace: string;

export declare const GCKeyLANG9: string;

export declare const GCKeyCodeFour: number;

export declare const GCKeyScrollLock: string;

export declare const GCKeyboardDidDisconnectNotification: string;

export declare const GCKeyCodeSlash: number;

export declare const GCKeyCodeRightArrow: number;

export declare const GCKeyF12: string;

export declare const GCInputButtonB: string;

export declare const GCKeyInternational3: string;

export declare const GCKeyCodeDeleteOrBackspace: number;

export declare const GCKeyCodePeriod: number;

export declare const GCKeyInternational1: string;

export declare const GCKeyCodeDeleteForward: number;

export declare const GCControllerDidConnectNotification: string;

export declare const GCKeyRightAlt: string;

export declare const GCKeyY: string;

export declare const GCKeyLeftShift: string;

export declare const GCKeyCodeKeyV: number;

export declare const GCInputButtonOptions: string;

export declare const GCKeyN: string;

export declare const GCInputDualShockTouchpadButton: string;

export declare const GCKeyCodeKeyB: number;

export declare const GCKeyBackslash: string;

export declare const GCKeyCodeFive: number;

export declare const GCKeyCodePower: number;

export declare const GCKeyCodeKeypadNumLock: number;

export declare const GCKeyCodePageUp: number;

export declare const GCMouseDidBecomeCurrentNotification: string;

export declare const GCKeyCodeLANG7: number;

export declare const GCKeyPower: string;

export declare const GCKeyCodeKeyN: number;

export declare const GCInputButtonX: string;

export declare const GCKeyL: string;

export declare const GCKeyCodeHome: number;

export declare const GCKeyCodeInternational6: number;

export declare const GCKeyTab: string;

export declare const GCKeyCodePrintScreen: number;

export declare const GCKeyCodeInternational7: number;

export declare const GCHapticsLocalityDefault: string;

export declare const GCInputRightThumbstick: string;

export declare const GCKeyPrintScreen: string;

export declare const GCKeyCodeKeypadPlus: number;

export declare const GCKeyCodePause: number;

export declare const GCKeyCodeSemicolon: number;

export declare const GCKeyCodeKeypadHyphen: number;

export declare const GCKeyQuote: string;

export declare const GCInputButtonMenu: string;

export declare const GCKeyCodeLeftShift: number;

export declare const GCKeyCodeF5: number;

export declare const GCKeyUpArrow: string;

export declare const GCKeyOpenBracket: string;

export declare const GCKeyKeypad5: string;

export declare const GCKeyCodeSpacebar: number;

export declare const GCKeyReturnOrEnter: string;

export declare const GCKeyLANG6: string;

export declare const GCKeyCodeKeypad1: number;

export declare const GCKeySeven: string;

export declare const GCKeyCodeF3: number;

export declare const GCKeyCodeLANG1: number;

export declare const GCKeyCodeInsert: number;

export declare const GCMouseDidConnectNotification: string;

export declare const GCKeyCodeDownArrow: number;

export declare const GCKeyKeypad9: string;

export declare const GCKeyCodeNonUSPound: number;

export declare const GCKeyCodeKeyJ: number;

export declare const GCKeyHyphen: string;

export declare const GCKeySix: string;

export declare const GCCurrentMicroGamepadSnapshotDataVersion: interop.Enum<typeof GCMicroGamepadSnapshotDataVersion>;

export declare const GCMouseDidDisconnectNotification: string;

export declare const GCKeyCodeBackslash: number;

export declare const GCKeyP: string;

export declare const GCKeyF2: string;

export declare const GCKeyCodeApplication: number;

export declare const GCKeyK: string;

export declare const GCKeyInternational5: string;

export declare const GCKeyCodeKeypad6: number;

export declare const GCKeyF3: string;

export declare const GCKeyCodeRightAlt: number;

export declare const GCKeyCodeKeypad4: number;

export declare const GCKeyEscape: string;

export declare const GCKeyCodeLANG2: number;

export declare const GCInputLeftShoulder: string;

export declare const GCKeyCodeInternational9: number;

export declare const GCHapticsLocalityLeftTrigger: string;

export declare const GCKeyKeypadEnter: string;

export declare const GCKeyCodeLANG6: number;

export declare const GCKeyInternational6: string;

export declare const GCKeyRightControl: string;

export declare const GCKeyCodeKeypadEqualSign: number;

export declare const GCKeyCodeEqualSign: number;

export declare const GCKeyCodeKeyS: number;

export declare const GCKeyLANG3: string;

export declare const GCKeyKeypadHyphen: string;

export declare const GCKeyCodeZero: number;

export declare const GCHapticsLocalityRightHandle: string;

export declare const GCKeyX: string;

export declare const GCInputDualShockTouchpadOne: string;

export declare const GCKeyCodeThree: number;

export declare const GCKeyI: string;

export declare const GCKeyRightArrow: string;

export declare const GCKeyKeypadEqualSign: string;

export declare const GCKeyApplication: string;

export declare const GCKeyCodeF12: number;

export declare const GCKeyF1: string;

export declare const GCKeyHome: string;

export declare const GCKeyCodeQuote: number;

export declare const GCKeyInsert: string;

export declare const GCExtendedGamepadSnapshotDataVersion: {
  Version1: 256,
  Version2: 257,
};

export declare const GCTouchState: {
  Up: 0,
  Down: 1,
  Moving: 2,
};

export declare const GCMicroGamepadSnapshotDataVersion: {
  GCMicroGamepadSnapshotDataVersion1: 256,
};

export declare const GCDeviceBatteryState: {
  Unknown: -1,
  Discharging: 0,
  Charging: 1,
  Full: 2,
};

export declare const GCControllerPlayerIndex: {
  IndexUnset: -1,
  Index1: 0,
  Index2: 1,
  Index3: 2,
  Index4: 3,
};

export declare const GCSystemGestureState: {
  Enabled: 0,
  Disabled: 2,
  AlwaysReceive: 1,
};

export declare class GCEulerAngles {
  constructor(init?: GCEulerAngles);
  pitch: number;
  yaw: number;
  roll: number;
}

export declare class GCDualSenseAdaptiveTriggerPositionalAmplitudes {
  constructor(init?: GCDualSenseAdaptiveTriggerPositionalAmplitudes);
  values: unknown /* const array */;
}

export declare class GCMicroGamepadSnapshotData {
  constructor(init?: GCMicroGamepadSnapshotData);
  version: number;
  size: number;
  dpadX: number;
  dpadY: number;
  buttonA: number;
  buttonX: number;
}

export declare class GCDualSenseAdaptiveTriggerPositionalResistiveStrengths {
  constructor(init?: GCDualSenseAdaptiveTriggerPositionalResistiveStrengths);
  values: unknown /* const array */;
}

export declare class GCExtendedGamepadSnapShotDataV100 {
  constructor(init?: GCExtendedGamepadSnapShotDataV100);
  version: number;
  size: number;
  dpadX: number;
  dpadY: number;
  buttonA: number;
  buttonB: number;
  buttonX: number;
  buttonY: number;
  leftShoulder: number;
  rightShoulder: number;
  leftThumbstickX: number;
  leftThumbstickY: number;
  rightThumbstickX: number;
  rightThumbstickY: number;
  leftTrigger: number;
  rightTrigger: number;
}

export declare class GCExtendedGamepadSnapshotData {
  constructor(init?: GCExtendedGamepadSnapshotData);
  version: number;
  size: number;
  dpadX: number;
  dpadY: number;
  buttonA: number;
  buttonB: number;
  buttonX: number;
  buttonY: number;
  leftShoulder: number;
  rightShoulder: number;
  leftThumbstickX: number;
  leftThumbstickY: number;
  rightThumbstickX: number;
  rightThumbstickY: number;
  leftTrigger: number;
  rightTrigger: number;
  supportsClickableThumbsticks: boolean;
  leftThumbstickButton: boolean;
  rightThumbstickButton: boolean;
}

export declare class GCGamepadSnapShotDataV100 {
  constructor(init?: GCGamepadSnapShotDataV100);
  version: number;
  size: number;
  dpadX: number;
  dpadY: number;
  buttonA: number;
  buttonB: number;
  buttonX: number;
  buttonY: number;
  leftShoulder: number;
  rightShoulder: number;
}

export declare class GCQuaternion {
  constructor(init?: GCQuaternion);
  x: number;
  y: number;
  z: number;
  w: number;
}

export declare class GCRotationRate {
  constructor(init?: GCRotationRate);
  x: number;
  y: number;
  z: number;
}

export declare class GCAcceleration {
  constructor(init?: GCAcceleration);
  x: number;
  y: number;
  z: number;
}

export declare class GCMicroGamepadSnapShotDataV100 {
  constructor(init?: GCMicroGamepadSnapShotDataV100);
  version: number;
  size: number;
  dpadX: number;
  dpadY: number;
  buttonA: number;
  buttonX: number;
}

export declare function GCGamepadSnapShotDataV100FromNSData(snapshotData: interop.PointerConvertible, data: NSData): boolean;

export declare function NSDataFromGCGamepadSnapShotDataV100(snapshotData: interop.PointerConvertible): NSData;

export declare function GCExtendedGamepadSnapshotDataFromNSData(snapshotData: interop.PointerConvertible, data: NSData): boolean;

export declare function NSDataFromGCExtendedGamepadSnapshotData(snapshotData: interop.PointerConvertible): NSData;

export declare function GCExtendedGamepadSnapShotDataV100FromNSData(snapshotData: interop.PointerConvertible, data: NSData): boolean;

export declare function NSDataFromGCExtendedGamepadSnapShotDataV100(snapshotData: interop.PointerConvertible): NSData;

export declare function GCMicroGamepadSnapshotDataFromNSData(snapshotData: interop.PointerConvertible, data: NSData): boolean;

export declare function NSDataFromGCMicroGamepadSnapshotData(snapshotData: interop.PointerConvertible): NSData;

export declare function GCMicroGamepadSnapShotDataV100FromNSData(snapshotData: interop.PointerConvertible, data: NSData): boolean;

export declare function NSDataFromGCMicroGamepadSnapShotDataV100(snapshotData: interop.PointerConvertible): NSData;

export declare interface GCDirectionPadElementName extends GCPhysicalInputElementName {
}

export declare class GCDirectionPadElementName extends NativeObject implements GCDirectionPadElementName {
}

export declare interface GCSwitchElementName extends GCPhysicalInputElementName {
}

export declare class GCSwitchElementName extends NativeObject implements GCSwitchElementName {
}

export declare interface GCButtonElementName extends GCPhysicalInputElementName {
}

export declare class GCButtonElementName extends NativeObject implements GCButtonElementName {
}

export declare interface GCPhysicalInputElementName {
}

export declare class GCPhysicalInputElementName extends NativeObject implements GCPhysicalInputElementName {
}

export declare interface GCDevice extends NSObjectProtocol {
  handlerQueue: NSObject;

  readonly vendorName: string;

  readonly productCategory: string;

  readonly physicalInputProfile: GCPhysicalInputProfile;
}

export declare class GCDevice extends NativeObject implements GCDevice {
}

export declare interface GCAxisElementName extends GCPhysicalInputElementName {
}

export declare class GCAxisElementName extends NativeObject implements GCAxisElementName {
}

export declare class GCKeyboardInput extends GCPhysicalInputProfile {
  keyChangedHandler: (p1: GCKeyboardInput, p2: GCControllerButtonInput, p3: number, p4: boolean) => void;

  readonly anyKeyPressed: boolean;

  buttonForKeyCode(code: number): GCControllerButtonInput | null;

  isAnyKeyPressed(): boolean;
}

export declare class GCEventViewController extends NSViewController {
  controllerUserInteractionEnabled: boolean;
}

export declare class GCMouse extends NSObject implements GCDevice {
  readonly mouseInput: GCMouseInput;

  static readonly current: GCMouse;

  static mice(): NSArray;

  handlerQueue: NSObject;

  readonly vendorName: string;

  readonly productCategory: string;

  readonly physicalInputProfile: GCPhysicalInputProfile;

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

export declare class GCMicroGamepadSnapshot extends GCMicroGamepad {
  snapshotData: NSData;

  initWithSnapshotData(data: NSData): this;

  initWithControllerSnapshotData(controller: GCController, data: NSData): this;
}

export declare class GCMicroGamepad extends GCPhysicalInputProfile {
  readonly controller: GCController | null;

  valueChangedHandler: (p1: GCMicroGamepad, p2: GCControllerElement) => void;

  saveSnapshot(): GCMicroGamepadSnapshot;

  readonly dpad: GCControllerDirectionPad;

  readonly buttonA: GCControllerButtonInput;

  readonly buttonX: GCControllerButtonInput;

  readonly buttonMenu: GCControllerButtonInput;

  reportsAbsoluteDpadValues: boolean;

  allowsRotation: boolean;

  setStateFromMicroGamepad(microGamepad: GCMicroGamepad): void;
}

export declare class GCDualShockGamepad extends GCExtendedGamepad {
  readonly touchpadButton: GCControllerButtonInput;

  readonly touchpadPrimary: GCControllerDirectionPad;

  readonly touchpadSecondary: GCControllerDirectionPad;
}

export declare class GCXboxGamepad extends GCExtendedGamepad {
  readonly paddleButton1: GCControllerButtonInput;

  readonly paddleButton2: GCControllerButtonInput;

  readonly paddleButton3: GCControllerButtonInput;

  readonly paddleButton4: GCControllerButtonInput;
}

export declare class GCMouseInput extends GCPhysicalInputProfile {
  mouseMovedHandler: (p1: GCMouseInput, p2: number, p3: number) => void;

  readonly scroll: GCDeviceCursor;

  readonly leftButton: GCControllerButtonInput;

  readonly rightButton: GCControllerButtonInput;

  readonly middleButton: GCControllerButtonInput;

  readonly auxiliaryButtons: NSArray;
}

export declare class GCExtendedGamepad extends GCPhysicalInputProfile {
  readonly controller: GCController | null;

  valueChangedHandler: (p1: GCExtendedGamepad, p2: GCControllerElement) => void;

  saveSnapshot(): GCExtendedGamepadSnapshot;

  readonly dpad: GCControllerDirectionPad;

  readonly buttonA: GCControllerButtonInput;

  readonly buttonB: GCControllerButtonInput;

  readonly buttonX: GCControllerButtonInput;

  readonly buttonY: GCControllerButtonInput;

  readonly buttonMenu: GCControllerButtonInput;

  readonly buttonOptions: GCControllerButtonInput;

  readonly buttonHome: GCControllerButtonInput;

  readonly leftThumbstick: GCControllerDirectionPad;

  readonly rightThumbstick: GCControllerDirectionPad;

  readonly leftShoulder: GCControllerButtonInput;

  readonly rightShoulder: GCControllerButtonInput;

  readonly leftTrigger: GCControllerButtonInput;

  readonly rightTrigger: GCControllerButtonInput;

  readonly leftThumbstickButton: GCControllerButtonInput;

  readonly rightThumbstickButton: GCControllerButtonInput;

  setStateFromExtendedGamepad(extendedGamepad: GCExtendedGamepad): void;
}

export declare class GCGamepadSnapshot extends GCGamepad {
  snapshotData: NSData;

  initWithSnapshotData(data: NSData): this;

  initWithControllerSnapshotData(controller: GCController, data: NSData): this;
}

export declare class GCPhysicalInputProfile extends NSObject {
  readonly device: GCDevice | null;

  readonly lastEventTimestamp: number;

  readonly elements: NSDictionary;

  readonly buttons: NSDictionary;

  readonly axes: NSDictionary;

  readonly dpads: NSDictionary;

  readonly touchpads: NSDictionary;

  readonly allElements: NSSet;

  readonly allButtons: NSSet;

  readonly allAxes: NSSet;

  readonly allDpads: NSSet;

  readonly allTouchpads: NSSet;

  objectForKeyedSubscript(key: string): GCControllerElement | null;

  capture(): this;

  setStateFromPhysicalInput(physicalInput: GCPhysicalInputProfile): void;
}

export declare class GCMotion extends NSObject {
  readonly controller: GCController | null;

  valueChangedHandler: (p1: GCMotion) => void;

  readonly sensorsRequireManualActivation: boolean;

  sensorsActive: boolean;

  readonly hasGravityAndUserAcceleration: boolean;

  readonly gravity: GCAcceleration;

  readonly userAcceleration: GCAcceleration;

  readonly acceleration: GCAcceleration;

  readonly hasAttitudeAndRotationRate: boolean;

  readonly hasAttitude: boolean;

  readonly hasRotationRate: boolean;

  readonly attitude: GCQuaternion;

  readonly rotationRate: GCRotationRate;

  setStateFromMotion(motion: GCMotion): void;
}

export declare class GCDeviceCursor extends GCControllerDirectionPad {
}

export declare class GCControllerDirectionPad extends GCControllerElement {
  valueChangedHandler: (p1: GCControllerDirectionPad, p2: number, p3: number) => void;

  readonly xAxis: GCControllerAxisInput;

  readonly yAxis: GCControllerAxisInput;

  readonly up: GCControllerButtonInput;

  readonly down: GCControllerButtonInput;

  readonly left: GCControllerButtonInput;

  readonly right: GCControllerButtonInput;

  setValueForXAxisYAxis(xAxis: number, yAxis: number): void;
}

export declare class GCControllerElement extends NSObject {
  readonly collection: GCControllerElement;

  readonly analog: boolean;

  sfSymbolsName: string;

  localizedName: string;

  unmappedSfSymbolsName: string;

  unmappedLocalizedName: string;

  readonly aliases: NSSet;

  readonly boundToSystemGesture: boolean;

  preferredSystemGestureState: interop.Enum<typeof GCSystemGestureState>;

  isAnalog(): boolean;

  isBoundToSystemGesture(): boolean;
}

export declare class GCDeviceHaptics extends NSObject {
  readonly supportedLocalities: NSSet;

  createEngineWithLocality(locality: string): CHHapticEngine;
}

export declare class GCDeviceLight extends NSObject {
  color: GCColor;
}

export declare class GCColor extends NSObject implements NSCopying, NSSecureCoding {
  initWithRedGreenBlue(red: number, green: number, blue: number): this;

  readonly red: number;

  readonly green: number;

  readonly blue: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class GCControllerButtonInput extends GCControllerElement {
  valueChangedHandler: (p1: GCControllerButtonInput, p2: number, p3: boolean) => void;

  pressedChangedHandler: (p1: GCControllerButtonInput, p2: number, p3: boolean) => void;

  touchedChangedHandler: (p1: GCControllerButtonInput, p2: number, p3: boolean, p4: boolean) => void;

  readonly value: number;

  readonly pressed: boolean;

  readonly touched: boolean;

  isPressed(): boolean;

  isTouched(): boolean;
}

export declare class GCControllerAxisInput extends GCControllerElement {
  valueChangedHandler: (p1: GCControllerAxisInput, p2: number) => void;

  readonly value: number;
}

export declare class GCControllerTouchpad extends GCControllerElement {
  readonly button: GCControllerButtonInput;

  touchDown: (p1: GCControllerTouchpad, p2: number, p3: number, p4: number, p5: boolean) => void;

  touchMoved: (p1: GCControllerTouchpad, p2: number, p3: number, p4: number, p5: boolean) => void;

  touchUp: (p1: GCControllerTouchpad, p2: number, p3: number, p4: number, p5: boolean) => void;

  readonly touchSurface: GCControllerDirectionPad;

  readonly touchState: interop.Enum<typeof GCTouchState>;

  reportsAbsoluteTouchSurfaceValues: boolean;

  setValueForXAxisYAxisTouchDownButtonValue(xAxis: number, yAxis: number, touchDown: boolean, buttonValue: number): void;
}

export declare class GCDeviceBattery extends NSObject {
  readonly batteryLevel: number;

  readonly batteryState: interop.Enum<typeof GCDeviceBatteryState>;
}

export declare class GCExtendedGamepadSnapshot extends GCExtendedGamepad {
  snapshotData: NSData;

  initWithSnapshotData(data: NSData): this;

  initWithControllerSnapshotData(controller: GCController, data: NSData): this;
}

export declare class GCGamepad extends GCPhysicalInputProfile {
  readonly controller: GCController | null;

  valueChangedHandler: (p1: GCGamepad, p2: GCControllerElement) => void;

  saveSnapshot(): GCGamepadSnapshot;

  readonly dpad: GCControllerDirectionPad;

  readonly buttonA: GCControllerButtonInput;

  readonly buttonB: GCControllerButtonInput;

  readonly buttonX: GCControllerButtonInput;

  readonly buttonY: GCControllerButtonInput;

  readonly leftShoulder: GCControllerButtonInput;

  readonly rightShoulder: GCControllerButtonInput;
}

export declare class GCKeyboard extends NSObject implements GCDevice {
  readonly keyboardInput: GCKeyboardInput;

  static readonly coalescedKeyboard: GCKeyboard;

  handlerQueue: NSObject;

  readonly vendorName: string;

  readonly productCategory: string;

  readonly physicalInputProfile: GCPhysicalInputProfile;

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

export declare class GCController extends NSObject implements GCDevice {
  static controllers(): NSArray;

  static readonly current: GCController;

  controllerPausedHandler: (p1: GCController) => void;

  readonly attachedToDevice: boolean;

  playerIndex: interop.Enum<typeof GCControllerPlayerIndex>;

  readonly battery: GCDeviceBattery;

  readonly physicalInputProfile: GCPhysicalInputProfile;

  readonly gamepad: GCGamepad;

  readonly microGamepad: GCMicroGamepad;

  readonly extendedGamepad: GCExtendedGamepad;

  readonly motion: GCMotion;

  readonly light: GCDeviceLight;

  readonly haptics: GCDeviceHaptics;

  static supportsHIDDevice(device: interop.Object): boolean;

  isAttachedToDevice(): boolean;

  readonly snapshot: boolean;

  capture(): GCController;

  static controllerWithMicroGamepad(): GCController;

  static controllerWithExtendedGamepad(): GCController;

  isSnapshot(): boolean;

  static startWirelessControllerDiscoveryWithCompletionHandler(completionHandler: () => void | null): void;

  static stopWirelessControllerDiscovery(): void;

  handlerQueue: NSObject;

  readonly vendorName: string;

  readonly productCategory: string;

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
