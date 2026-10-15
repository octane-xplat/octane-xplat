import type { NSColor, NSDraggingSession, NSDraggingSource, NSImage, NSObjectController, NSOpenGLContext, NSOpenGLPixelFormat, NSSavePanel, NSSegmentedControl, NSSlider, NSWindow } from './AppKit'

import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { CIFilter } from './CoreImage'

import type { NSArray, NSCopying, NSData, NSDictionary, NSError, NSIndexSet, NSMutableDictionary, NSURL } from './Foundation'

import type { ICCameraDevice, ICCameraFile, ICDevice, ICScannerBandData, ICScannerDevice } from './ImageCaptureCore'

import type { CALayer } from './QuartzCore'

import type { interop } from './objc-runtime'

import { NSController, NSDragOperation, NSDraggingContext, NSImageAlignment, NSPanel, NSView, NSViewController } from './AppKit'

import { CAOpenGLLayer } from './QuartzCore'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const IKPictureTakerShowAddressBookPicture: string;

export declare const IKToolModeSelectEllipse: string;

export declare const IKToolModeSelect: string;

export declare const IKToolModeMove: string;

export declare const IKToolModeNone: string;

export declare const IK_MailBundleIdentifier: string;

export declare const IK_ApertureBundleIdentifier: string;

export declare const IK_iPhotoBundleIdentifier: string;

export declare const IKSlideshowPDFDisplaysAsBook: string;

export declare const IKSlideshowPDFDisplayMode: string;

export declare const IKSlideshowAudioFile: string;

export declare const IKSlideshowScreen: string;

export declare const IKSlideshowStartPaused: string;

export declare const IKSlideshowWrapAround: string;

export declare const IKFilterBrowserExcludeCategories: string;

export declare const IKFilterBrowserShowCategories: string;

export declare const IKFilterBrowserWillPreviewFilterNotification: string;

export declare const IKFilterBrowserFilterDoubleClickNotification: string;

export declare const IKUISizeMini: string;

export declare const IKPictureTakerImageTransformsKey: string;

export declare const IKPictureTakerShowEffectsKey: string;

export declare const IKPictureTakerUpdateRecentPictureKey: string;

export declare const IKPictureTakerShowRecentPictureKey: string;

export declare const IKPictureTakerAllowsFileChoosingKey: string;

export declare const IKImageBrowserCellForegroundLayer: string;

export declare const IKImageBrowserCellBackgroundLayer: string;

export declare const IKImageBrowserGroupFooterLayer: string;

export declare const IKImageBrowserGroupStyleKey: string;

export declare const IKImageBrowserGroupBackgroundColorKey: string;

export declare const IKImageBrowserGroupRangeKey: string;

export declare const IKImageBrowserCellsHighlightedTitleAttributesKey: string;

export declare const IKImageBrowserSelectionColorKey: string;

export declare const IKImageBrowserPDFPageRepresentationType: string;

export declare const IKImageBrowserQuickLookPathRepresentationType: string;

export declare const IKImageBrowserQCCompositionPathRepresentationType: string;

export declare const IKImageBrowserQTMovieRepresentationType: string;

export declare const IKImageBrowserCGImageRepresentationType: string;

export declare const IKImageBrowserNSImageRepresentationType: string;

export declare const IKImageBrowserNSURLRepresentationType: string;

export declare const IKImageBrowserPathRepresentationType: string;

export declare const IKGroupBezelStyle: number;

export declare const IKCellsStyleOutlined: number;

export declare const kQuartzFilterManagerDidAddFilterNotification: string;

export declare const globalUpdateOK: number;

export declare const QCCompositionPickerViewDidSelectCompositionNotification: string;

export declare const QCRendererMouseLocationKey: string;

export declare const QCCompositionRepositoryDidUpdateNotification: string;

export declare const QCCompositionProtocolScreenSaver: string;

export declare const QCCompositionProtocolGraphicAnimation: string;

export declare const QCCompositionOutputWebPageURLKey: string;

export declare const QCCompositionOutputImageKey: string;

export declare const QCCompositionInputPaceKey: string;

export declare const QCCompositionInputTrackSignalKey: string;

export declare const QCCompositionInputTrackInfoKey: string;

export declare const QCCompositionInputTrackPositionKey: string;

export declare const QCCompositionInputScreenImageKey: string;

export declare const QCCompositionInputXKey: string;

export declare const QCCompositionInputRSSFeedURLKey: string;

export declare const QCCompositionInputSourceImageKey: string;

export declare const QCCompositionInputImageKey: string;

export declare const QCCompositionCategoryStylize: string;

export declare const QCCompositionCategoryDistortion: string;

export declare const QCCompositionAttributeCategoryKey: string;

export declare const QCCompositionAttributeHasConsumersKey: string;

export declare const QCCompositionAttributeBuiltInKey: string;

export declare const QCCompositionAttributeCopyrightKey: string;

export declare const QCCompositionAttributeDescriptionKey: string;

export declare const QCPlugInExecutionArgumentEventKey: string;

export declare const QCPlugInPixelFormatIf: string;

export declare const QCPlugInPixelFormatBGRA8: string;

export declare const QCPortTypeImage: string;

export declare const QCPortTypeString: string;

export declare const QCPortTypeNumber: string;

export declare const QCPortTypeBoolean: string;

export declare const QCPortAttributeMinimumValueKey: string;

export declare const QCPortAttributeNameKey: string;

export declare const QCPortAttributeTypeKey: string;

export declare const QCPlugInAttributeCategoriesKey: string;

export declare const QCPlugInAttributeCopyrightKey: string;

export declare const QCPlugInAttributeDescriptionKey: string;

export declare const IKOverlayTypeImage: string;

export declare const QCCompositionInputDestinationImageKey: string;

export declare const IKSlideshowModePDF: string;

export declare const QCPortAttributeDefaultValueKey: string;

export declare const QCCompositionInputRSSArticleDurationKey: string;

export declare const IKFilterBrowserDefaultInputImage: string;

export declare const IKUISizeFlavor: string;

export declare const IKPictureTakerRemainOpenAfterValidateKey: string;

export declare const IKImageBrowserGroupHeaderLayer: string;

export declare const IKCellsStyleShadowed: number;

export declare const QCCompositionProtocolGraphicTransition: string;

export declare const QCPlugInPixelFormatI8: string;

export declare const QCPlugInAttributeNameKey: string;

export declare const IKCellsStyleTitled: number;

export declare const IKUImaxSize: string;

export declare const QCCompositionInputAudioPeakKey: string;

export declare const QCRendererEventKey: string;

export declare const QCPortTypeColor: string;

export declare const QCCompositionInputPreviewModeKey: string;

export declare const IKImageBrowserCellsTitleAttributesKey: string;

export declare const QCCompositionAttributeNameKey: string;

export declare const QCViewDidStartRenderingNotification: string;

export declare const QCPortAttributeMenuItemsKey: string;

export declare const kQuartzFilterManagerDidModifyFilterNotification: string;

export declare const IKImageBrowserIconRefPathRepresentationType: string;

export declare const IKSlideshowModeOther: string;

export declare const QCCompositionInputAudioSpectrumKey: string;

export declare const IKImageBrowserCellsSubtitleAttributesKey: string;

export declare const QCPortTypeIndex: string;

export declare const kQuartzFilterApplicationDomain: string;

export declare const IKImageBrowserCGImageSourceRepresentationType: string;

export declare const IK_PhotosBundleIdentifier: string;

export declare const IKImageBrowserCellPlaceHolderLayer: string;

export declare const QCPlugInPixelFormatRGBAf: string;

export declare const IKCellsStyleSubtitled: number;

export declare const kQuartzFilterManagerDidRemoveFilterNotification: string;

export declare const QCCompositionProtocolImageFilter: string;

export declare const IKPictureTakerAllowsVideoCaptureKey: string;

export declare const QCPlugInExecutionArgumentMouseLocationKey: string;

export declare const IKGroupDisclosureStyle: number;

export declare const IKPictureTakerAllowsEditingKey: string;

export declare const IKUISizeSmall: string;

export declare const QCCompositionProtocolRSSVisualizer: string;

export declare const IKPictureTakerShowEmptyPictureKey: string;

export declare const IKImageBrowserNSDataRepresentationType: string;

export declare const IKToolModeAnnotate: string;

export declare const QCPortAttributeMaximumValueKey: string;

export declare const IKOverlayTypeBackground: string;

export declare const QCCompositionPickerPanelDidSelectCompositionNotification: string;

export declare const IKCellsStyleNone: number;

export declare const QCPlugInAttributeExamplesKey: string;

export declare const QCViewDidStopRenderingNotification: string;

export declare const IKPictureTakerInformationalTextKey: string;

export declare const IKImageBrowserCellSelectionLayer: string;

export declare const IKSlideshowStartIndex: string;

export declare const IKFilterBrowserShowPreview: string;

export declare const IKSlideshowPDFDisplayBox: string;

export declare const IKPictureTakerOutputImageMaxSizeKey: string;

export declare const IKImageBrowserGroupTitleKey: string;

export declare const IKImageBrowserQCCompositionRepresentationType: string;

export declare const IKFilterBrowserFilterSelectedNotification: string;

export declare const QCPortTypeStructure: string;

export declare const IKToolModeSelectLasso: string;

export declare const IKToolModeRotate: string;

export declare const IKImageBrowserQTMoviePathRepresentationType: string;

export declare const kQuartzFilterPDFWorkflowDomain: string;

export declare const IKImageBrowserCellsOutlineColorKey: string;

export declare const IKPictureTakerShowAddressBookPictureKey: string;

export declare const IKFilterBrowserExcludeFilters: string;

export declare const IKImageBrowserNSBitmapImageRepresentationType: string;

export declare const IKImageBrowserIconRefRepresentationType: string;

export declare const kQuartzFilterPrintingDomain: string;

export declare const QCCompositionInputYKey: string;

export declare const IKUIFlavorAllowFallback: string;

export declare const QCPlugInPixelFormatARGB8: string;

export declare const IKSlideshowModeImages: string;

export declare const QCCompositionProtocolMusicVisualizer: string;

export declare const QCCompositionCategoryUtility: string;

export declare const IKUISizeRegular: string;

export declare const QCCompositionInputSecondaryColorKey: string;

export declare const kQuartzFilterManagerDidSelectFilterNotification: string;

export declare const IKToolModeCrop: string;

export declare const IKPictureTakerCropAreaSizeKey: string;

export declare const IKPictureTakerShowEmptyPicture: string;

export declare const IKImageBrowserBackgroundColorKey: string;

export declare const IKToolModeSelectRect: string;

export declare const QCCompositionInputPrimaryColorKey: string;

export declare const QCCompositionAttributeIsTimeDependentKey: string;

export declare const IKScannerDeviceViewDisplayMode: {
  None: -1,
  Simple: 0,
  Advanced: 1,
};

export declare const IKDeviceBrowserViewDisplayMode: {
  Table: 0,
  Outline: 1,
  Icon: 2,
};

export declare const IKImageBrowserCellState: {
  NoImage: 0,
  Invalid: 1,
  Ready: 2,
};

export declare const IKCameraDeviceViewTransferMode: {
  File: 0,
  Memory: 1,
};

export declare const QCPlugInExecutionMode: {
  Provider: 1,
  Processor: 2,
  Consumer: 3,
};

export declare const IKScannerDeviceViewTransferMode: {
  File: 0,
  Memory: 1,
};

export declare const QCPlugInTimeMode: {
  None: 0,
  Idle: 1,
  TimeBase: 2,
};

export declare const IKImageBrowserDropOperation: {
  On: 0,
  Before: 1,
};

export declare const IKCameraDeviceViewDisplayMode: {
  None: -1,
  Table: 0,
  Icon: 1,
};

export declare interface IKImageEditPanelDataSource {
  readonly image: interop.Object;

  setImageImageProperties(image: interop.Object, metaData: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  thumbnailWithMaximumSize?(size: CGSize): interop.Object;

  readonly imageProperties?: NSDictionary;

  readonly hasAdjustMode?: boolean;

  readonly hasEffectsMode?: boolean;

  readonly hasDetailsMode?: boolean;
}

export declare class IKImageEditPanelDataSource extends NativeObject implements IKImageEditPanelDataSource {
}

export declare interface IKScannerDeviceViewDelegate {
  scannerDeviceViewDidScanToURLFileDataError?(scannerDeviceView: IKScannerDeviceView, url: NSURL, data: NSData, error: NSError): void;

  scannerDeviceViewDidScanToURLError?(scannerDeviceView: IKScannerDeviceView, url: NSURL, error: NSError): void;

  scannerDeviceViewDidScanToBandDataScanInfoError?(scannerDeviceView: IKScannerDeviceView, data: ICScannerBandData, scanInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, error: NSError): void;

  scannerDeviceViewDidEncounterError?(scannerDeviceView: IKScannerDeviceView, error: NSError): void;
}

export declare class IKScannerDeviceViewDelegate extends NativeObject implements IKScannerDeviceViewDelegate {
}

export declare interface IKCameraDeviceViewDelegate {
  cameraDeviceViewSelectionDidChange?(cameraDeviceView: IKCameraDeviceView): void;

  cameraDeviceViewDidDownloadFileLocationFileDataError?(cameraDeviceView: IKCameraDeviceView, file: ICCameraFile, url: NSURL, data: NSData, error: NSError): void;

  cameraDeviceViewDidEncounterError?(cameraDeviceView: IKCameraDeviceView, error: NSError): void;
}

export declare class IKCameraDeviceViewDelegate extends NativeObject implements IKCameraDeviceViewDelegate {
}

export declare interface IKDeviceBrowserViewDelegate {
  deviceBrowserViewSelectionDidChange(deviceBrowserView: IKDeviceBrowserView, device: ICDevice): void;

  deviceBrowserViewDidEncounterError?(deviceBrowserView: IKDeviceBrowserView, error: NSError): void;
}

export declare class IKDeviceBrowserViewDelegate extends NativeObject implements IKDeviceBrowserViewDelegate {
}

export declare interface IKSlideshowDataSource {
  numberOfSlideshowItems(): number;

  slideshowItemAtIndex(index: number): interop.Object;

  nameOfSlideshowItemAtIndex?(index: number): string;

  canExportSlideshowItemAtIndexToApplication?(index: number, applicationBundleIdentifier: string): boolean;

  slideshowWillStart?(): void;

  slideshowDidStop?(): void;

  slideshowDidChangeCurrentIndex?(newIndex: number): void;
}

export declare class IKSlideshowDataSource extends NativeObject implements IKSlideshowDataSource {
}

export declare interface IKFilterCustomUIProvider {
  provideViewForUIConfigurationExcludedKeys(inUIConfiguration: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, inKeys: NSArray<interop.Object> | Array<interop.Object>): IKFilterUIView;
}

export declare class IKFilterCustomUIProvider extends NativeObject implements IKFilterCustomUIProvider {
}

export declare interface QCPlugInOutputImageProvider {
  imageBounds(): CGRect;

  imageColorSpace(): interop.Object;

  shouldColorMatch?(): boolean;

  supportedBufferPixelFormats?(): NSArray;

  renderToBufferWithBytesPerRowPixelFormatForBounds?(baseAddress: interop.PointerConvertible, rowBytes: number, format: string, bounds: CGRect): boolean;

  supportedRenderedTexturePixelFormats?(): NSArray;

  copyRenderedTextureForCGLContextPixelFormatBoundsIsFlipped?(cgl_ctx: interop.PointerConvertible, format: string, bounds: CGRect, flipped: interop.PointerConvertible): number;

  releaseRenderedTextureForCGLContext?(name: number, cgl_ctx: interop.PointerConvertible): void;

  canRenderWithCGLContext?(cgl_ctx: interop.PointerConvertible): boolean;

  renderWithCGLContextForBounds?(cgl_ctx: interop.PointerConvertible, bounds: CGRect): boolean;
}

export declare class QCPlugInOutputImageProvider extends NativeObject implements QCPlugInOutputImageProvider {
}

export declare interface QCPlugInInputImageSource {
  imageBounds(): CGRect;

  imageColorSpace(): interop.Object;

  shouldColorMatch(): boolean;

  lockBufferRepresentationWithPixelFormatColorSpaceForBounds(format: string, colorSpace: interop.Object, bounds: CGRect): boolean;

  bufferPixelsWide(): number;

  bufferPixelsHigh(): number;

  bufferPixelFormat(): string;

  bufferColorSpace(): interop.Object;

  bufferBaseAddress(): interop.Pointer;

  bufferBytesPerRow(): number;

  unlockBufferRepresentation(): void;

  lockTextureRepresentationWithColorSpaceForBounds(colorSpace: interop.Object, bounds: CGRect): boolean;

  texturePixelsWide(): number;

  texturePixelsHigh(): number;

  textureTarget(): number;

  textureName(): number;

  textureColorSpace(): interop.Object;

  textureFlipped(): boolean;

  textureMatrix(): interop.Pointer;

  bindTextureRepresentationToCGLContextTextureUnitNormalizeCoordinates(cgl_ctx: interop.PointerConvertible, unit: number, flag: boolean): void;

  unbindTextureRepresentationFromCGLContextTextureUnit(cgl_ctx: interop.PointerConvertible, unit: number): void;

  unlockTextureRepresentation(): void;
}

export declare class QCPlugInInputImageSource extends NativeObject implements QCPlugInInputImageSource {
}

export declare interface QCCompositionRenderer {
  attributes(): NSDictionary;

  inputKeys(): NSArray;

  outputKeys(): NSArray;

  setValueForInputKey(value: interop.Object, key: string): boolean;

  valueForInputKey(key: string): interop.Object;

  valueForOutputKey(key: string): interop.Object;

  valueForOutputKeyOfType(key: string, type: string): interop.Object;

  propertyListFromInputValues(): interop.Object;

  setInputValuesWithPropertyList(plist: interop.Object): void;

  userInfo(): NSMutableDictionary;
}

export declare class QCCompositionRenderer extends NativeObject implements QCCompositionRenderer {
}

export declare interface QCPlugInContext {
  compositionURL(): NSURL;

  logMessage(format: string): void;

  userInfo(): NSMutableDictionary;

  colorSpace(): interop.Object;

  bounds(): CGRect;

  CGLContextObj(): interop.Pointer;

  outputImageProviderFromBufferWithPixelFormatPixelsWidePixelsHighBaseAddressBytesPerRowReleaseCallbackReleaseContextColorSpaceShouldColorMatch(format: string, width: number, height: number, baseAddress: interop.PointerConvertible, rowBytes: number, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, context: interop.PointerConvertible, colorSpace: interop.Object, colorMatch: boolean): interop.Object;

  outputImageProviderFromTextureWithPixelFormatPixelsWidePixelsHighNameFlippedReleaseCallbackReleaseContextColorSpaceShouldColorMatch(format: string, width: number, height: number, name: number, flipped: boolean, callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void, context: interop.PointerConvertible, colorSpace: interop.Object, colorMatch: boolean): interop.Object;
}

export declare class QCPlugInContext extends NativeObject implements QCPlugInContext {
}

export declare class IKSaveOptions extends NSObject {
  delegate: interop.Object;

  readonly imageProperties: NSDictionary;

  readonly imageUTType: string;

  readonly userSelection: NSDictionary;

  initWithImagePropertiesImageUTType(imageProperties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, imageUTType: string): this;

  addSaveOptionsAccessoryViewToSavePanel(savePanel: NSSavePanel): void;

  addSaveOptionsToView(view: NSView): void;

  rememberLastSetting: boolean;
}

export declare class IKFilterBrowserView extends NSView {
  setPreviewState(inState: boolean): void;

  filterName(): string;
}

export declare class IKFilterUIView extends NSView {
  static viewWithFrameFilter(frameRect: CGRect, inFilter: CIFilter): interop.Object;

  initWithFrameFilter(frameRect: CGRect, inFilter: CIFilter): this;

  filter(): CIFilter;

  objectController(): NSObjectController;
}

export declare class IKImageBrowserCell extends NSObject {
  imageBrowserView(): IKImageBrowserView;

  representedItem(): interop.Object;

  indexOfRepresentedItem(): number;

  frame(): CGRect;

  imageContainerFrame(): CGRect;

  imageFrame(): CGRect;

  selectionFrame(): CGRect;

  titleFrame(): CGRect;

  subtitleFrame(): CGRect;

  imageAlignment(): interop.Enum<typeof NSImageAlignment>;

  isSelected(): boolean;

  cellState(): interop.Enum<typeof IKImageBrowserCellState>;

  opacity(): number;

  layerForType(type: string): CALayer;
}

export declare class QuartzFilterManager extends NSObject {
  static filterManager(): QuartzFilterManager;

  static filtersInDomains(domains: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  filterPanel(): NSPanel;

  filterView(): QuartzFilterView;

  selectedFilter(): QuartzFilter;

  selectFilter(filter: QuartzFilter): boolean;

  setDelegate(aDelegate: interop.Object): void;

  delegate(): interop.Object;

  importFilter(filterProperties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): QuartzFilter;
}

export declare class QuartzFilter extends NSObject {
  static quartzFilterWithURL(aURL: NSURL): QuartzFilter;

  static quartzFilterWithProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): QuartzFilter;

  static quartzFilterWithOutputIntents(outputIntents: NSArray<interop.Object> | Array<interop.Object>): QuartzFilter;

  properties(): NSDictionary;

  url(): NSURL;

  localizedName(): string;

  applyToContext(aContext: interop.Object): boolean;

  removeFromContext(aContext: interop.Object): void;
}

export declare class QCPlugInViewController extends NSViewController {
  initWithPlugInViewNibName(plugIn: QCPlugIn, name: string): this;

  plugIn(): QCPlugIn;
}

export declare class QCRenderer extends NSObject implements QCCompositionRenderer {
  initWithCompositionColorSpace(composition: QCComposition, colorSpace: interop.Object): this;

  initWithCGLContextPixelFormatColorSpaceComposition(context: interop.PointerConvertible, format: interop.PointerConvertible, colorSpace: interop.Object, composition: QCComposition): this;

  initOffScreenWithSizeColorSpaceComposition(size: CGSize, colorSpace: interop.Object, composition: QCComposition): this;

  initWithOpenGLContextPixelFormatFile(context: NSOpenGLContext, format: NSOpenGLPixelFormat, path: string): this;

  renderAtTimeArguments(time: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  renderingTimeForTimeArguments(time: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  composition(): QCComposition;

  snapshotImage(): NSImage;

  createSnapshotImageOfType(type: string): interop.Object;

  attributes(): NSDictionary;

  inputKeys(): NSArray;

  outputKeys(): NSArray;

  setValueForInputKey(value: interop.Object, key: string): boolean;

  valueForInputKey(key: string): interop.Object;

  valueForOutputKey(key: string): interop.Object;

  valueForOutputKeyOfType(key: string, type: string): interop.Object;

  propertyListFromInputValues(): interop.Object;

  setInputValuesWithPropertyList(plist: interop.Object): void;

  userInfo(): NSMutableDictionary;
}

export declare class QCComposition extends NSObject implements NSCopying {
  static compositionWithFile(path: string): QCComposition;

  static compositionWithData(data: NSData): QCComposition;

  protocols(): NSArray;

  attributes(): NSDictionary;

  inputKeys(): NSArray;

  outputKeys(): NSArray;

  identifier(): string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class QCPlugIn extends NSObject {
  static attributes(): NSDictionary;

  static attributesForPropertyPortWithKey(key: string): NSDictionary;

  static sortedPropertyPortKeys(): NSArray;

  static executionMode(): interop.Enum<typeof QCPlugInExecutionMode>;

  static timeMode(): interop.Enum<typeof QCPlugInTimeMode>;

  static plugInKeys(): NSArray;

  startExecution(context: QCPlugInContext): boolean;

  enableExecution(context: QCPlugInContext): void;

  executionTimeForContextAtTimeWithArguments(context: QCPlugInContext, time: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  executeAtTimeWithArguments(context: QCPlugInContext, time: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  disableExecution(context: QCPlugInContext): void;

  stopExecution(context: QCPlugInContext): void;

  serializedValueForKey(key: string): interop.Object;

  setSerializedValueForKey(serializedValue: interop.Object, key: string): void;

  didValueForInputKeyChange(key: string): boolean;

  valueForInputKey(key: string): interop.Object;

  setValueForOutputKey(value: interop.Object, key: string): boolean;

  addInputPortWithTypeForKeyWithAttributes(type: string, key: string, attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  removeInputPortForKey(key: string): void;

  addOutputPortWithTypeForKeyWithAttributes(type: string, key: string, attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  removeOutputPortForKey(key: string): void;

  static loadPlugInAtPath(path: string): boolean;

  static registerPlugInClass(aClass: interop.PointerConvertible): void;

  createViewController(): QCPlugInViewController;
}

export declare class QuartzFilterView extends NSView {
  sizeToFit(): void;
}

export declare class IKSlideshow extends NSObject {
  autoPlayDelay: number;

  static sharedSlideshow(): IKSlideshow;

  runSlideshowWithDataSourceInModeOptions(dataSource: IKSlideshowDataSource, slideshowMode: string, slideshowOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  stopSlideshow(sender: interop.Object): void;

  reloadData(): void;

  reloadSlideshowItemAtIndex(index: number): void;

  indexOfCurrentSlideshowItem(): number;

  static canExportToApplication(applicationBundleIdentifier: string): boolean;

  static exportSlideshowItemToApplication(item: interop.Object, applicationBundleIdentifier: string): void;
}

export declare class QCPatchController extends NSController {
}

export declare class IKPictureTaker extends NSPanel {
  static pictureTaker(): IKPictureTaker;

  runModal(): number;

  beginPictureTakerWithDelegateDidEndSelectorContextInfo(delegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  beginPictureTakerSheetForWindowWithDelegateDidEndSelectorContextInfo(aWindow: NSWindow, delegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  popUpRecentsMenuForViewWithDelegateDidEndSelectorContextInfo(aView: NSView, delegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  setInputImage(image: NSImage): void;

  inputImage(): NSImage;

  outputImage(): NSImage;

  setMirroring(b: boolean): void;

  mirroring(): boolean;
}

export declare class IKScannerDeviceView extends NSView {
  delegate: IKScannerDeviceViewDelegate;

  scannerDevice: ICScannerDevice;

  mode: interop.Enum<typeof IKScannerDeviceViewDisplayMode>;

  hasDisplayModeSimple: boolean;

  hasDisplayModeAdvanced: boolean;

  transferMode: interop.Enum<typeof IKScannerDeviceViewTransferMode>;

  scanControlLabel: string;

  overviewControlLabel: string;

  displaysDownloadsDirectoryControl: boolean;

  downloadsDirectory: NSURL;

  documentName: string;

  displaysPostProcessApplicationControl: boolean;

  postProcessApplication: NSURL;
}

export declare class QCCompositionParameterView extends NSView {
  setCompositionRenderer(renderer: QCCompositionRenderer): void;

  compositionRenderer(): QCCompositionRenderer;

  hasParameters(): boolean;

  setBackgroundColor(color: NSColor): void;

  backgroundColor(): NSColor;

  setDrawsBackground(flag: boolean): void;

  drawsBackground(): boolean;

  setDelegate(delegate: interop.Object): void;

  delegate(): interop.Object;
}

export declare class QCCompositionRepository extends NSObject {
  static sharedCompositionRepository(): QCCompositionRepository;

  compositionWithIdentifier(identifier: string): QCComposition;

  compositionsWithProtocolsAndAttributes(protocols: NSArray<interop.Object> | Array<interop.Object>, attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSArray;

  allCompositions(): NSArray;
}

export declare class IKCameraDeviceView extends NSView {
  delegate: IKCameraDeviceViewDelegate;

  cameraDevice: ICCameraDevice;

  mode: interop.Enum<typeof IKCameraDeviceViewDisplayMode>;

  hasDisplayModeTable: boolean;

  hasDisplayModeIcon: boolean;

  downloadAllControlLabel: string;

  downloadSelectedControlLabel: string;

  iconSize: number;

  transferMode: interop.Enum<typeof IKCameraDeviceViewTransferMode>;

  displaysDownloadsDirectoryControl: boolean;

  downloadsDirectory: NSURL;

  displaysPostProcessApplicationControl: boolean;

  postProcessApplication: NSURL;

  readonly canRotateSelectedItemsLeft: boolean;

  readonly canRotateSelectedItemsRight: boolean;

  readonly canDeleteSelectedItems: boolean;

  readonly canDownloadSelectedItems: boolean;

  selectedIndexes(): NSIndexSet;

  selectIndexesByExtendingSelection(indexes: NSIndexSet, extend: boolean): void;

  rotateLeft(sender: interop.Object): void;

  rotateRight(sender: interop.Object): void;

  deleteSelectedItems(sender: interop.Object): void;

  downloadSelectedItems(sender: interop.Object): void;

  downloadAllItems(sender: interop.Object): void;

  setCustomIconSizeSlider(slider: NSSlider): void;

  setCustomModeControl(control: NSSegmentedControl): void;

  setCustomActionControl(control: NSSegmentedControl): void;

  setCustomRotateControl(control: NSSegmentedControl): void;

  setCustomDeleteControl(control: NSSegmentedControl): void;

  setShowStatusInfoAsWindowSubtitle(value: boolean): void;
}

export declare class IKImageEditPanel extends NSPanel {
  dataSource: IKImageEditPanelDataSource;

  readonly filterArray: NSArray;

  static sharedImageEditPanel(): IKImageEditPanel;

  reloadData(): void;
}

export declare class IKFilterBrowserPanel extends NSPanel {
  static filterBrowserPanelWithStyleMask(styleMask: number): interop.Object;

  filterName(): string;

  beginWithOptionsModelessDelegateDidEndSelectorContextInfo(inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, modelessDelegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  beginSheetWithOptionsModalForWindowModalDelegateDidEndSelectorContextInfo(inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, docWindow: NSWindow, modalDelegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  runModalWithOptions(inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  filterBrowserViewWithOptions(inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): IKFilterBrowserView;

  finish(sender: interop.Object): void;
}

export declare class QCCompositionPickerView extends NSView {
  setCompositionsFromRepositoryWithProtocolAndAttributes(protocol: string, attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  compositions(): NSArray;

  setDelegate(delegate: interop.Object): void;

  delegate(): interop.Object;

  setShowsCompositionNames(flag: boolean): void;

  showsCompositionNames(): boolean;

  setAllowsEmptySelection(flag: boolean): void;

  allowsEmptySelection(): boolean;

  setCompositionAspectRatio(ratio: CGSize): void;

  compositionAspectRatio(): CGSize;

  setDefaultValueForInputKey(value: interop.Object, key: string): void;

  resetDefaultInputValues(): void;

  setSelectedComposition(composition: QCComposition): void;

  selectedComposition(): QCComposition;

  startAnimation(sender: interop.Object): void;

  stopAnimation(sender: interop.Object): void;

  isAnimating(): boolean;

  setMaxAnimationFrameRate(maxFPS: number): void;

  maxAnimationFrameRate(): number;

  setBackgroundColor(color: NSColor): void;

  backgroundColor(): NSColor;

  setDrawsBackground(flag: boolean): void;

  drawsBackground(): boolean;

  numberOfColumns(): number;

  setNumberOfColumns(columns: number): void;

  numberOfRows(): number;

  setNumberOfRows(rows: number): void;
}

export declare class QCCompositionLayer extends CAOpenGLLayer implements QCCompositionRenderer {
  static compositionLayerWithFile(path: string): QCCompositionLayer;

  static compositionLayerWithComposition(composition: QCComposition): QCCompositionLayer;

  initWithFile(path: string): this;

  initWithComposition(composition: QCComposition): this;

  composition(): QCComposition;

  attributes(): NSDictionary;

  inputKeys(): NSArray;

  outputKeys(): NSArray;

  setValueForInputKey(value: interop.Object, key: string): boolean;

  valueForInputKey(key: string): interop.Object;

  valueForOutputKey(key: string): interop.Object;

  valueForOutputKeyOfType(key: string, type: string): interop.Object;

  propertyListFromInputValues(): interop.Object;

  setInputValuesWithPropertyList(plist: interop.Object): void;

  userInfo(): NSMutableDictionary;
}

export declare class QCView extends NSView implements QCCompositionRenderer {
  loadCompositionFromFile(path: string): boolean;

  loadComposition(composition: QCComposition): boolean;

  loadedComposition(): QCComposition;

  unloadComposition(): void;

  setAutostartsRendering(flag: boolean): void;

  autostartsRendering(): boolean;

  setEraseColor(color: NSColor): void;

  eraseColor(): NSColor;

  setEventForwardingMask(mask: number): void;

  eventForwardingMask(): number;

  setMaxRenderingFrameRate(maxFPS: number): void;

  maxRenderingFrameRate(): number;

  erase(): void;

  startRendering(): boolean;

  renderAtTimeArguments(time: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  pauseRendering(): void;

  isPausedRendering(): boolean;

  resumeRendering(): void;

  stopRendering(): void;

  isRendering(): boolean;

  snapshotImage(): NSImage;

  createSnapshotImageOfType(type: string): interop.Object;

  openGLContext(): NSOpenGLContext;

  openGLPixelFormat(): NSOpenGLPixelFormat;

  start(sender: interop.Object): void;

  stop(sender: interop.Object): void;

  play(sender: interop.Object): void;

  attributes(): NSDictionary;

  inputKeys(): NSArray;

  outputKeys(): NSArray;

  setValueForInputKey(value: interop.Object, key: string): boolean;

  valueForInputKey(key: string): interop.Object;

  valueForOutputKey(key: string): interop.Object;

  valueForOutputKeyOfType(key: string, type: string): interop.Object;

  propertyListFromInputValues(): interop.Object;

  setInputValuesWithPropertyList(plist: interop.Object): void;

  userInfo(): NSMutableDictionary;
}

export declare class IKImageBrowserView extends NSView implements NSDraggingSource {
  initWithFrame(frameRect: CGRect): this;
  initWithFrame(frame: CGRect): this;

  dataSource: interop.Object;

  reloadData(): void;

  delegate: interop.Object;

  setCellsStyleMask(mask: number): void;

  cellsStyleMask(): number;

  setConstrainsToOriginalSize(flag: boolean): void;

  constrainsToOriginalSize(): boolean;

  setBackgroundLayer(aLayer: CALayer): void;

  backgroundLayer(): CALayer;

  setForegroundLayer(aLayer: CALayer): void;

  foregroundLayer(): CALayer;

  newCellForRepresentedItem(anItem: interop.Object): IKImageBrowserCell;

  cellForItemAtIndex(index: number): IKImageBrowserCell;

  setZoomValue(aValue: number): void;

  zoomValue(): number;

  setContentResizingMask(mask: number): void;

  contentResizingMask(): number;

  scrollIndexToVisible(index: number): void;

  setCellSize(size: CGSize): void;

  cellSize(): CGSize;

  intercellSpacing(): CGSize;

  setIntercellSpacing(aSize: CGSize): void;

  indexOfItemAtPoint(point: CGPoint): number;

  itemFrameAtIndex(index: number): CGRect;

  visibleItemIndexes(): NSIndexSet;

  rowIndexesInRect(rect: CGRect): NSIndexSet;

  columnIndexesInRect(rect: CGRect): NSIndexSet;

  rectOfColumn(columnIndex: number): CGRect;

  rectOfRow(rowIndex: number): CGRect;

  numberOfRows(): number;

  numberOfColumns(): number;

  setCanControlQuickLookPanel(flag: boolean): void;

  canControlQuickLookPanel(): boolean;

  selectionIndexes(): NSIndexSet;

  setSelectionIndexesByExtendingSelection(indexes: NSIndexSet, extendSelection: boolean): void;

  setAllowsMultipleSelection(flag: boolean): void;

  allowsMultipleSelection(): boolean;

  setAllowsEmptySelection(flag: boolean): void;

  allowsEmptySelection(): boolean;

  setAllowsReordering(flag: boolean): void;

  allowsReordering(): boolean;

  setAnimates(flag: boolean): void;

  animates(): boolean;

  expandGroupAtIndex(index: number): void;

  collapseGroupAtIndex(index: number): void;

  isGroupExpandedAtIndex(index: number): boolean;

  setDraggingDestinationDelegate(delegate: interop.Object): void;

  draggingDestinationDelegate(): interop.Object;

  indexAtLocationOfDroppedItem(): number;

  dropOperation(): interop.Enum<typeof IKImageBrowserDropOperation>;

  setAllowsDroppingOnItems(flag: boolean): void;

  allowsDroppingOnItems(): boolean;

  setDropIndexDropOperation(index: number, operation: interop.Enum<typeof IKImageBrowserDropOperation>): void;

  draggingSessionSourceOperationMaskForDraggingContext(session: NSDraggingSession, context: interop.Enum<typeof NSDraggingContext>): interop.Enum<typeof NSDragOperation>;

  draggingSessionWillBeginAtPoint(session: NSDraggingSession, screenPoint: CGPoint): void;

  draggingSessionMovedToPoint(session: NSDraggingSession, screenPoint: CGPoint): void;

  draggingSessionEndedAtPointOperation(session: NSDraggingSession, screenPoint: CGPoint, operation: interop.Enum<typeof NSDragOperation>): void;

  ignoreModifierKeysForDraggingSession(session: NSDraggingSession): boolean;

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

export declare class IKImageView extends NSView {
  delegate: interop.Object;

  zoomFactor: number;

  rotationAngle: number;

  currentToolMode: string;

  autoresizes: boolean;

  hasHorizontalScroller: boolean;

  hasVerticalScroller: boolean;

  autohidesScrollers: boolean;

  supportsDragAndDrop: boolean;

  editable: boolean;

  doubleClickOpensImageEditPanel: boolean;

  imageCorrection: CIFilter;

  backgroundColor: NSColor;

  setImageImageProperties(image: interop.Object, metaData: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  setImageWithURL(url: NSURL): void;

  image(): interop.Object;

  imageSize(): CGSize;

  imageProperties(): NSDictionary;

  setRotationAngleCenterPoint(rotationAngle: number, centerPoint: CGPoint): void;

  rotateImageLeft(sender: interop.Object): void;

  rotateImageRight(sender: interop.Object): void;

  setImageZoomFactorCenterPoint(zoomFactor: number, centerPoint: CGPoint): void;

  zoomImageToRect(rect: CGRect): void;

  zoomImageToFit(sender: interop.Object): void;

  zoomImageToActualSize(sender: interop.Object): void;

  zoomIn(sender: interop.Object): void;

  zoomOut(sender: interop.Object): void;

  flipImageHorizontal(sender: interop.Object): void;

  flipImageVertical(sender: interop.Object): void;

  crop(sender: interop.Object): void;

  setOverlayForType(layer: CALayer, layerType: string): void;

  overlayForType(layerType: string): CALayer;

  scrollToPoint(point: CGPoint): void;

  scrollToRect(rect: CGRect): void;

  convertViewPointToImagePoint(viewPoint: CGPoint): CGPoint;

  convertViewRectToImageRect(viewRect: CGRect): CGRect;

  convertImagePointToViewPoint(imagePoint: CGPoint): CGPoint;

  convertImageRectToViewRect(imageRect: CGRect): CGRect;
}

export declare class QCCompositionPickerPanel extends NSPanel {
  static sharedCompositionPickerPanel(): QCCompositionPickerPanel;

  compositionPickerView(): QCCompositionPickerView;
}

export declare class IKDeviceBrowserView extends NSView {
  delegate: IKDeviceBrowserViewDelegate;

  displaysLocalCameras: boolean;

  displaysNetworkCameras: boolean;

  displaysLocalScanners: boolean;

  displaysNetworkScanners: boolean;

  mode: interop.Enum<typeof IKDeviceBrowserViewDisplayMode>;

  readonly selectedDevice: ICDevice;
}
