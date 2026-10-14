/// <reference types="@nativescript/objc-node-api" />

declare const MTRDiscoveryCapabilities: {
  Unknown: 0,
  SoftAP: 1,
  BLE: 2,
  OnNetwork: 4,
  AllMask: 7,
};

declare const MTRLogType: {
  Error: 1,
  Progress: 2,
  Detail: 3,
};

declare const MTRDeviceState: {
  Unknown: 0,
  Reachable: 1,
  Unreachable: 2,
};

declare const MTROptionalQRCodeInfoType: {
  String: 1,
  Int32: 2,
};

declare interface MTROTAProviderDelegate extends NSObjectProtocol {
}

declare class MTROTAProviderDelegate extends NativeObject implements MTROTAProviderDelegate {
}

declare interface MTRDeviceControllerClientProtocol extends NSObjectProtocol {
  handleReportWithControllerNodeIdValuesError(controller: interop.Object | null, nodeId: number, values: interop.Object | null, error: NSError | null): void;
}

declare class MTRDeviceControllerClientProtocol extends NativeObject implements MTRDeviceControllerClientProtocol {
}

declare interface MTRDeviceControllerServerProtocol extends NSObjectProtocol {
  getAnyDeviceControllerWithCompletion(completion: (p1: interop.Object, p2: NSError) => void): void;

  readAttributeWithControllerNodeIdEndpointIdClusterIdAttributeIdParamsCompletion(controller: interop.Object | null, nodeId: number, endpointId: NSNumber | null, clusterId: NSNumber | null, attributeId: NSNumber | null, params: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, completion: (p1: interop.Object, p2: NSError) => void): void;

  writeAttributeWithControllerNodeIdEndpointIdClusterIdAttributeIdValueTimedWriteTimeoutCompletion(controller: interop.Object | null, nodeId: number, endpointId: NSNumber, clusterId: NSNumber, attributeId: NSNumber, value: interop.Object, timeoutMs: NSNumber | null, completion: (p1: interop.Object, p2: NSError) => void): void;

  invokeCommandWithControllerNodeIdEndpointIdClusterIdCommandIdFieldsTimedInvokeTimeoutCompletion(controller: interop.Object | null, nodeId: number, endpointId: NSNumber, clusterId: NSNumber, commandId: NSNumber, fields: interop.Object, timeoutMs: NSNumber | null, completion: (p1: interop.Object, p2: NSError) => void): void;

  subscribeAttributeWithControllerNodeIdEndpointIdClusterIdAttributeIdMinIntervalMaxIntervalParamsEstablishedHandler(controller: interop.Object | null, nodeId: number, endpointId: NSNumber | null, clusterId: NSNumber | null, attributeId: NSNumber | null, minInterval: NSNumber, maxInterval: NSNumber, params: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, establishedHandler: () => void): void;

  stopReportsWithControllerNodeIdCompletion(controller: interop.Object | null, nodeId: number, completion: () => void): void;

  subscribeWithControllerNodeIdMinIntervalMaxIntervalParamsShouldCacheCompletion(controller: interop.Object | null, nodeId: number, minInterval: NSNumber, maxInterval: NSNumber, params: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, shouldCache: boolean, completion: (p1: NSError) => void): void;

  readAttributeCacheWithControllerNodeIdEndpointIdClusterIdAttributeIdCompletion(controller: interop.Object | null, nodeId: number, endpointId: NSNumber | null, clusterId: NSNumber | null, attributeId: NSNumber | null, completion: (p1: interop.Object, p2: NSError) => void): void;
}

declare class MTRDeviceControllerServerProtocol extends NativeObject implements MTRDeviceControllerServerProtocol {
}

declare interface MTRDeviceDelegate extends NSObjectProtocol {
  deviceStateChanged(device: MTRDevice, state: interop.Enum<typeof MTRDeviceState>): void;

  deviceReceivedAttributeReport(device: MTRDevice, attributeReport: NSArray<interop.Object> | Array<interop.Object>): void;

  deviceReceivedEventReport(device: MTRDevice, eventReport: NSArray<interop.Object> | Array<interop.Object>): void;
}

declare class MTRDeviceDelegate extends NativeObject implements MTRDeviceDelegate {
}

declare interface MTRDeviceAttestationDelegate extends NSObjectProtocol {
}

declare class MTRDeviceAttestationDelegate extends NativeObject implements MTRDeviceAttestationDelegate {
}

