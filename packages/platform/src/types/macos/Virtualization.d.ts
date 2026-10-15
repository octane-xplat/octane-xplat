import type { NSArray, NSCopying, NSError, NSFileHandle, NSURL } from './Foundation'

import type { NSObjectProtocol, ether_addr } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const VZErrorDomain: string;

export declare const VZVirtualMachineState: {
  Stopped: 0,
  Running: 1,
  Paused: 2,
  Error: 3,
  Starting: 4,
  Pausing: 5,
  Resuming: 6,
};

export declare const VZErrorCode: {
  Internal: 1,
  InvalidVirtualMachineConfiguration: 2,
  InvalidVirtualMachineState: 3,
  InvalidVirtualMachineStateTransition: 4,
  InvalidDiskImage: 5,
};

export declare interface VZVirtualMachineDelegate extends NSObjectProtocol {
  guestDidStopVirtualMachine?(virtualMachine: VZVirtualMachine): void;

  virtualMachineDidStopWithError?(virtualMachine: VZVirtualMachine, error: NSError): void;
}

export declare class VZVirtualMachineDelegate extends NativeObject implements VZVirtualMachineDelegate {
}

export declare interface VZVirtioSocketListenerDelegate extends NSObjectProtocol {
  listenerShouldAcceptNewConnectionFromSocketDevice?(listener: VZVirtioSocketListener, connection: VZVirtioSocketConnection, socketDevice: VZVirtioSocketDevice): boolean;
}

export declare class VZVirtioSocketListenerDelegate extends NativeObject implements VZVirtioSocketListenerDelegate {
}

export declare class VZVirtioTraditionalMemoryBalloonDevice extends VZMemoryBalloonDevice {
  targetVirtualMachineMemorySize: number;
}

export declare class VZVirtioSocketListener extends NSObject {
  delegate: VZVirtioSocketListenerDelegate;
}

export declare class VZVirtioSocketDeviceConfiguration extends VZSocketDeviceConfiguration {
  init(): this;
}

export declare class VZVirtioNetworkDeviceConfiguration extends VZNetworkDeviceConfiguration {
  init(): this;
}

export declare class VZSocketDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZSerialPortConfiguration extends NSObject implements NSCopying {
  attachment: VZSerialPortAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZNetworkDeviceConfiguration extends NSObject implements NSCopying {
  MACAddress: VZMACAddress;

  attachment: VZNetworkDeviceAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZStorageDeviceConfiguration extends NSObject implements NSCopying {
  readonly attachment: VZStorageDeviceAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZNATNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  init(): this;
}

export declare class VZMemoryBalloonDevice extends NSObject {
}

export declare class VZFileSerialPortAttachment extends VZSerialPortAttachment {
  initWithURLAppendError(url: NSURL, shouldAppend: boolean, error: interop.PointerConvertible): this;

  readonly URL: NSURL;

  readonly append: boolean;
}

export declare class VZFileHandleSerialPortAttachment extends VZSerialPortAttachment {
  initWithFileHandleForReadingFileHandleForWriting(fileHandleForReading: NSFileHandle | null, fileHandleForWriting: NSFileHandle | null): this;

  readonly fileHandleForReading: NSFileHandle;

  readonly fileHandleForWriting: NSFileHandle;
}

export declare class VZSerialPortAttachment extends NSObject {
}

export declare class VZEntropyDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZDiskImageStorageDeviceAttachment extends VZStorageDeviceAttachment {
  initWithURLReadOnlyError(url: NSURL, readOnly: boolean, error: interop.PointerConvertible): this;

  readonly URL: NSURL;

  readonly readOnly: boolean;

  isReadOnly(): boolean;
}

export declare class VZStorageDeviceAttachment extends NSObject {
}

export declare class VZNetworkDeviceAttachment extends NSObject {
}

export declare class VZBootLoader extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZBridgedNetworkInterface extends NSObject {
  static readonly networkInterfaces: NSArray;

  readonly identifier: string;

  readonly localizedDisplayName: string;
}

export declare class VZLinuxBootLoader extends VZBootLoader {
  initWithKernelURL(kernelURL: NSURL): this;

  kernelURL: NSURL;

  commandLine: string;

  initialRamdiskURL: NSURL;
}

export declare class VZVirtioBlockDeviceConfiguration extends VZStorageDeviceConfiguration {
  initWithAttachment(attachment: VZStorageDeviceAttachment): this;
}

export declare class VZMACAddress extends NSObject implements NSCopying {
  initWithEthernetAddress(ethernetAddress: ether_addr): this;

  initWithString(string: string): this;

  static randomLocallyAdministeredAddress<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  readonly ethernetAddress: ether_addr;

  readonly string: string;

  readonly isBroadcastAddress: boolean;

  readonly isMulticastAddress: boolean;

  readonly isUnicastAddress: boolean;

  readonly isLocallyAdministeredAddress: boolean;

  readonly isUniversallyAdministeredAddress: boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZVirtioConsoleDeviceSerialPortConfiguration extends VZSerialPortConfiguration {
  init(): this;
}

export declare class VZMemoryBalloonDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZVirtioEntropyDeviceConfiguration extends VZEntropyDeviceConfiguration {
  init(): this;
}

export declare class VZVirtioSocketDevice extends VZSocketDevice {
  setSocketListenerForPort(listener: VZVirtioSocketListener, port: number): void;

  removeSocketListenerForPort(port: number): void;

  connectToPortCompletionHandler(port: number, completionHandler: (p1: VZVirtioSocketConnection, p2: NSError) => void | null): void;
}

export declare class VZVirtualMachineConfiguration extends NSObject implements NSCopying {
  bootLoader: VZBootLoader;

  memorySize: number;

  CPUCount: number;

  get entropyDevices(): NSArray;
  set entropyDevices(value: NSArray<interop.Object> | Array<interop.Object>);

  get memoryBalloonDevices(): NSArray;
  set memoryBalloonDevices(value: NSArray<interop.Object> | Array<interop.Object>);

  get networkDevices(): NSArray;
  set networkDevices(value: NSArray<interop.Object> | Array<interop.Object>);

  get serialPorts(): NSArray;
  set serialPorts(value: NSArray<interop.Object> | Array<interop.Object>);

  get socketDevices(): NSArray;
  set socketDevices(value: NSArray<interop.Object> | Array<interop.Object>);

  get storageDevices(): NSArray;
  set storageDevices(value: NSArray<interop.Object> | Array<interop.Object>);

  validateWithError(error: interop.PointerConvertible): boolean;

  static readonly minimumAllowedMemorySize: number;

  static readonly maximumAllowedMemorySize: number;

  static readonly minimumAllowedCPUCount: number;

  static readonly maximumAllowedCPUCount: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class VZVirtioTraditionalMemoryBalloonDeviceConfiguration extends VZMemoryBalloonDeviceConfiguration {
  init(): this;
}

export declare class VZVirtualMachine extends NSObject {
  initWithConfiguration(configuration: VZVirtualMachineConfiguration): this;

  initWithConfigurationQueue(configuration: VZVirtualMachineConfiguration, queue: NSObject): this;

  static readonly supported: boolean;

  readonly state: interop.Enum<typeof VZVirtualMachineState>;

  delegate: VZVirtualMachineDelegate;

  readonly canStart: boolean;

  readonly canPause: boolean;

  readonly canResume: boolean;

  readonly canRequestStop: boolean;

  readonly memoryBalloonDevices: NSArray;

  readonly socketDevices: NSArray;

  startWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  pauseWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  resumeWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void;

  requestStopWithError(error: interop.PointerConvertible): boolean;

  static isSupported(): boolean;
}

export declare class VZSocketDevice extends NSObject {
}

export declare class VZVirtioSocketConnection extends NSObject {
  readonly destinationPort: number;

  readonly sourcePort: number;

  readonly fileDescriptor: number;

  close(): void;
}

export declare class VZBridgedNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  initWithInterface(interface: VZBridgedNetworkInterface): this;

  readonly interface: VZBridgedNetworkInterface;
}

export declare class VZFileHandleNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  initWithFileHandle(fileHandle: NSFileHandle): this;

  readonly fileHandle: NSFileHandle;
}
