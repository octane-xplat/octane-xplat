import type { NSArray, NSCopying, NSData, NSDictionary, NSError, NSInputStream, NSNumber, NSOutputStream, NSUUID } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const CBUUIDCharacteristicValidRangeString: string;

export declare const CBUUIDClientCharacteristicConfigurationString: string;

export declare const CBUUIDCharacteristicUserDescriptionString: string;

export declare const CBPeripheralManagerRestoredStateServicesKey: string;

export declare const CBPeripheralManagerOptionShowPowerAlertKey: string;

export declare const CBATTErrorDomain: string;

export declare const CBCentralManagerRestoredStateScanOptionsKey: string;

export declare const CBCentralManagerRestoredStateScanServicesKey: string;

export declare const CBConnectPeripheralOptionStartDelayKey: string;

export declare const CBConnectPeripheralOptionNotifyOnNotificationKey: string;

export declare const CBConnectPeripheralOptionNotifyOnConnectionKey: string;

export declare const CBCentralManagerScanOptionSolicitedServiceUUIDsKey: string;

export declare const CBCentralManagerOptionShowPowerAlertKey: string;

export declare const CBAdvertisementDataSolicitedServiceUUIDsKey: string;

export declare const CBAdvertisementDataIsConnectable: string;

export declare const CBUUIDCharacteristicObservationScheduleString: string;

export declare const CBAdvertisementDataTxPowerLevelKey: string;

export declare const CBCentralManagerScanOptionAllowDuplicatesKey: string;

export declare const CBConnectPeripheralOptionNotifyOnDisconnectionKey: string;

export declare const CBUUIDCharacteristicExtendedPropertiesString: string;

export declare const CBCentralManagerOptionRestoreIdentifierKey: string;

export declare const CBAdvertisementDataServiceDataKey: string;

export declare const CBPeripheralManagerOptionRestoreIdentifierKey: string;

export declare const CBAdvertisementDataOverflowServiceUUIDsKey: string;

export declare const CBUUIDL2CAPPSMCharacteristicString: string;

export declare const CBUUIDCharacteristicFormatString: string;

export declare const CBAdvertisementDataServiceUUIDsKey: string;

export declare const CBAdvertisementDataLocalNameKey: string;

export declare const CBAdvertisementDataManufacturerDataKey: string;

export declare const CBErrorDomain: string;

export declare const CBUUIDCharacteristicAggregateFormatString: string;

export declare const CBPeripheralManagerRestoredStateAdvertisementDataKey: string;

export declare const CBCentralManagerRestoredStatePeripheralsKey: string;

export declare const CBUUIDServerCharacteristicConfigurationString: string;

export declare const CBAttributePermissions: {
  Readable: 1,
  Writeable: 2,
  ReadEncryptionRequired: 4,
  WriteEncryptionRequired: 8,
};

export declare const CBCharacteristicWriteType: {
  With: 0,
  Without: 1,
};

export declare const CBPeripheralState: {
  Disconnected: 0,
  Connecting: 1,
  Connected: 2,
  Disconnecting: 3,
};

export declare const CBPeripheralManagerConnectionLatency: {
  Low: 0,
  Medium: 1,
  High: 2,
};

export declare const CBPeripheralManagerState: {
  Unknown: 0,
  Resetting: 1,
  Unsupported: 2,
  Unauthorized: 3,
  PoweredOff: 4,
  PoweredOn: 5,
};

export declare const CBConnectionEvent: {
  Disconnected: 0,
  Connected: 1,
};

export declare const CBCentralManagerState: {
  Unknown: 0,
  Resetting: 1,
  Unsupported: 2,
  Unauthorized: 3,
  PoweredOff: 4,
  PoweredOn: 5,
};

export declare const CBCharacteristicProperties: {
  Broadcast: 1,
  Read: 2,
  WriteWithoutResponse: 4,
  Write: 8,
  Notify: 16,
  Indicate: 32,
  AuthenticatedSignedWrites: 64,
  ExtendedProperties: 128,
  NotifyEncryptionRequired: 256,
  IndicateEncryptionRequired: 512,
};

export declare const CBError: {
  Unknown: 0,
  InvalidParameters: 1,
  InvalidHandle: 2,
  NotConnected: 3,
  OutOfSpace: 4,
  OperationCancelled: 5,
  ConnectionTimeout: 6,
  PeripheralDisconnected: 7,
  UUIDNotAllowed: 8,
  AlreadyAdvertising: 9,
  ConnectionFailed: 10,
  ConnectionLimitReached: 11,
  UnkownDevice: 12,
  UnknownDevice: 12,
  OperationNotSupported: 13,
  PeerRemovedPairingInformation: 14,
  EncryptionTimedOut: 15,
  TooManyLEPairedDevices: 16,
};

export declare const CBManagerAuthorization: {
  NotDetermined: 0,
  Restricted: 1,
  Denied: 2,
  AllowedAlways: 3,
};

export declare const CBATTError: {
  Success: 0,
  InvalidHandle: 1,
  ReadNotPermitted: 2,
  WriteNotPermitted: 3,
  InvalidPdu: 4,
  InsufficientAuthentication: 5,
  RequestNotSupported: 6,
  InvalidOffset: 7,
  InsufficientAuthorization: 8,
  PrepareQueueFull: 9,
  AttributeNotFound: 10,
  AttributeNotLong: 11,
  InsufficientEncryptionKeySize: 12,
  InvalidAttributeValueLength: 13,
  UnlikelyError: 14,
  InsufficientEncryption: 15,
  UnsupportedGroupType: 16,
  InsufficientResources: 17,
};

export declare const CBPeripheralManagerAuthorizationStatus: {
  NotDetermined: 0,
  Restricted: 1,
  Denied: 2,
  Authorized: 3,
};

export declare const CBManagerState: {
  Unknown: 0,
  Resetting: 1,
  Unsupported: 2,
  Unauthorized: 3,
  PoweredOff: 4,
  PoweredOn: 5,
};

export declare interface CBPeripheralManagerDelegate extends NSObjectProtocol {
  peripheralManagerDidUpdateState(peripheral: CBPeripheralManager): void;

  peripheralManagerWillRestoreState?(peripheral: CBPeripheralManager, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  peripheralManagerDidStartAdvertisingError?(peripheral: CBPeripheralManager, error: NSError | null): void;

  peripheralManagerDidAddServiceError?(peripheral: CBPeripheralManager, service: CBService, error: NSError | null): void;

  peripheralManagerCentralDidSubscribeToCharacteristic?(peripheral: CBPeripheralManager, central: CBCentral, characteristic: CBCharacteristic): void;

  peripheralManagerCentralDidUnsubscribeFromCharacteristic?(peripheral: CBPeripheralManager, central: CBCentral, characteristic: CBCharacteristic): void;

  peripheralManagerDidReceiveReadRequest?(peripheral: CBPeripheralManager, request: CBATTRequest): void;

  peripheralManagerDidReceiveWriteRequests?(peripheral: CBPeripheralManager, requests: NSArray<interop.Object> | Array<interop.Object>): void;

  peripheralManagerIsReadyToUpdateSubscribers?(peripheral: CBPeripheralManager): void;

  peripheralManagerDidPublishL2CAPChannelError?(peripheral: CBPeripheralManager, PSM: number, error: NSError | null): void;

  peripheralManagerDidUnpublishL2CAPChannelError?(peripheral: CBPeripheralManager, PSM: number, error: NSError | null): void;

  peripheralManagerDidOpenL2CAPChannelError?(peripheral: CBPeripheralManager, channel: CBL2CAPChannel | null, error: NSError | null): void;
}

export declare class CBPeripheralManagerDelegate extends NativeObject implements CBPeripheralManagerDelegate {
}

export declare interface CBCentralManagerDelegate extends NSObjectProtocol {
  centralManagerDidUpdateState(central: CBCentralManager): void;

  centralManagerWillRestoreState?(central: CBCentralManager, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  centralManagerDidDiscoverPeripheralAdvertisementDataRSSI?(central: CBCentralManager, peripheral: CBPeripheral, advertisementData: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, RSSI: NSNumber): void;

  centralManagerDidConnectPeripheral?(central: CBCentralManager, peripheral: CBPeripheral): void;

  centralManagerDidFailToConnectPeripheralError?(central: CBCentralManager, peripheral: CBPeripheral, error: NSError | null): void;

  centralManagerDidDisconnectPeripheralError?(central: CBCentralManager, peripheral: CBPeripheral, error: NSError | null): void;

  centralManagerDidDisconnectPeripheralTimestampIsReconnectingError?(central: CBCentralManager, peripheral: CBPeripheral, timestamp: number, isReconnecting: boolean, error: NSError | null): void;
}

export declare class CBCentralManagerDelegate extends NativeObject implements CBCentralManagerDelegate {
}

export declare interface CBPeripheralDelegate extends NSObjectProtocol {
  peripheralDidUpdateName?(peripheral: CBPeripheral): void;

  peripheralDidModifyServices?(peripheral: CBPeripheral, invalidatedServices: NSArray<interop.Object> | Array<interop.Object>): void;

  peripheralDidUpdateRSSIError?(peripheral: CBPeripheral, error: NSError | null): void;

  peripheralDidReadRSSIError?(peripheral: CBPeripheral, RSSI: NSNumber, error: NSError | null): void;

  peripheralDidDiscoverServices?(peripheral: CBPeripheral, error: NSError | null): void;

  peripheralDidDiscoverIncludedServicesForServiceError?(peripheral: CBPeripheral, service: CBService, error: NSError | null): void;

  peripheralDidDiscoverCharacteristicsForServiceError?(peripheral: CBPeripheral, service: CBService, error: NSError | null): void;

  peripheralDidUpdateValueForCharacteristicError?(peripheral: CBPeripheral, characteristic: CBCharacteristic, error: NSError | null): void;

  peripheralDidWriteValueForCharacteristicError?(peripheral: CBPeripheral, characteristic: CBCharacteristic, error: NSError | null): void;

  peripheralDidUpdateNotificationStateForCharacteristicError?(peripheral: CBPeripheral, characteristic: CBCharacteristic, error: NSError | null): void;

  peripheralDidDiscoverDescriptorsForCharacteristicError?(peripheral: CBPeripheral, characteristic: CBCharacteristic, error: NSError | null): void;

  peripheralDidUpdateValueForDescriptorError?(peripheral: CBPeripheral, descriptor: CBDescriptor, error: NSError | null): void;

  peripheralDidWriteValueForDescriptorError?(peripheral: CBPeripheral, descriptor: CBDescriptor, error: NSError | null): void;

  peripheralIsReadyToSendWriteWithoutResponse?(peripheral: CBPeripheral): void;

  peripheralDidOpenL2CAPChannelError?(peripheral: CBPeripheral, channel: CBL2CAPChannel | null, error: NSError | null): void;
}

export declare class CBPeripheralDelegate extends NativeObject implements CBPeripheralDelegate {
}

export declare class CBUUID extends NSObject implements NSCopying {
  readonly data: NSData;

  readonly UUIDString: string;

  static UUIDWithString(theString: string): CBUUID;

  static UUIDWithData(theData: NSData): CBUUID;

  static UUIDWithCFUUID(theUUID: interop.Object): CBUUID;

  static UUIDWithNSUUID(theUUID: NSUUID): CBUUID;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CBMutableDescriptor extends CBDescriptor {
  initWithTypeValue(UUID: CBUUID, value: interop.Object | null): this;
}

export declare class CBCharacteristic extends CBAttribute {
  readonly service: CBService | null;

  readonly properties: interop.Enum<typeof CBCharacteristicProperties>;

  readonly value: NSData;

  readonly descriptors: NSArray;

  readonly isBroadcasted: boolean;

  readonly isNotifying: boolean;
}

export declare class CBService extends CBAttribute {
  readonly peripheral: CBPeripheral | null;

  readonly isPrimary: boolean;

  readonly includedServices: NSArray;

  readonly characteristics: NSArray;
}

export declare class CBPeripheral extends CBPeer {
  delegate: CBPeripheralDelegate;

  readonly name: string;

  readonly RSSI: NSNumber;

  readonly state: interop.Enum<typeof CBPeripheralState>;

  readonly services: NSArray;

  readonly canSendWriteWithoutResponse: boolean;

  readRSSI(): void;

  discoverServices(serviceUUIDs: NSArray<interop.Object> | Array<interop.Object> | null): void;

  discoverIncludedServicesForService(includedServiceUUIDs: NSArray<interop.Object> | Array<interop.Object> | null, service: CBService): void;

  discoverCharacteristicsForService(characteristicUUIDs: NSArray<interop.Object> | Array<interop.Object> | null, service: CBService): void;

  readValueForCharacteristic(characteristic: CBCharacteristic): void;

  maximumWriteValueLengthForType(type: interop.Enum<typeof CBCharacteristicWriteType>): number;

  writeValueForCharacteristicType(data: NSData, characteristic: CBCharacteristic, type: interop.Enum<typeof CBCharacteristicWriteType>): void;

  setNotifyValueForCharacteristic(enabled: boolean, characteristic: CBCharacteristic): void;

  discoverDescriptorsForCharacteristic(characteristic: CBCharacteristic): void;

  readValueForDescriptor(descriptor: CBDescriptor): void;

  writeValueForDescriptor(data: NSData, descriptor: CBDescriptor): void;

  openL2CAPChannel(PSM: number): void;
}

export declare class CBPeer extends NSObject implements NSCopying {
  readonly identifier: NSUUID;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CBManager extends NSObject {
  readonly state: interop.Enum<typeof CBManagerState>;

  readonly authorization: interop.Enum<typeof CBManagerAuthorization>;

  static readonly authorization: interop.Enum<typeof CBManagerAuthorization>;
}

export declare class CBCentral extends CBPeer {
  readonly maximumUpdateValueLength: number;
}

export declare class CBL2CAPChannel extends NSObject {
  readonly peer: CBPeer;

  readonly inputStream: NSInputStream;

  readonly outputStream: NSOutputStream;

  readonly PSM: number;
}

export declare class CBATTRequest extends NSObject {
  readonly central: CBCentral;

  readonly characteristic: CBCharacteristic;

  readonly offset: number;

  value: NSData;
}

export declare class CBPeripheralManager extends CBManager {
  delegate: CBPeripheralManagerDelegate;

  readonly isAdvertising: boolean;

  static authorizationStatus(): interop.Enum<typeof CBPeripheralManagerAuthorizationStatus>;

  init(): this;

  initWithDelegateQueue(delegate: CBPeripheralManagerDelegate | null, queue: NSObject | null): this;

  initWithDelegateQueueOptions(delegate: CBPeripheralManagerDelegate | null, queue: NSObject | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  startAdvertising(advertisementData: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  stopAdvertising(): void;

  setDesiredConnectionLatencyForCentral(latency: interop.Enum<typeof CBPeripheralManagerConnectionLatency>, central: CBCentral): void;

  addService(service: CBMutableService): void;

  removeService(service: CBMutableService): void;

  removeAllServices(): void;

  respondToRequestWithResult(request: CBATTRequest, result: interop.Enum<typeof CBATTError>): void;

  updateValueForCharacteristicOnSubscribedCentrals(value: NSData, characteristic: CBMutableCharacteristic, centrals: NSArray<interop.Object> | Array<interop.Object> | null): boolean;

  publishL2CAPChannelWithEncryption(encryptionRequired: boolean): void;

  unpublishL2CAPChannel(PSM: number): void;
}

export declare class CBDescriptor extends CBAttribute {
  readonly characteristic: CBCharacteristic | null;

  readonly value: interop.Object;
}

export declare class CBMutableCharacteristic extends CBCharacteristic {
  permissions: interop.Enum<typeof CBAttributePermissions>;

  readonly subscribedCentrals: NSArray;

  // @ts-ignore MemberDecl.tsIgnore
  properties: interop.Enum<typeof CBCharacteristicProperties>;

  // @ts-ignore MemberDecl.tsIgnore
  value: NSData;

  // @ts-ignore MemberDecl.tsIgnore
  get descriptors(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set descriptors(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTypePropertiesValuePermissions(UUID: CBUUID, properties: interop.Enum<typeof CBCharacteristicProperties>, value: NSData | null, permissions: interop.Enum<typeof CBAttributePermissions>): this;
}

export declare class CBCentralManager extends CBManager {
  delegate: CBCentralManagerDelegate;

  readonly isScanning: boolean;

  init(): this;

  initWithDelegateQueue(delegate: CBCentralManagerDelegate | null, queue: NSObject | null): this;

  initWithDelegateQueueOptions(delegate: CBCentralManagerDelegate | null, queue: NSObject | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  retrievePeripheralsWithIdentifiers(identifiers: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  retrieveConnectedPeripheralsWithServices(serviceUUIDs: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  scanForPeripheralsWithServicesOptions(serviceUUIDs: NSArray<interop.Object> | Array<interop.Object> | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  stopScan(): void;

  connectPeripheralOptions(peripheral: CBPeripheral, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  cancelPeripheralConnection(peripheral: CBPeripheral): void;
}

export declare class CBAttribute extends NSObject {
  readonly UUID: CBUUID;
}

export declare class CBMutableService extends CBService {
  // @ts-ignore MemberDecl.tsIgnore
  get includedServices(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set includedServices(value: NSArray<interop.Object> | Array<interop.Object>);

  // @ts-ignore MemberDecl.tsIgnore
  get characteristics(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set characteristics(value: NSArray<interop.Object> | Array<interop.Object>);

  initWithTypePrimary(UUID: CBUUID, isPrimary: boolean): this;
}
