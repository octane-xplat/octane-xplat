/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const VZErrorDomain: string;

declare const VZVirtualMachineState: {
  Stopped: 0,
  Running: 1,
  Paused: 2,
  Error: 3,
  Starting: 4,
  Pausing: 5,
  Resuming: 6,
};

declare const VZErrorCode: {
  Internal: 1,
  InvalidVirtualMachineConfiguration: 2,
  InvalidVirtualMachineState: 3,
  InvalidVirtualMachineStateTransition: 4,
  InvalidDiskImage: 5,
};

declare interface VZVirtualMachineDelegate extends NSObjectProtocol {
  guestDidStopVirtualMachine?(virtualMachine: VZVirtualMachine): void;

  virtualMachineDidStopWithError?(virtualMachine: VZVirtualMachine, error: NSError): void;
}

declare class VZVirtualMachineDelegate extends NativeObject implements VZVirtualMachineDelegate {
}

declare interface VZVirtioSocketListenerDelegate extends NSObjectProtocol {
  listenerShouldAcceptNewConnectionFromSocketDevice?(listener: VZVirtioSocketListener, connection: VZVirtioSocketConnection, socketDevice: VZVirtioSocketDevice): boolean;
}

declare class VZVirtioSocketListenerDelegate extends NativeObject implements VZVirtioSocketListenerDelegate {
}

declare class VZVirtioTraditionalMemoryBalloonDevice extends VZMemoryBalloonDevice {
  targetVirtualMachineMemorySize: number;
}

declare class VZVirtioSocketListener extends NSObject {
  delegate: VZVirtioSocketListenerDelegate;
}

declare class VZVirtioSocketDeviceConfiguration extends VZSocketDeviceConfiguration {
  init(): this;
}

declare class VZVirtioNetworkDeviceConfiguration extends VZNetworkDeviceConfiguration {
  init(): this;
}

declare class VZSocketDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZSerialPortConfiguration extends NSObject implements NSCopying {
  attachment: VZSerialPortAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZNetworkDeviceConfiguration extends NSObject implements NSCopying {
  MACAddress: VZMACAddress;

  attachment: VZNetworkDeviceAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZStorageDeviceConfiguration extends NSObject implements NSCopying {
  readonly attachment: VZStorageDeviceAttachment;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZNATNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  init(): this;
}

declare class VZMemoryBalloonDevice extends NSObject {
}

declare class VZFileSerialPortAttachment extends VZSerialPortAttachment {
  initWithURLAppendError(url: NSURL, shouldAppend: boolean, error: interop.PointerConvertible): this;

  readonly URL: NSURL;

  readonly append: boolean;
}

declare class VZFileHandleSerialPortAttachment extends VZSerialPortAttachment {
  initWithFileHandleForReadingFileHandleForWriting(fileHandleForReading: NSFileHandle | null, fileHandleForWriting: NSFileHandle | null): this;

  readonly fileHandleForReading: NSFileHandle;

  readonly fileHandleForWriting: NSFileHandle;
}

declare class VZSerialPortAttachment extends NSObject {
}

declare class VZEntropyDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZDiskImageStorageDeviceAttachment extends VZStorageDeviceAttachment {
  initWithURLReadOnlyError(url: NSURL, readOnly: boolean, error: interop.PointerConvertible): this;

  readonly URL: NSURL;

  readonly readOnly: boolean;

  isReadOnly(): boolean;
}

declare class VZStorageDeviceAttachment extends NSObject {
}

declare class VZNetworkDeviceAttachment extends NSObject {
}

declare class VZBootLoader extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZBridgedNetworkInterface extends NSObject {
  static readonly networkInterfaces: NSArray;

  readonly identifier: string;

  readonly localizedDisplayName: string;
}

declare class VZLinuxBootLoader extends VZBootLoader {
  initWithKernelURL(kernelURL: NSURL): this;

  kernelURL: NSURL;

  commandLine: string;

  initialRamdiskURL: NSURL;
}

declare class VZVirtioBlockDeviceConfiguration extends VZStorageDeviceConfiguration {
  initWithAttachment(attachment: VZStorageDeviceAttachment): this;
}

declare class VZMACAddress extends NSObject implements NSCopying {
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

declare class VZVirtioConsoleDeviceSerialPortConfiguration extends VZSerialPortConfiguration {
  init(): this;
}

declare class VZMemoryBalloonDeviceConfiguration extends NSObject implements NSCopying {
  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class VZVirtioEntropyDeviceConfiguration extends VZEntropyDeviceConfiguration {
  init(): this;
}

declare class VZVirtioSocketDevice extends VZSocketDevice {
  setSocketListenerForPort(listener: VZVirtioSocketListener, port: number): void;

  removeSocketListenerForPort(port: number): void;

  connectToPortCompletionHandler(port: number, completionHandler: (p1: VZVirtioSocketConnection, p2: NSError) => void | null): void;
}

declare class VZVirtualMachineConfiguration extends NSObject implements NSCopying {
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

declare class VZVirtioTraditionalMemoryBalloonDeviceConfiguration extends VZMemoryBalloonDeviceConfiguration {
  init(): this;
}

declare class VZVirtualMachine extends NSObject {
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

declare class VZSocketDevice extends NSObject {
}

declare class VZVirtioSocketConnection extends NSObject {
  readonly destinationPort: number;

  readonly sourcePort: number;

  readonly fileDescriptor: number;

  close(): void;
}

declare class VZBridgedNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  initWithInterface(interface: VZBridgedNetworkInterface): this;

  readonly interface: VZBridgedNetworkInterface;
}

declare class VZFileHandleNetworkDeviceAttachment extends VZNetworkDeviceAttachment {
  initWithFileHandle(fileHandle: NSFileHandle): this;

  readonly fileHandle: NSFileHandle;
}

