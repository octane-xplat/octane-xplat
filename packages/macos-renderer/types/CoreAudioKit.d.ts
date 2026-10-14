/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./AppKit.d.ts" />
/// <reference path="./Runtime.d.ts" />

declare const AUGenericViewDisplayFlags: {
  Title: 1,
  Properties: 2,
  Parameters: 4,
};

declare interface AUCustomViewPersistentData {
  get customViewPersistentData(): NSDictionary;
  set customViewPersistentData(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);
}

declare class AUCustomViewPersistentData extends NativeObject implements AUCustomViewPersistentData {
}

declare class CABTLEMIDIWindowController extends NSWindowController {
}

declare class AUGenericView extends NSView implements AUCustomViewPersistentData {
  readonly audioUnit: interop.Pointer;

  showsExpertParameters: boolean;

  initWithAudioUnit(au: interop.PointerConvertible): this;

  initWithAudioUnitDisplayFlags(inAudioUnit: interop.PointerConvertible, inFlags: interop.Enum<typeof AUGenericViewDisplayFlags>): this;

  get customViewPersistentData(): NSDictionary;
  set customViewPersistentData(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);
}

declare class AUPannerView extends NSView {
  readonly audioUnit: interop.Pointer;

  static AUPannerViewWithAudioUnit(au: interop.PointerConvertible): AUPannerView;
}

declare class CAInterDeviceAudioViewController extends NSViewController {
}

declare class AUAudioUnitViewConfiguration extends NSObject implements NSSecureCoding {
  initWithWidthHeightHostHasController(width: number, height: number, hostHasController: boolean): this;

  readonly width: number;

  readonly height: number;

  readonly hostHasController: boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class CANetworkBrowserWindowController extends NSWindowController {
  static isAVBSupported(): boolean;

  init(): this;
}

declare class AUViewController extends NSViewController implements NSExtensionRequestHandling {
  beginRequestWithExtensionContext(context: NSExtensionContext): void;

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

