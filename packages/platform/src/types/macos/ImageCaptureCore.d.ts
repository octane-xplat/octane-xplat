import type { CGRect, CGSize } from './CoreFoundation'

import type {
	NSArray,
	NSData,
	NSDate,
	NSDictionary,
	NSError,
	NSIndexSet,
	NSMutableDictionary,
	NSProgress,
	NSURL,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const ICScannerStatusWarmingUp: string

export declare const ICButtonTypePrint: string

export declare const ICButtonTypeCopy: string

export declare const ICButtonTypeMail: string

export declare const ICButtonTypeScan: string

export declare const ICDeleteErrorDeviceMissing: string

export declare const ICDeleteErrorFileMissing: string

export declare const ICDeleteFailed: string

export declare const ICDeleteCanceled: string

export declare const ICDeleteSuccessful: string

export declare const ICCameraDeviceCanAcceptPTPCommands: string

export declare const ICCameraDeviceCanSyncClock: string

export declare const ICCameraDeviceCanDeleteOneFile: string

export declare const ICCameraDeviceCanTakePicture: string

export declare const ICTruncateAfterSuccessfulDownload: string

export declare const ICDownloadSidecarFiles: string

export declare const ICOverwrite: string

export declare const ICSavedAncillaryFiles: string

export declare const ICSavedFilename: string

export declare const ICSaveAsFilename: string

export declare const ICDownloadsDirectoryURL: string

export declare const ICErrorDomain: string

export declare const ICDeviceLocationDescriptionBluetooth: string

export declare const ICDeviceLocationDescriptionUSB: string

export declare const ICEnumerationChronologicalOrder: string

export declare const ICDeviceCanEjectOrDisconnect: string

export declare const ICStatusCodeKey: string

export declare const ICStatusNotificationKey: string

export declare const ICTransportTypeTCPIP: string

export declare const ICTransportTypeMassStorage: string

export declare const ICTransportTypeBluetooth: string

export declare const ICTransportTypeFireWire: string

export declare const ICTransportTypeUSB: string

export declare const ICDeleteErrorReadOnly: string

export declare const ICRunLoopMode: string

export declare const ICCameraDeviceCanReceiveFile: string

export declare const ICButtonTypeWeb: string

export declare const ICDeviceLocationDescriptionFireWire: string

export declare const ICLocalizedStatusNotificationKey: string

export declare const ICScannerStatusWarmUpDone: string

export declare const ICImageSourceThumbnailMaxPixelSize: string

export declare const ICCameraDeviceCanTakePictureUsingShutterReleaseOnCamera: string

export declare const ICDeleteAfterSuccessfulDownload: string

export declare const ICScannerStatusRequestsOverviewScan: string

export declare const ICImageSourceShouldCache: string

export declare const ICButtonTypeTransfer: string

export declare const ICDeleteErrorCanceled: string

export declare const ICDeviceLocationDescriptionMassStorage: string

export declare const ICCameraDeviceSupportsHEIF: string

export declare const ICCameraDeviceCanDeleteAllFiles: string

export declare const ICScannerPixelDataType: {
	BW: 0
	Gray: 1
	RGB: 2
	Palette: 3
	CMY: 4
	CMYK: 5
	YUV: 6
	YUVK: 7
	CIEXYZ: 8
}

export declare const ICScannerTransferMode: {
	File: 0
	Memory: 1
}

export declare const ICScannerFeatureType: {
	Enumeration: 0
	Range: 1
	Boolean: 2
	Template: 3
}

export declare const ICScannerFunctionalUnitState: {
	Ready: 1
	ScanInProgress: 2
	OverviewScanInProgress: 4
}

export declare const ICScannerBitDepth: {
	Depth1Bit: 1
	Depth8Bits: 8
	Depth16Bits: 16
}

export declare const ICLegacyReturnCode: {
	CommunicationErr: -9900
	DeviceNotFoundErr: -9901
	DeviceNotOpenErr: -9902
	FileCorruptedErr: -9903
	IOPendingErr: -9904
	InvalidObjectErr: -9905
	InvalidPropertyErr: -9906
	IndexOutOfRangeErr: -9907
	PropertyTypeNotFoundErr: -9908
	CannotYieldDevice: -9909
	DataTypeNotFoundErr: -9910
	DeviceMemoryAllocationErr: -9911
	DeviceInternalErr: -9912
	DeviceInvalidParamErr: -9913
	DeviceAlreadyOpenErr: -9914
	DeviceLocationIDNotFoundErr: -9915
	DeviceGUIDNotFoundErr: -9916
	DeviceIOServicePathNotFoundErr: -9917
	DeviceUnsupportedErr: -9918
	FrameworkInternalErr: -9919
	ExtensionInternalErr: -9920
	InvalidSessionErr: -9921
}

export declare const ICReturnPTPDeviceErrorCode: {
	Failed: -21250
	NotAuthorized: -21249
}

export declare const ICReturnCodeOffset: {
	ThumbnailOffset: -21000
	MetadataOffset: -21050
	DownloadOffset: -21100
	DeleteOffset: -21150
	ExFATOffset: -21200
	PTPOffset: -21250
	SystemOffset: -21300
	DeviceOffset: -21350
	DeviceConnection: -21400
	ObjectOffset: -21450
}

export declare const ICScannerFunctionalUnitType: {
	Flatbed: 0
	PositiveTransparency: 1
	NegativeTransparency: 2
	DocumentFeeder: 3
}

export declare const ICDeviceLocationTypeMask: {
	Local: 256
	Shared: 512
	Bonjour: 1024
	Bluetooth: 2048
	Remote: 65024
}

export declare const ICScannerMeasurementUnit: {
	Inches: 0
	Centimeters: 1
	Picas: 2
	Points: 3
	Twips: 4
	Pixels: 5
}

export declare const ICMediaPresentation: {
	Converted: 1
	Original: 2
}

export declare const ICEXIFOrientationType: {
	Orientation1: 1
	Orientation2: 2
	Orientation3: 3
	Orientation4: 4
	Orientation5: 5
	Orientation6: 6
	Orientation7: 7
	Orientation8: 8
}

export declare const ICReturnMetadataErrorCode: {
	NotAvailable: -20150
	AlreadyFetching: -20149
	Canceled: -20148
	Invalid: -20147
}

export declare const ICScannerColorDataFormatType: {
	Chunky: 0
	Planar: 1
}

export declare const ICDeviceType: {
	Camera: 1
	Scanner: 2
}

export declare const ICDeviceTypeMask: {
	Camera: 1
	Scanner: 2
}

export declare const ICReturnThumbnailErrorCode: {
	NotAvailable: -21000
	AlreadyFetching: -20999
	Canceled: -20098
	Invalid: -20097
}

export declare const ICScannerDocumentType: {
	TypeDefault: 0
	TypeA4: 1
	TypeB5: 2
	TypeUSLetter: 3
	TypeUSLegal: 4
	TypeA5: 5
	TypeISOB4: 6
	TypeISOB6: 7
	TypeUSLedger: 9
	TypeUSExecutive: 10
	TypeA3: 11
	TypeISOB3: 12
	TypeA6: 13
	TypeC4: 14
	TypeC5: 15
	TypeC6: 16
	Type4A0: 17
	Type2A0: 18
	TypeA0: 19
	TypeA1: 20
	TypeA2: 21
	TypeA7: 22
	TypeA8: 23
	TypeA9: 24
	Type10: 25
	TypeISOB0: 26
	TypeISOB1: 27
	TypeISOB2: 28
	TypeISOB5: 29
	TypeISOB7: 30
	TypeISOB8: 31
	TypeISOB9: 32
	TypeISOB10: 33
	TypeJISB0: 34
	TypeJISB1: 35
	TypeJISB2: 36
	TypeJISB3: 37
	TypeJISB4: 38
	TypeJISB6: 39
	TypeJISB7: 40
	TypeJISB8: 41
	TypeJISB9: 42
	TypeJISB10: 43
	TypeC0: 44
	TypeC1: 45
	TypeC2: 46
	TypeC3: 47
	TypeC7: 48
	TypeC8: 49
	TypeC9: 50
	TypeC10: 51
	TypeUSStatement: 52
	TypeBusinessCard: 53
	TypeE: 60
	Type3R: 61
	Type4R: 62
	Type5R: 63
	Type6R: 64
	Type8R: 65
	TypeS8R: 66
	Type10R: 67
	TypeS10R: 68
	Type11R: 69
	Type12R: 70
	TypeS12R: 71
	Type110: 72
	TypeAPSH: 73
	TypeAPSC: 74
	TypeAPSP: 75
	Type135: 76
	TypeMF: 77
	TypeLF: 78
}

export declare const ICReturnCode: {
	Success: 0
	InvalidParam: -9922
	CommunicationTimedOut: -9923
	ScanOperationCanceled: -9924
	ScannerInUseByLocalUser: -9925
	ScannerInUseByRemoteUser: -9926
	DeviceFailedToOpenSession: -9927
	DeviceFailedToCloseSession: -9928
	ScannerFailedToSelectFunctionalUnit: -9929
	ScannerFailedToCompleteOverviewScan: -9930
	ScannerFailedToCompleteScan: -9931
	ReceivedUnsolicitedScannerStatusInfo: -9932
	ReceivedUnsolicitedScannerErrorInfo: -9933
	DownloadFailed: -9934
	UploadFailed: -9935
	FailedToCompletePassThroughCommand: -9936
	DownloadCanceled: -9937
	FailedToEnabeTethering: -9938
	FailedToDisabeTethering: -9939
	FailedToCompleteSendMessageRequest: -9940
	DeleteFilesFailed: -9941
	DeleteFilesCanceled: -9942
	DeviceIsPasscodeLocked: -9943
	DeviceFailedToTakePicture: -9944
	DeviceSoftwareNotInstalled: -9945
	DeviceSoftwareIsBeingInstalled: -9946
	DeviceSoftwareInstallationCompleted: -9947
	DeviceSoftwareInstallationCanceled: -9948
	DeviceSoftwareInstallationFailed: -9949
	DeviceSoftwareNotAvailable: -9950
	DeviceCouldNotPair: -9951
	DeviceCouldNotUnpair: -9952
	DeviceNeedsCredentials: -9953
	DeviceIsBusyEnumerating: -9954
	DeviceCommandGeneralFailure: -9955
	DeviceFailedToCompleteTransfer: -9956
	DeviceFailedToSendData: -9957
	SessionNotOpened: -9958
	ExFATVolumeInvalid: 21200
	MultiErrorDictionary: -30000
}

export declare const ICReturnObjectErrorCode: {
	DoesNotExist: -21450
	DataOffsetInvalid: -21449
	CouldNotBeRead: -21448
	DataEmpty: -21447
	DataRequestTooLarge: -21446
}

export declare const ICReturnConnectionErrorCode: {
	DriverExited: -21350
	ClosedSessionSuddenly: -21349
	EjectedSuddenly: -21348
	SessionAlreadyOpen: -21347
	EjectFailed: -21346
	FailedToOpen: -21345
	FailedToOpenDevice: -21344
	NotAuthorizedToOpenDevice: -21343
}

export declare const ICReturnDownloadErrorCode: {
	PathInvalid: -21100
	FileWritable: -21099
}

export declare const ICDeviceLocationType: {
	Local: 256
	Shared: 512
	Bonjour: 1024
	Bluetooth: 2048
}

export declare interface ICScannerDeviceDelegate extends ICDeviceDelegate {
	scannerDeviceDidBecomeAvailable?(scanner: ICScannerDevice): void

	scannerDeviceDidSelectFunctionalUnitError?(
		scanner: ICScannerDevice,
		functionalUnit: ICScannerFunctionalUnit,
		error: NSError | null,
	): void

	scannerDeviceDidScanToURLData?(scanner: ICScannerDevice, url: NSURL, data: NSData): void

	scannerDeviceDidScanToURL?(scanner: ICScannerDevice, url: NSURL): void

	scannerDeviceDidScanToBandData?(scanner: ICScannerDevice, data: ICScannerBandData): void

	scannerDeviceDidCompleteOverviewScanWithError?(
		scanner: ICScannerDevice,
		error: NSError | null,
	): void

	scannerDeviceDidCompleteScanWithError?(scanner: ICScannerDevice, error: NSError | null): void
}

export declare class ICScannerDeviceDelegate
	extends NativeObject
	implements ICScannerDeviceDelegate {}

export declare interface ICDeviceBrowserDelegate extends NSObjectProtocol {
	deviceBrowserDidAddDeviceMoreComing(
		browser: ICDeviceBrowser,
		device: ICDevice,
		moreComing: boolean,
	): void

	deviceBrowserDidRemoveDeviceMoreGoing(
		browser: ICDeviceBrowser,
		device: ICDevice,
		moreGoing: boolean,
	): void

	deviceBrowserDeviceDidChangeName?(browser: ICDeviceBrowser, device: ICDevice): void

	deviceBrowserDeviceDidChangeSharingState?(browser: ICDeviceBrowser, device: ICDevice): void

	deviceBrowserRequestsSelectDevice?(browser: ICDeviceBrowser, device: ICDevice): void

	deviceBrowserDidEnumerateLocalDevices?(browser: ICDeviceBrowser): void
}

export declare class ICDeviceBrowserDelegate
	extends NativeObject
	implements ICDeviceBrowserDelegate {}

export declare interface ICCameraDeviceDownloadDelegate extends NSObjectProtocol {
	didDownloadFileErrorOptionsContextInfo?(
		file: ICCameraFile,
		error: NSError | null,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		contextInfo: interop.PointerConvertible,
	): void

	didReceiveDownloadProgressForFileDownloadedBytesMaxBytes?(
		file: ICCameraFile,
		downloadedBytes: number,
		maxBytes: number,
	): void
}

export declare class ICCameraDeviceDownloadDelegate
	extends NativeObject
	implements ICCameraDeviceDownloadDelegate {}

export declare interface ICDeviceDelegate extends NSObjectProtocol {
	deviceDidCloseSessionWithError(device: ICDevice, error: NSError | null): void

	didRemoveDevice(device: ICDevice): void

	deviceDidOpenSessionWithError(device: ICDevice, error: NSError | null): void

	deviceDidBecomeReady?(device: ICDevice): void

	deviceDidChangeName?(device: ICDevice): void

	deviceDidReceiveStatusInformation?(
		device: ICDevice,
		status: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): void

	deviceDidEncounterError?(device: ICDevice, error: NSError | null): void

	deviceDidEjectWithError?(device: ICDevice, error: NSError | null): void

	deviceDidChangeSharingState?(device: ICDevice): void
}

export declare class ICDeviceDelegate extends NativeObject implements ICDeviceDelegate {}

export declare interface ICCameraDeviceDelegate extends ICDeviceDelegate {
	cameraDeviceDidAddItems(
		camera: ICCameraDevice,
		items: NSArray<interop.Object> | Array<interop.Object>,
	): void

	cameraDeviceDidRemoveItems(
		camera: ICCameraDevice,
		items: NSArray<interop.Object> | Array<interop.Object>,
	): void

	cameraDeviceDidReceiveThumbnailForItemError(
		camera: ICCameraDevice,
		thumbnail: interop.Object | null,
		item: ICCameraItem,
		error: NSError | null,
	): void

	cameraDeviceDidReceiveMetadataForItemError(
		camera: ICCameraDevice,
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		item: ICCameraItem,
		error: NSError | null,
	): void

	cameraDeviceDidRenameItems(
		camera: ICCameraDevice,
		items: NSArray<interop.Object> | Array<interop.Object>,
	): void

	cameraDeviceDidChangeCapability(camera: ICCameraDevice): void

	cameraDeviceDidReceivePTPEvent(camera: ICCameraDevice, eventData: NSData): void

	deviceDidBecomeReadyWithCompleteContentCatalog(device: ICCameraDevice): void

	cameraDeviceDidRemoveAccessRestriction(device: ICDevice): void

	cameraDeviceDidEnableAccessRestriction(device: ICDevice): void

	cameraDeviceShouldGetThumbnailOfItem?(cameraDevice: ICCameraDevice, item: ICCameraItem): boolean

	cameraDeviceShouldGetMetadataOfItem?(cameraDevice: ICCameraDevice, item: ICCameraItem): boolean

	cameraDeviceDidCompleteDeleteFilesWithError?(camera: ICCameraDevice, error: NSError | null): void

	cameraDeviceDidAddItem?(camera: ICCameraDevice, item: ICCameraItem): void

	cameraDeviceDidRemoveItem?(camera: ICCameraDevice, item: ICCameraItem): void

	cameraDeviceDidReceiveThumbnailForItem?(camera: ICCameraDevice, item: ICCameraItem): void

	cameraDeviceDidReceiveMetadataForItem?(camera: ICCameraDevice, item: ICCameraItem): void
}

export declare class ICCameraDeviceDelegate
	extends NativeObject
	implements ICCameraDeviceDelegate {}

export declare class ICScannerBandData extends NSObject {
	readonly fullImageWidth: number

	readonly fullImageHeight: number

	readonly bitsPerPixel: number

	readonly bitsPerComponent: number

	readonly numComponents: number

	readonly bigEndian: boolean

	readonly pixelDataType: interop.Enum<typeof ICScannerPixelDataType>

	readonly colorSyncProfilePath: string

	readonly bytesPerRow: number

	readonly dataStartRow: number

	readonly dataNumRows: number

	readonly dataSize: number

	readonly dataBuffer: NSData

	isBigEndian(): boolean
}

export declare class ICScannerFunctionalUnitNegativeTransparency extends ICScannerFunctionalUnit {
	readonly supportedDocumentTypes: NSIndexSet

	documentType: interop.Enum<typeof ICScannerDocumentType>

	readonly documentSize: CGSize
}

export declare class ICScannerFeatureRange extends ICScannerFeature {
	currentValue: number

	readonly defaultValue: number

	readonly minValue: number

	readonly maxValue: number

	readonly stepSize: number
}

export declare class ICScannerFeature extends NSObject {
	readonly type: interop.Enum<typeof ICScannerFeatureType>

	readonly internalName: string

	readonly humanReadableName: string

	readonly tooltip: string
}

export declare class ICCameraDevice extends ICDevice {
	readonly contentCatalogPercentCompleted: number

	readonly contents: NSArray

	readonly mediaFiles: NSArray

	readonly ejectable: boolean

	readonly locked: boolean

	readonly accessRestrictedAppleDevice: boolean

	readonly iCloudPhotosEnabled: boolean

	readonly mountPoint: string

	mediaPresentation: interop.Enum<typeof ICMediaPresentation>

	filesOfType(fileUTType: string): NSArray

	requestReadDataFromFileAtOffsetLengthReadDelegateDidReadDataSelectorContextInfo(
		file: ICCameraFile,
		offset: number,
		length: number,
		readDelegate: interop.Object,
		selector: string,
		contextInfo: interop.PointerConvertible,
	): void

	requestDownloadFileOptionsDownloadDelegateDidDownloadSelectorContextInfo(
		file: ICCameraFile,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		downloadDelegate: ICCameraDeviceDownloadDelegate,
		selector: string,
		contextInfo: interop.PointerConvertible,
	): void

	cancelDownload(): void

	requestDeleteFiles(files: NSArray<interop.Object> | Array<interop.Object>): void

	requestDeleteFilesDeleteFailedCompletion(
		files: NSArray<interop.Object> | Array<interop.Object>,
		deleteFailed: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		) => void,
		completion: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p2: NSError,
		) => void | null,
	): NSProgress

	cancelDelete(): void

	requestSyncClock(): void

	readonly timeOffset: number

	readonly batteryLevelAvailable: boolean

	readonly batteryLevel: number

	requestUploadFileOptionsUploadDelegateDidUploadSelectorContextInfo(
		fileURL: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		uploadDelegate: interop.Object,
		selector: string,
		contextInfo: interop.PointerConvertible,
	): void

	readonly tetheredCaptureEnabled: boolean

	requestTakePicture(): void

	requestEnableTethering(): void

	requestDisableTethering(): void

	requestSendPTPCommandOutDataSendCommandDelegateDidSendCommandSelectorContextInfo(
		command: NSData,
		data: NSData | null,
		sendCommandDelegate: interop.Object,
		selector: string,
		contextInfo: interop.PointerConvertible,
	): void

	requestSendPTPCommandOutDataCompletion(
		ptpCommand: NSData,
		ptpData: NSData | null,
		completion: (p1: NSData, p2: NSData, p3: NSError) => void | null,
	): void

	isEjectable(): boolean

	isLocked(): boolean

	isAccessRestrictedAppleDevice(): boolean
}

export declare class ICCameraFolder extends ICCameraItem {
	readonly contents: NSArray
}

export declare class ICCameraFile extends ICCameraItem {
	readonly width: number

	readonly height: number

	readonly originalFilename: string

	readonly createdFilename: string

	readonly fileSize: number

	orientation: interop.Enum<typeof ICEXIFOrientationType>

	readonly duration: number

	readonly highFramerate: boolean

	readonly timeLapse: boolean

	readonly firstPicked: boolean

	readonly originatingAssetID: string

	readonly groupUUID: string

	readonly gpsString: string

	readonly relatedUUID: string

	readonly burstUUID: string

	readonly burstFavorite: boolean

	readonly burstPicked: boolean

	readonly sidecarFiles: NSArray

	readonly pairedRawImage: ICCameraFile

	readonly fileCreationDate: NSDate

	readonly fileModificationDate: NSDate

	readonly exifCreationDate: NSDate

	readonly exifModificationDate: NSDate

	readonly fingerprint: string

	static fingerprintForFileAtURL(url: NSURL): string | null

	requestThumbnailDataWithOptionsCompletion(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completion: (p1: NSData, p2: NSError) => void | null,
	): void

	requestMetadataDictionaryWithOptionsCompletion(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completion: (
			p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	requestDownloadWithOptionsCompletion(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completion: (p1: string, p2: NSError) => void | null,
	): NSProgress | null

	requestReadDataAtOffsetLengthCompletion(
		offset: number,
		length: number,
		completion: (p1: NSData, p2: NSError) => void | null,
	): void
}

export declare class ICScannerFeatureTemplate extends ICScannerFeature {
	readonly targets: NSArray
}

export declare class ICScannerFunctionalUnitPositiveTransparency extends ICScannerFunctionalUnit {
	readonly supportedDocumentTypes: NSIndexSet

	documentType: interop.Enum<typeof ICScannerDocumentType>

	readonly documentSize: CGSize
}

export declare class ICScannerFeatureEnumeration extends ICScannerFeature {
	currentValue: interop.Object

	readonly defaultValue: interop.Object

	readonly values: NSArray

	readonly menuItemLabels: NSArray

	readonly menuItemLabelsTooltips: NSArray
}

export declare class ICCameraItem extends NSObject {
	readonly device: ICCameraDevice

	readonly parentFolder: ICCameraFolder

	readonly name: string

	readonly UTI: string

	readonly fileSystemPath: string

	readonly locked: boolean

	readonly raw: boolean

	readonly inTemporaryStore: boolean

	readonly creationDate: NSDate

	readonly modificationDate: NSDate

	readonly thumbnail: interop.Object

	readonly metadata: NSDictionary

	readonly userData: NSMutableDictionary

	readonly ptpObjectHandle: number

	readonly addedAfterContentCatalogCompleted: boolean

	requestThumbnail(): void

	requestMetadata(): void

	flushThumbnailCache(): void

	flushMetadataCache(): void

	readonly thumbnailIfAvailable: interop.Object

	readonly largeThumbnailIfAvailable: interop.Object

	readonly metadataIfAvailable: NSDictionary

	isLocked(): boolean

	isRaw(): boolean

	isInTemporaryStore(): boolean

	wasAddedAfterContentCatalogCompleted(): boolean
}

export declare class ICDeviceBrowser extends NSObject {
	delegate: ICDeviceBrowserDelegate

	readonly browsing: boolean

	browsedDeviceTypeMask: interop.Enum<typeof ICDeviceTypeMask>

	readonly devices: NSArray

	readonly preferredDevice: ICDevice

	init(): this

	start(): void

	stop(): void

	isBrowsing(): boolean
}

export declare class ICScannerFunctionalUnitDocumentFeeder extends ICScannerFunctionalUnit {
	readonly supportedDocumentTypes: NSIndexSet

	documentType: interop.Enum<typeof ICScannerDocumentType>

	readonly documentSize: CGSize

	readonly supportsDuplexScanning: boolean

	duplexScanningEnabled: boolean

	readonly documentLoaded: boolean

	oddPageOrientation: interop.Enum<typeof ICEXIFOrientationType>

	evenPageOrientation: interop.Enum<typeof ICEXIFOrientationType>

	readonly reverseFeederPageOrder: boolean
}

export declare class ICScannerFunctionalUnit extends NSObject {
	readonly type: interop.Enum<typeof ICScannerFunctionalUnitType>

	pixelDataType: interop.Enum<typeof ICScannerPixelDataType>

	readonly supportedBitDepths: NSIndexSet

	bitDepth: interop.Enum<typeof ICScannerBitDepth>

	readonly supportedMeasurementUnits: NSIndexSet

	measurementUnit: interop.Enum<typeof ICScannerMeasurementUnit>

	readonly supportedResolutions: NSIndexSet

	readonly preferredResolutions: NSIndexSet

	resolution: number

	readonly nativeXResolution: number

	readonly nativeYResolution: number

	readonly supportedScaleFactors: NSIndexSet

	readonly preferredScaleFactors: NSIndexSet

	scaleFactor: number

	readonly templates: NSArray

	readonly vendorFeatures: NSArray

	readonly physicalSize: CGSize

	scanArea: CGRect

	scanAreaOrientation: interop.Enum<typeof ICEXIFOrientationType>

	readonly acceptsThresholdForBlackAndWhiteScanning: boolean

	usesThresholdForBlackAndWhiteScanning: boolean

	readonly defaultThresholdForBlackAndWhiteScanning: number

	thresholdForBlackAndWhiteScanning: number

	readonly state: interop.Enum<typeof ICScannerFunctionalUnitState>

	readonly scanInProgress: boolean

	readonly scanProgressPercentDone: number

	readonly canPerformOverviewScan: boolean

	readonly overviewScanInProgress: boolean

	readonly overviewImage: interop.Object

	overviewResolution: number
}

export declare class ICScannerFeatureBoolean extends ICScannerFeature {
	value: boolean
}

export declare class ICScannerFunctionalUnitFlatbed extends ICScannerFunctionalUnit {
	readonly supportedDocumentTypes: NSIndexSet

	documentType: interop.Enum<typeof ICScannerDocumentType>

	readonly documentSize: CGSize
}

export declare class ICScannerDevice extends ICDevice {
	readonly availableFunctionalUnitTypes: NSArray

	readonly selectedFunctionalUnit: ICScannerFunctionalUnit

	transferMode: interop.Enum<typeof ICScannerTransferMode>

	maxMemoryBandSize: number

	downloadsDirectory: NSURL

	documentName: string

	documentUTI: string

	defaultUsername: string

	requestOpenSessionWithCredentialsPassword(username: string, password: string): void

	requestSelectFunctionalUnit(type: interop.Enum<typeof ICScannerFunctionalUnitType>): void

	requestOverviewScan(): void

	requestScan(): void

	cancelScan(): void
}

export declare class ICDevice extends NSObject {
	delegate: ICDeviceDelegate

	readonly type: interop.Enum<typeof ICDeviceType>

	readonly capabilities: NSArray

	readonly name: string

	readonly productKind: string

	readonly icon: interop.Object

	readonly transportType: string

	readonly UUIDString: string

	readonly locationDescription: string

	readonly hasOpenSession: boolean

	readonly userData: NSMutableDictionary

	readonly modulePath: string

	readonly moduleVersion: string

	readonly serialNumberString: string

	readonly usbLocationID: number

	readonly usbProductID: number

	readonly usbVendorID: number

	requestOpenSession(): void

	requestCloseSession(): void

	requestEject(): void

	requestOpenSessionWithOptionsCompletion(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completion: (p1: NSError) => void | null,
	): void

	requestCloseSessionWithOptionsCompletion(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		completion: (p1: NSError) => void | null,
	): void

	requestEjectWithCompletion(completion: (p1: NSError) => void | null): void

	autolaunchApplicationPath: string

	readonly remote: boolean

	readonly persistentIDString: string

	requestSendMessageOutDataMaxReturnedDataSizeSendMessageDelegateDidSendMessageSelectorContextInfo(
		messageCode: number,
		data: NSData,
		maxReturnedDataSize: number,
		sendMessageDelegate: interop.Object,
		selector: string,
		contextInfo: interop.PointerConvertible,
	): void

	requestEjectOrDisconnect(): void

	requestYield(): void

	readonly moduleExecutableArchitecture: number

	isRemote(): boolean
}
