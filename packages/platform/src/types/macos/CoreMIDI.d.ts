import type { CFUUIDBytes } from './CoreFoundation'

import type { NSArray, NSCoder, NSData, NSError, NSNetService, NSNumber, NSSecureCoding, NSSet } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const MIDIChannelsWholePort: number;

export declare const MIDINetworkNotificationSessionDidChange: string;

export declare const MIDINetworkBonjourServiceType: string;

export declare const kMIDIUInteger28Max: number;

export declare const kMIDIUInteger7Max: number;

export declare const kMIDIUInteger2Max: number;

export declare const MIDINetworkNotificationContactsDidChange: string;

export declare const kMIDICIPropertyExchangeBadRequestID: number;

export declare const kMIDIDeviceIDFunctionBlock: number;

export declare const kMIDISetupFormatErr: number;

export declare const kMIDIPropertyDriverDeviceEditorApp: interop.Pointer;

export declare const kMIDIPropertyMaxTransmitChannels: interop.Pointer;

export declare const kMIDIPropertyMaxReceiveChannels: interop.Pointer;

export declare const kMIDIPropertyIsMixer: interop.Pointer;

export declare const kMIDIPropertyTransmitsBankSelectLSB: interop.Pointer;

export declare const kMIDIPropertyTransmitsBankSelectMSB: interop.Pointer;

export declare const kMIDIPropertyReceivesBankSelectLSB: interop.Pointer;

export declare const kMIDIPropertyReceivesProgramChanges: interop.Pointer;

export declare const kMIDIPropertyReceivesMTC: interop.Pointer;

export declare const kMIDIPropertyDriverVersion: interop.Pointer;

export declare const kMIDIPropertyNameConfiguration: interop.Pointer;

export declare const kMIDIPropertyPrivate: interop.Pointer;

export declare const kMIDIPropertyIsBroadcast: interop.Pointer;

export declare const kMIDIPropertyIsEmbeddedEntity: interop.Pointer;

export declare const kMIDIPropertyMaxSysExSpeed: interop.Pointer;

export declare const kMIDIPropertyModel: interop.Pointer;

export declare const kMIDIPropertyName: interop.Pointer;

export declare const kMIDIInvalidUniqueID: number;

export declare const kMIDIObjectType_ExternalMask: interop.Enum<typeof MIDIObjectType>;

export declare const kMIDIUnknownError: number;

export declare const kMIDIObjectNotFound: number;

export declare const kMIDIServerStartErr: number;

export declare const kMIDIInvalidClient: number;

export declare const kMIDIPropertyTransmitsClock: interop.Pointer;

export declare const kMIDIPropertyTransmitsNotes: interop.Pointer;

export declare const kMIDIInvalidPort: number;

export declare const kMIDIPropertyDriverOwner: interop.Pointer;

export declare const kMIDIPropertyDeviceID: interop.Pointer;

export declare const kMIDIPropertyReceivesBankSelectMSB: interop.Pointer;

export declare const kMIDIPropertyUserPatchNameFile: interop.Pointer;

export declare const kMIDIPropertyProtocolID: interop.Pointer;

export declare const kMIDIPropertyImage: interop.Pointer;

export declare const kMIDIPropertyIsDrumMachine: interop.Pointer;

export declare const kMIDIPropertySupportsMMC: interop.Pointer;

export declare const kMIDIPropertySupportsGeneralMIDI: interop.Pointer;

export declare const kMIDIPropertyReceivesClock: interop.Pointer;

export declare const kMIDIIDNotUnique: number;

export declare const kMIDIUnknownProperty: number;

export declare const kMIDIPropertyReceivesNotes: interop.Pointer;

export declare const kMIDIPropertyTransmitsProgramChanges: interop.Pointer;

export declare const kMIDIPropertyUniqueID: interop.Pointer;

export declare const kMIDIPropertyManufacturer: interop.Pointer;

export declare const kMIDIPropertyPanDisruptsStereo: interop.Pointer;

export declare const kMIDIMessageSendErr: number;

export declare const kMIDINotPermitted: number;

export declare const kMIDIPropertyNameConfigurationDictionary: interop.Pointer;

export declare const kMIDIWrongEndpointType: number;

export declare const kMIDIDriverPropertyUsesSerial: interop.Pointer;

export declare const kMIDINoCurrentSetup: number;

export declare const kMIDIPropertyFactoryPatchNameFile: interop.Pointer;

export declare const kMIDINoConnection: number;

export declare const kMIDIPropertyDisplayName: interop.Pointer;

export declare const kMIDIPropertyIsSampler: interop.Pointer;

export declare const kMIDIThruConnection_MaxEndpoints: number;

export declare const kMIDIUInteger4Max: number;

export declare const kMIDIUInteger14Max: number;

export declare const kMIDIPropertyOffline: interop.Pointer;

export declare const kMIDIPropertySupportsShowControl: interop.Pointer;

export declare const kMIDIWrongPropertyType: number;

export declare const kMIDIPropertyReceiveChannels: interop.Pointer;

export declare const kMIDIPropertySingleRealtimeEntity: interop.Pointer;

export declare const kMIDIPropertyConnectionUniqueID: interop.Pointer;

export declare const kMIDIUnknownEndpoint: number;

export declare const kMIDIPropertyAdvanceScheduleTimeMuSec: interop.Pointer;

export declare const kMIDIPropertyTransmitsMTC: interop.Pointer;

export declare const kMIDI1UPMaxSysexSize: number;

export declare const kMIDIPropertyTransmitChannels: interop.Pointer;

export declare const kMIDIDeviceIDUMPGroup: number;

export declare const kMIDIWrongThread: number;

export declare const kMIDIPropertyCanRoute: interop.Pointer;

export declare const kMIDIPropertyIsEffectUnit: interop.Pointer;

export declare const MIDINetworkConnectionPolicy: {
  NoOne: 0,
  HostsInContactList: 1,
  Anyone: 2,
};

export declare const MIDIUMPCIObjectBackingType: {
  Unknown: 0,
  Virtual: 1,
  DriverDevice: 2,
  USBMIDI: 3,
};

export declare const MIDICIProfileType: {
  SingleChannel: 1,
  Group: 2,
  FunctionBlock: 3,
  Multichannel: 4,
};

export declare const MIDICIManagementMessageType: {
  Discovery: 112,
  ReplyToDiscovery: 113,
  InquiryEndpointInformation: 114,
  ReplyToEndpointInformation: 115,
  MIDICIACK: 125,
  InvalidateMUID: 126,
  MIDICINAK: 127,
};

export declare const MIDICIProcessInquiryMessageType: {
  InquiryProcessInquiryCapabilities: 64,
  ReplyToProcessInquiryCapabilities: 65,
  InquiryMIDIMessageReport: 66,
  ReplyToMIDIMessageReport: 67,
  EndOfMIDIMessageReport: 68,
};

export declare const MIDICIDeviceType: {
  Unknown: 0,
  LegacyMIDI1: 1,
  Virtual: 2,
  USBMIDI: 3,
};

export declare const MIDICICategoryOptions: {
  ProtocolNegotiation: 2,
  ProfileConfigurationSupported: 4,
  PropertyExchangeSupported: 8,
  ProcessInquirySupported: 16,
};

export declare const MIDIUMPFunctionBlockDirection: {
  Unknown: 0,
  Input: 1,
  Output: 2,
  Bidirectional: 3,
};

export declare const MIDIUMPFunctionBlockUIHint: {
  Unknown: 0,
  Receiver: 1,
  Sender: 2,
  SenderReceiver: 3,
};

export declare const MIDIPerNoteManagementOptions: {
  Reset: 1,
  Detach: 2,
};

export declare const MIDINoteAttribute: {
  None: 0,
  ManufacturerSpecific: 1,
  ProfileSpecific: 2,
  Pitch: 3,
};

export declare const MIDISystemStatus: {
  StartOfExclusive: 240,
  EndOfExclusive: 247,
  MTC: 241,
  SongPosPointer: 242,
  SongSelect: 243,
  TuneRequest: 246,
  TimingClock: 248,
  Start: 250,
  Continue: 251,
  Stop: 252,
  ActiveSending: 254,
  ActiveSensing: 254,
  SystemReset: 255,
};

export declare const MIDIMessageType: {
  Utility: 0,
  System: 1,
  ChannelVoice1: 2,
  SysEx: 3,
  ChannelVoice2: 4,
  Data128: 5,
  FlexData: 13,
  UnknownF: 15,
  Stream: 15,
  Invalid: 255,
};

export declare const MIDITransformControlType: {
  Type_7Bit: 0,
  Type_14Bit: 1,
  Type_7BitRPN: 2,
  Type_14BitRPN: 3,
  Type_7BitNRPN: 4,
  Type_14BitNRPN: 5,
};

export declare const UMPStreamMessageStatus: {
  EndpointDiscovery: 0,
  EndpointInfoNotification: 1,
  DeviceIdentityNotification: 2,
  EndpointNameNotification: 3,
  ProductInstanceIDNotification: 4,
  StreamConfigurationRequest: 5,
  StreamConfigurationNotification: 6,
  FunctionBlockDiscovery: 16,
  FunctionBlockInfoNotification: 17,
  FunctionBlockNameNotification: 18,
  StartOfClip: 32,
  EndOfClip: 33,
};

export declare const MIDICVStatus: {
  NoteOff: 8,
  NoteOn: 9,
  PolyPressure: 10,
  ControlChange: 11,
  ProgramChange: 12,
  ChannelPressure: 13,
  PitchBend: 14,
  RegisteredPNC: 0,
  AssignablePNC: 1,
  RegisteredControl: 2,
  AssignableControl: 3,
  RelRegisteredControl: 4,
  RelAssignableControl: 5,
  PerNotePitchBend: 6,
  PerNoteMgmt: 15,
};

export declare const UMPStreamMessageFormat: {
  Complete: 0,
  Start: 1,
  Continuing: 2,
  End: 3,
};

export declare const MIDICIProfileMessageType: {
  ProfileInquiry: 32,
  ReplyToProfileInquiry: 33,
  SetProfileOn: 34,
  SetProfileOff: 35,
  ProfileEnabledReport: 36,
  ProfileDisabledReport: 37,
  ProfileAdded: 38,
  ProfileRemoved: 39,
  DetailsInquiry: 40,
  ReplyToDetailsInquiry: 41,
  ProfileSpecificData: 47,
};

export declare const MIDINotificationMessageID: {
  SetupChanged: 1,
  ObjectAdded: 2,
  ObjectRemoved: 3,
  PropertyChanged: 4,
  ThruConnectionsChanged: 5,
  SerialPortOwnerChanged: 6,
  IOError: 7,
};

export declare const MIDIProtocolID: {
  Protocol_1_0: 1,
  Protocol_2_0: 2,
};

export declare const MIDIObjectType: {
  Other: -1,
  Device: 0,
  Entity: 1,
  Source: 2,
  Destination: 3,
  ExternalDevice: 16,
  ExternalEntity: 17,
  ExternalSource: 18,
  ExternalDestination: 19,
};

export declare const MIDIProgramChangeOptions: {
  kMIDIProgramChangeBankValid: 1,
};

export declare const MIDIUtilityStatus: {
  NOOP: 0,
  JitterReductionClock: 1,
  JitterReductionTimestamp: 2,
  DeltaClockstampTicksPerQuarterNote: 3,
  TicksSinceLastEvent: 4,
};

export declare const MIDITransformType: {
  None: 0,
  FilterOut: 1,
  MapControl: 2,
  Add: 8,
  Scale: 9,
  MinValue: 10,
  MaxValue: 11,
  MapValue: 12,
};

export declare const MIDIUMPProtocolOptions: {
  I1: 1,
  I2: 2,
};

export declare const MIDICIPropertyExchangeMessageType: {
  InquiryPropertyExchangeCapabilities: 48,
  ReplyToPropertyExchangeCapabilities: 49,
  InquiryHasPropertyData_Reserved: 50,
  InquiryReplyToHasPropertyData_Reserved: 51,
  InquiryGetPropertyData: 52,
  ReplyToGetProperty: 53,
  InquirySetPropertyData: 54,
  ReplyToSetPropertyData: 55,
  Subscription: 56,
  ReplyToSubscription: 57,
  Notify: 63,
};

export declare const MIDIUMPFunctionBlockMIDI1Info: {
  NotMIDI1: 0,
  UnrestrictedBandwidth: 1,
  RestrictedBandwidth: 2,
};

export declare const MIDISysExStatus: {
  Complete: 0,
  Start: 1,
  Continue: 2,
  End: 3,
  MixedDataSetHeader: 8,
  MixedDataSetPayload: 9,
};

export declare class MIDICIDeviceIdentification {
  constructor(init?: MIDICIDeviceIdentification);
  manufacturer: unknown /* const array */;
  family: unknown /* const array */;
  modelNumber: unknown /* const array */;
  revisionLevel: unknown /* const array */;
  reserved: unknown /* const array */;
}

export declare class unnamed_4391241832499588774 {
  constructor(init?: unnamed_4391241832499588774);
  mdsID: number;
  data: unknown /* const array */;
  reserved: number;
}

export declare class unnamed_7932579602543130404 {
  constructor(init?: unnamed_7932579602543130404);
  noteNumber: number;
  index: number;
  data: number;
}

export declare class unnamed_1648572098102987669 {
  constructor(init?: unnamed_1648572098102987669);
  options: interop.Enum<typeof MIDIProgramChangeOptions>;
  program: number;
  reserved: unknown /* const array */;
  bank: number;
}

export declare class unnamed_15127996109207110734 {
  constructor(init?: unnamed_15127996109207110734);
  index: number;
  reserved: number;
  data: number;
}

export declare class unnamed_11989693329134775571 {
  constructor(init?: unnamed_11989693329134775571);
  number: number;
  attributeType: interop.Enum<typeof MIDINoteAttribute>;
  velocity: number;
  attribute: number;
}

export declare class unnamed_4800020714545036661 {
  constructor(init?: unnamed_4800020714545036661);
  index: number;
  data: number;
}

export declare class unnamed_16909247563109955859 {
  constructor(init?: unnamed_16909247563109955859);
  noteNumber: number;
  pressure: number;
}

export declare class unnamed_7153346668415797423 {
  constructor(init?: unnamed_7153346668415797423);
  number: number;
  velocity: number;
}

export declare class MIDIDriverInterface {
  constructor(init?: MIDIDriverInterface);
  _reserved: interop.Pointer;
  QueryInterface: (p1: interop.PointerConvertible, p2: CFUUIDBytes, p3: interop.PointerConvertible) => number | null;
  AddRef: (p1: interop.PointerConvertible) => number | null;
  Release: (p1: interop.PointerConvertible) => number | null;
  FindDevices: (p1: interop.PointerConvertible, p2: number) => number | null;
  Start: (p1: interop.PointerConvertible, p2: number) => number | null;
  Stop: (p1: interop.PointerConvertible) => number | null;
  Configure: (p1: interop.PointerConvertible, p2: number) => number | null;
  Send: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  EnableSource: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  Flush: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  Monitor: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  SendPackets: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  MonitorEvents: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
}

export declare class MIDITransform {
  constructor(init?: MIDITransform);
  transform: interop.Enum<typeof MIDITransformType>;
  param: number;
}

export declare class MIDIValueMap {
  constructor(init?: MIDIValueMap);
  value: unknown /* const array */;
}

export declare class MIDIControlTransform {
  constructor(init?: MIDIControlTransform);
  controlType: interop.Enum<typeof MIDITransformControlType>;
  remappedControlType: interop.Enum<typeof MIDITransformControlType>;
  controlNumber: number;
  transform: interop.Enum<typeof MIDITransformType>;
  param: number;
}

export declare class MIDIThruConnectionEndpoint {
  constructor(init?: MIDIThruConnectionEndpoint);
  endpointRef: number;
  uniqueID: number;
}

export declare class unnamed_15196625151417023244 {
  constructor(init?: unnamed_15196625151417023244);
  words: unknown /* const array */;
}

export declare class unnamed_11311856717490985208 {
  constructor(init?: unnamed_11311856717490985208);
  bank: number;
  index: number;
  data: number;
}

export declare class unnamed_3187524178370925532 {
  constructor(init?: unnamed_3187524178370925532);
  data: number;
  reserved: unknown /* const array */;
}

export declare class unnamed_15051803979677920868 {
  constructor(init?: unnamed_15051803979677920868);
  note: number;
  options: interop.Enum<typeof MIDIPerNoteManagementOptions>;
  reserved: unknown /* const array */;
}

export declare class MIDIMessage_64 {
  constructor(init?: MIDIMessage_64);
  word0: number;
  word1: number;
}

export declare class MIDI2DeviceManufacturer {
  constructor(init?: MIDI2DeviceManufacturer);
  sysExIDByte: unknown /* const array */;
}

export declare class unnamed_9944904658792256391 {
  constructor(init?: unnamed_9944904658792256391);
  byteCount: number;
  streamID: number;
  data: unknown /* const array */;
  reserved: number;
}

export declare class unnamed_8974121304491696589 {
  constructor(init?: unnamed_8974121304491696589);
  noteNumber: number;
  reserved: number;
  pressure: number;
}

export declare class MIDICIProfileIDManufacturerSpecific {
  constructor(init?: MIDICIProfileIDManufacturerSpecific);
  sysExID1: number;
  sysExID2: number;
  sysExID3: number;
  info1: number;
  info2: number;
}

export declare class MIDI2DeviceRevisionLevel {
  constructor(init?: MIDI2DeviceRevisionLevel);
  revisionLevel: unknown /* const array */;
}

export declare class MIDIMessage_128 {
  constructor(init?: MIDIMessage_128);
  word0: number;
  word1: number;
  word2: number;
  word3: number;
}

export declare class MIDIPacket {
  constructor(init?: MIDIPacket);
  timeStamp: number;
  length: number;
  data: unknown /* const array */;
}

export declare class unnamed_11998428031365045700 {
  constructor(init?: unnamed_11998428031365045700);
  status: interop.Enum<typeof MIDICVStatus>;
  channel: number;
  reserved: unknown /* const array */;
}

export declare class MIDIIOErrorNotification {
  constructor(init?: MIDIIOErrorNotification);
  messageID: interop.Enum<typeof MIDINotificationMessageID>;
  messageSize: number;
  driverDevice: number;
  errorCode: number;
}

export declare class MIDIObjectPropertyChangeNotification {
  constructor(init?: MIDIObjectPropertyChangeNotification);
  messageID: interop.Enum<typeof MIDINotificationMessageID>;
  messageSize: number;
  object: number;
  objectType: interop.Enum<typeof MIDIObjectType>;
  propertyName: interop.Object | null;
}

export declare class MIDIObjectAddRemoveNotification {
  constructor(init?: MIDIObjectAddRemoveNotification);
  messageID: interop.Enum<typeof MIDINotificationMessageID>;
  messageSize: number;
  parent: number;
  parentType: interop.Enum<typeof MIDIObjectType>;
  child: number;
  childType: interop.Enum<typeof MIDIObjectType>;
}

export declare class MIDIEventPacket {
  constructor(init?: MIDIEventPacket);
  timeStamp: number;
  wordCount: number;
  words: unknown /* const array */;
}

export declare class MIDINotification {
  constructor(init?: MIDINotification);
  messageID: interop.Enum<typeof MIDINotificationMessageID>;
  messageSize: number;
}

export declare class MIDIUniversalMessage {
  constructor(init?: MIDIUniversalMessage);
  type: interop.Enum<typeof MIDIMessageType>;
  group: number;
  reserved: unknown /* const array */;
}

export declare class unnamed_5431597589905109138 {
  constructor(init?: unnamed_5431597589905109138);
  status: interop.Enum<typeof MIDISysExStatus>;
  channel: number;
  data: unknown /* const array */;
  reserved: number;
}

export declare class MIDISysexSendRequestUMP {
  constructor(init?: MIDISysexSendRequestUMP);
  destination: number;
  words: interop.Pointer;
  wordsToSend: number;
  complete: number;
  completionProc: (p1: interop.PointerConvertible) => void | null;
  completionRefCon: interop.Pointer;
}

export declare class unnamed_14052306598693715008 {
  constructor(init?: unnamed_14052306598693715008);
  status: interop.Enum<typeof MIDISystemStatus>;
}

export declare class MIDIThruConnectionParams {
  constructor(init?: MIDIThruConnectionParams);
  version: number;
  numSources: number;
  sources: unknown /* const array */;
  numDestinations: number;
  destinations: unknown /* const array */;
  channelMap: unknown /* const array */;
  lowVelocity: number;
  highVelocity: number;
  lowNote: number;
  highNote: number;
  noteNumber: MIDITransform;
  velocity: MIDITransform;
  keyPressure: MIDITransform;
  channelPressure: MIDITransform;
  programChange: MIDITransform;
  pitchBend: MIDITransform;
  filterOutSysEx: number;
  filterOutMTC: number;
  filterOutBeatClock: number;
  filterOutTuneRequest: number;
  reserved2: unknown /* const array */;
  filterOutAllControls: number;
  numControlTransforms: number;
  numMaps: number;
  reserved3: unknown /* const array */;
}

export declare class unnamed_16562114345071143661 {
  constructor(init?: unnamed_16562114345071143661);
  status: interop.Enum<typeof MIDISysExStatus>;
}

export declare class unnamed_9030049961712433657 {
  constructor(init?: unnamed_9030049961712433657);
  status: interop.Enum<typeof MIDICVStatus>;
  channel: number;
  reserved: unknown /* const array */;
}

export declare class MIDIMessage_96 {
  constructor(init?: MIDIMessage_96);
  word0: number;
  word1: number;
  word2: number;
}

export declare class unnamed_8658263136487650707 {
  constructor(init?: unnamed_8658263136487650707);
  status: interop.Enum<typeof MIDIUtilityStatus>;
}

export declare class unnamed_6807253926268745976 {
  constructor(init?: unnamed_6807253926268745976);
  noteNumber: number;
  reserved: number;
  bend: number;
}

export declare class unnamed_2543613162618149443 {
  constructor(init?: unnamed_2543613162618149443);
  data: number;
  reserved: unknown /* const array */;
}

export declare class MIDISysexSendRequest {
  constructor(init?: MIDISysexSendRequest);
  destination: number;
  data: interop.Pointer;
  bytesToSend: number;
  complete: number;
  reserved: unknown /* const array */;
  completionProc: (p1: interop.PointerConvertible) => void | null;
  completionRefCon: interop.Pointer;
}

export declare class MIDICIProfileIDStandard {
  constructor(init?: MIDICIProfileIDStandard);
  profileIDByte1: number;
  profileBank: number;
  profileNumber: number;
  profileVersion: number;
  profileLevel: number;
}

export type MIDICIProfileIDDescriptor = 
  | { standard: MIDICIProfileIDStandard }
  | { manufacturerSpecific: MIDICIProfileIDManufacturerSpecific };

export declare class MIDICIProfileID {
  constructor(init?: MIDICIProfileIDDescriptor);
  standard: MIDICIProfileIDStandard;
  manufacturerSpecific: MIDICIProfileIDManufacturerSpecific;
}

export type unnamed_2549698286262071685Descriptor = 
  | { note: unnamed_11989693329134775571 }
  | { polyPressure: unnamed_8974121304491696589 }
  | { controlChange: unnamed_15127996109207110734 }
  | { programChange: unnamed_1648572098102987669 }
  | { channelPressure: unnamed_3187524178370925532 }
  | { pitchBend: unnamed_2543613162618149443 }
  | { perNoteController: unnamed_7932579602543130404 }
  | { controller: unnamed_11311856717490985208 }
  | { perNotePitchBend: unnamed_6807253926268745976 }
  | { perNoteManagement: unnamed_15051803979677920868 };

export declare class unnamed_2549698286262071685 {
  constructor(init?: unnamed_2549698286262071685Descriptor);
  note: unnamed_11989693329134775571;
  polyPressure: unnamed_8974121304491696589;
  controlChange: unnamed_15127996109207110734;
  programChange: unnamed_1648572098102987669;
  channelPressure: unnamed_3187524178370925532;
  pitchBend: unnamed_2543613162618149443;
  perNoteController: unnamed_7932579602543130404;
  controller: unnamed_11311856717490985208;
  perNotePitchBend: unnamed_6807253926268745976;
  perNoteManagement: unnamed_15051803979677920868;
}

export type unnamed_14616050068199549008Descriptor = 
  | { note: unnamed_7153346668415797423 }
  | { polyPressure: unnamed_16909247563109955859 }
  | { controlChange: unnamed_4800020714545036661 }
  | { program: number }
  | { channelPressure: number }
  | { pitchBend: number };

export declare class unnamed_14616050068199549008 {
  constructor(init?: unnamed_14616050068199549008Descriptor);
  note: unnamed_7153346668415797423;
  polyPressure: unnamed_16909247563109955859;
  controlChange: unnamed_4800020714545036661;
  program: number;
  channelPressure: number;
  pitchBend: number;
}

export type unnamed_16370997102154952854Descriptor = 
  | { timeCode: number }
  | { songPositionPointer: number }
  | { songSelect: number };

export declare class unnamed_16370997102154952854 {
  constructor(init?: unnamed_16370997102154952854Descriptor);
  timeCode: number;
  songPositionPointer: number;
  songSelect: number;
}

export type unnamed_15387743792267832052Descriptor = 
  | { sysex8: unnamed_9944904658792256391 }
  | { mixedDataSet: unnamed_4391241832499588774 };

export declare class unnamed_15387743792267832052 {
  constructor(init?: unnamed_15387743792267832052Descriptor);
  sysex8: unnamed_9944904658792256391;
  mixedDataSet: unnamed_4391241832499588774;
}

export type unnamed_9998325423615530754Descriptor = 
  | { utility: unnamed_8658263136487650707 }
  | { system: unnamed_14052306598693715008 }
  | { channelVoice1: unnamed_9030049961712433657 }
  | { sysEx: unnamed_5431597589905109138 }
  | { channelVoice2: unnamed_11998428031365045700 }
  | { data128: unnamed_16562114345071143661 }
  | { unknown: unnamed_15196625151417023244 };

export declare class unnamed_9998325423615530754 {
  constructor(init?: unnamed_9998325423615530754Descriptor);
  utility: unnamed_8658263136487650707;
  system: unnamed_14052306598693715008;
  channelVoice1: unnamed_9030049961712433657;
  sysEx: unnamed_5431597589905109138;
  channelVoice2: unnamed_11998428031365045700;
  data128: unnamed_16562114345071143661;
  unknown: unnamed_15196625151417023244;
}

export type unnamed_14782074132405584476Descriptor = 
  | { jitterReductionClock: number }
  | { jitterReductionTimestamp: number };

export declare class unnamed_14782074132405584476 {
  constructor(init?: unnamed_14782074132405584476Descriptor);
  jitterReductionClock: number;
  jitterReductionTimestamp: number;
}

export declare function MIDIClientCreate(name: interop.Object, notifyProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, notifyRefCon: interop.PointerConvertible, outClient: interop.PointerConvertible): number;

export declare function MIDIClientCreateWithBlock(name: interop.Object, outClient: interop.PointerConvertible, notifyBlock: (p1: interop.PointerConvertible) => void): number;

export declare function MIDIClientDispose(client: number): number;

export declare function MIDIInputPortCreateWithProtocol(client: number, portName: interop.Object, protocol: interop.Enum<typeof MIDIProtocolID>, outPort: interop.PointerConvertible, receiveBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function MIDIInputPortCreate(client: number, portName: interop.Object, readProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, refCon: interop.PointerConvertible, outPort: interop.PointerConvertible): number;

export declare function MIDIInputPortCreateWithBlock(client: number, portName: interop.Object, outPort: interop.PointerConvertible, readBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function MIDIOutputPortCreate(client: number, portName: interop.Object, outPort: interop.PointerConvertible): number;

export declare function MIDIPortDispose(port: number): number;

export declare function MIDIPortConnectSource(port: number, source: number, connRefCon: interop.PointerConvertible): number;

export declare function MIDIPortDisconnectSource(port: number, source: number): number;

export declare function MIDIGetNumberOfDevices(): number;

export declare function MIDIGetDevice(deviceIndex0: number): number;

export declare function MIDIDeviceGetNumberOfEntities(device: number): number;

export declare function MIDIDeviceGetEntity(device: number, entityIndex0: number): number;

export declare function MIDIEntityGetNumberOfSources(entity: number): number;

export declare function MIDIEntityGetSource(entity: number, sourceIndex0: number): number;

export declare function MIDIEntityGetNumberOfDestinations(entity: number): number;

export declare function MIDIEntityGetDestination(entity: number, destIndex0: number): number;

export declare function MIDIEntityGetDevice(inEntity: number, outDevice: interop.PointerConvertible): number;

export declare function MIDIGetNumberOfSources(): number;

export declare function MIDIGetSource(sourceIndex0: number): number;

export declare function MIDIGetNumberOfDestinations(): number;

export declare function MIDIGetDestination(destIndex0: number): number;

export declare function MIDIEndpointGetEntity(inEndpoint: number, outEntity: interop.PointerConvertible): number;

export declare function MIDIDestinationCreateWithProtocol(client: number, name: interop.Object, protocol: interop.Enum<typeof MIDIProtocolID>, outDest: interop.PointerConvertible, readBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function MIDIDestinationCreate(client: number, name: interop.Object, readProc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void, refCon: interop.PointerConvertible, outDest: interop.PointerConvertible): number;

export declare function MIDIDestinationCreateWithBlock(client: number, name: interop.Object, outDest: interop.PointerConvertible, readBlock: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void): number;

export declare function MIDISourceCreateWithProtocol(client: number, name: interop.Object, protocol: interop.Enum<typeof MIDIProtocolID>, outSrc: interop.PointerConvertible): number;

export declare function MIDISourceCreate(client: number, name: interop.Object, outSrc: interop.PointerConvertible): number;

export declare function MIDIEndpointDispose(endpt: number): number;

export declare function MIDIGetNumberOfExternalDevices(): number;

export declare function MIDIGetExternalDevice(deviceIndex0: number): number;

export declare function MIDIObjectGetIntegerProperty(obj: number, propertyID: interop.Object, outValue: interop.PointerConvertible): number;

export declare function MIDIObjectSetIntegerProperty(obj: number, propertyID: interop.Object, value: number): number;

export declare function MIDIObjectGetStringProperty(obj: number, propertyID: interop.Object, str: interop.PointerConvertible): number;

export declare function MIDIObjectSetStringProperty(obj: number, propertyID: interop.Object, str: interop.Object): number;

export declare function MIDIObjectGetDataProperty(obj: number, propertyID: interop.Object, outData: interop.PointerConvertible): number;

export declare function MIDIObjectSetDataProperty(obj: number, propertyID: interop.Object, data: interop.Object): number;

export declare function MIDIObjectGetDictionaryProperty(obj: number, propertyID: interop.Object, outDict: interop.PointerConvertible): number;

export declare function MIDIObjectSetDictionaryProperty(obj: number, propertyID: interop.Object, dict: interop.Object): number;

export declare function MIDIObjectGetProperties(obj: number, outProperties: interop.PointerConvertible, deep: number): number;

export declare function MIDIObjectRemoveProperty(obj: number, propertyID: interop.Object): number;

export declare function MIDIObjectFindByUniqueID(inUniqueID: number, outObject: interop.PointerConvertible, outObjectType: interop.PointerConvertible): number;

export declare function MIDISendEventList(port: number, dest: number, evtlist: interop.PointerConvertible): number;

export declare function MIDISend(port: number, dest: number, pktlist: interop.PointerConvertible): number;

export declare function MIDISendSysex(request: interop.PointerConvertible): number;

export declare function MIDIReceivedEventList(src: number, evtlist: interop.PointerConvertible): number;

export declare function MIDIReceived(src: number, pktlist: interop.PointerConvertible): number;

export declare function MIDIFlushOutput(dest: number): number;

export declare function MIDIRestart(): number;

export declare function MIDIEventListInit(evtlist: interop.PointerConvertible, protocol: interop.Enum<typeof MIDIProtocolID>): interop.Pointer;

export declare function MIDIEventListAdd(evtlist: interop.PointerConvertible, listSize: number, curPacket: interop.PointerConvertible, time: number, wordCount: number, words: interop.PointerConvertible): interop.Pointer;

export declare function MIDIPacketListInit(pktlist: interop.PointerConvertible): interop.Pointer;

export declare function MIDIPacketListAdd(pktlist: interop.PointerConvertible, listSize: number, curPacket: interop.PointerConvertible, time: number, nData: number, data: interop.PointerConvertible): interop.Pointer;

export declare function MIDISetupCreate(outSetup: interop.PointerConvertible): number;

export declare function MIDISetupDispose(setup: number): number;

export declare function MIDISetupInstall(setup: number): number;

export declare function MIDISetupGetCurrent(outSetup: interop.PointerConvertible): number;

export declare function MIDISetupToData(setup: number, outData: interop.PointerConvertible): number;

export declare function MIDISetupFromData(data: interop.Object, outSetup: interop.PointerConvertible): number;

export declare function MIDIDeviceNewEntity(device: number, name: interop.Object, protocol: interop.Enum<typeof MIDIProtocolID>, embedded: number, numSourceEndpoints: number, numDestinationEndpoints: number, newEntity: interop.PointerConvertible): number;

export declare function MIDIDeviceAddEntity(device: number, name: interop.Object, embedded: number, numSourceEndpoints: number, numDestinationEndpoints: number, newEntity: interop.PointerConvertible): number;

export declare function MIDIDeviceRemoveEntity(device: number, entity: number): number;

export declare function MIDIEntityAddOrRemoveEndpoints(entity: number, numSourceEndpoints: number, numDestinationEndpoints: number): number;

export declare function MIDISetupAddDevice(device: number): number;

export declare function MIDISetupRemoveDevice(device: number): number;

export declare function MIDISetupAddExternalDevice(device: number): number;

export declare function MIDISetupRemoveExternalDevice(device: number): number;

export declare function MIDIGetSerialPortOwner(portName: interop.Object, outDriverName: interop.PointerConvertible): number;

export declare function MIDISetSerialPortOwner(portName: interop.Object, driverName: interop.Object): number;

export declare function MIDIGetSerialPortDrivers(outDriverNames: interop.PointerConvertible): number;

export declare function MIDIExternalDeviceCreate(name: interop.Object, manufacturer: interop.Object, model: interop.Object, outDevice: interop.PointerConvertible): number;

export declare function MIDIThruConnectionParamsInitialize(inConnectionParams: interop.PointerConvertible): void;

export declare function MIDIThruConnectionCreate(inPersistentOwnerID: interop.Object, inConnectionParams: interop.Object, outConnection: interop.PointerConvertible): number;

export declare function MIDIThruConnectionDispose(connection: number): number;

export declare function MIDIThruConnectionGetParams(connection: number, outConnectionParams: interop.PointerConvertible): number;

export declare function MIDIThruConnectionSetParams(connection: number, inConnectionParams: interop.Object): number;

export declare function MIDIThruConnectionFind(inPersistentOwnerID: interop.Object, outConnectionList: interop.PointerConvertible): number;

export declare function MIDIDeviceCreate(owner: interop.PointerConvertible, name: interop.Object, manufacturer: interop.Object, model: interop.Object, outDevice: interop.PointerConvertible): number;

export declare function MIDIDeviceDispose(device: number): number;

export declare function MIDIDeviceListGetNumberOfDevices(devList: number): number;

export declare function MIDIDeviceListGetDevice(devList: number, index0: number): number;

export declare function MIDIDeviceListAddDevice(devList: number, dev: number): number;

export declare function MIDIDeviceListDispose(devList: number): number;

export declare function MIDIEndpointSetRefCons(endpt: number, ref1: interop.PointerConvertible, ref2: interop.PointerConvertible): number;

export declare function MIDIEndpointGetRefCons(endpt: number, ref1: interop.PointerConvertible, ref2: interop.PointerConvertible): number;

export declare function MIDIGetDriverIORunLoop(): interop.Object;

export declare function MIDIGetDriverDeviceList(driver: interop.PointerConvertible): number;

export declare function MIDIDriverEnableMonitoring(driver: interop.PointerConvertible, enabled: number): number;

export declare interface MIDICIProfileResponderDelegate extends NSObjectProtocol {
  connectInitiatorWithDeviceInfo(initiatorMUID: NSNumber, deviceInfo: MIDICIDeviceInfo): boolean;

  initiatorDisconnected(initiatorMUID: NSNumber): this;

  willSetProfileOnChannelEnabled?(aProfile: MIDICIProfile, channel: number, shouldEnable: boolean): boolean;

  handleDataForProfileOnChannelData?(aProfile: MIDICIProfile, channel: number, inData: NSData): void;
}

export declare class MIDICIProfileResponderDelegate extends NativeObject implements MIDICIProfileResponderDelegate {
}

export declare class MIDICIResponder extends NSObject {
  readonly initiators: NSArray;

  readonly profileDelegate: MIDICIProfileResponderDelegate;

  readonly deviceInfo: MIDICIDeviceInfo;

  initWithDeviceInfoProfileDelegateProfileStatesSupportProperties(deviceInfo: MIDICIDeviceInfo, delegate: MIDICIProfileResponderDelegate, profileList: NSArray<interop.Object> | Array<interop.Object>, propertiesSupported: boolean): this;

  notifyProfileOnChannelIsEnabled(aProfile: MIDICIProfile, channel: number, enabledState: boolean): boolean;

  sendProfileOnChannelProfileData(aProfile: MIDICIProfile, channel: number, profileSpecificData: NSData): boolean;

  start(): boolean;

  stop(): void;
}

export declare class MIDICIDiscoveredNode extends NSObject implements NSSecureCoding {
  readonly destination: number;

  readonly deviceInfo: MIDICIDeviceInfo;

  readonly supportsProfiles: boolean;

  readonly supportsProperties: boolean;

  readonly maximumSysExSize: NSNumber;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MIDICIDeviceInfo extends NSObject implements NSSecureCoding {
  readonly manufacturerID: NSData;

  readonly family: NSData;

  readonly modelNumber: NSData;

  readonly revisionLevel: NSData;

  readonly midiDestination: number;

  initWithDestinationManufacturerFamilyModelRevision(midiDestination: number, manufacturer: NSData, family: NSData, modelNumber: NSData, revisionLevel: NSData): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MIDINetworkSession extends NSObject {
  static defaultSession(): MIDINetworkSession;

  enabled: boolean;

  readonly networkPort: number;

  readonly networkName: string;

  readonly localName: string;

  connectionPolicy: interop.Enum<typeof MIDINetworkConnectionPolicy>;

  contacts(): NSSet;

  addContact(contact: MIDINetworkHost): boolean;

  removeContact(contact: MIDINetworkHost): boolean;

  connections(): NSSet;

  addConnection(connection: MIDINetworkConnection): boolean;

  removeConnection(connection: MIDINetworkConnection): boolean;

  sourceEndpoint(): number;

  destinationEndpoint(): number;

  isEnabled(): boolean;
}

export declare class MIDINetworkConnection extends NSObject {
  static connectionWithHost<This extends abstract new (...args: any) => any>(this: This, host: MIDINetworkHost): InstanceType<This>;

  readonly host: MIDINetworkHost;
}

export declare class MIDINetworkHost extends NSObject {
  static hostWithNameAddressPort<This extends abstract new (...args: any) => any>(this: This, name: string, address: string, port: number): InstanceType<This>;

  static hostWithNameNetService<This extends abstract new (...args: any) => any>(this: This, name: string, netService: NSNetService): InstanceType<This>;

  static hostWithNameNetServiceNameNetServiceDomain<This extends abstract new (...args: any) => any>(this: This, name: string, netServiceName: string, netServiceDomain: string): InstanceType<This>;

  hasSameAddressAs(other: MIDINetworkHost): boolean;

  readonly name: string;

  readonly address: string;

  readonly port: number;

  readonly netServiceName: string;

  readonly netServiceDomain: string;
}

export declare class MIDICIDiscoveryManager extends NSObject {
  static sharedInstance(): MIDICIDiscoveryManager;

  discoverWithHandler(completedHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;
}

export declare class MIDICIProfileState extends NSObject implements NSSecureCoding {
  readonly midiChannel: number;

  readonly enabledProfiles: NSArray;

  readonly disabledProfiles: NSArray;

  initWithChannelEnabledProfilesDisabledProfiles(midiChannelNum: number, enabled: NSArray<interop.Object> | Array<interop.Object>, disabled: NSArray<interop.Object> | Array<interop.Object>): this;

  initWithEnabledProfilesDisabledProfiles(enabled: NSArray<interop.Object> | Array<interop.Object>, disabled: NSArray<interop.Object> | Array<interop.Object>): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MIDICIProfile extends NSObject implements NSSecureCoding {
  readonly name: string;

  readonly profileID: NSData;

  initWithData(data: NSData): this;

  initWithDataName(data: NSData, inName: string): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class MIDICISession extends NSObject {
  initWithDiscoveredNodeDataReadyHandlerDisconnectHandler(discoveredNode: MIDICIDiscoveredNode, handler: () => void, disconnectHandler: (p1: MIDICISession, p2: NSError) => void): this;

  readonly midiDestination: number;

  readonly supportsProfileCapability: boolean;

  readonly supportsPropertyCapability: boolean;

  readonly deviceInfo: MIDICIDeviceInfo;

  readonly maxSysExSize: NSNumber;

  readonly maxPropertyRequests: NSNumber;

  profileStateForChannel(channel: number): MIDICIProfileState;

  enableProfileOnChannelError(profile: MIDICIProfile, channel: number, outError: interop.PointerConvertible): boolean;

  disableProfileOnChannelError(profile: MIDICIProfile, channel: number, outError: interop.PointerConvertible): boolean;

  sendProfileOnChannelProfileData(profile: MIDICIProfile, channel: number, profileSpecificData: NSData): boolean;

  profileChangedCallback: (p1: MIDICISession, p2: number, p3: MIDICIProfile, p4: boolean) => void;

  profileSpecificDataHandler: (p1: MIDICISession, p2: number, p3: MIDICIProfile, p4: NSData) => void;
}
