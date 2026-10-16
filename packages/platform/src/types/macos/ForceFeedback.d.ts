import type { CFUUIDBytes } from './CoreFoundation'

import type { NumVersion } from './Runtime'

import type { interop } from './objc-runtime'

export declare const kFFPlugInAPINonRelRev: number

export declare const kFFPlugInAPIStage: number

export declare const kFFPlugInAPIMajorRev: number

export declare const kFFAPINonRelRev: number

export declare const kFFAPIStage: number

export declare const kFFAPIMinorAndBugRev: number

export declare const FFCAP_ET_CUSTOMFORCE: number

export declare const FFCAP_ET_DAMPER: number

export declare const FFCAP_ET_SAWTOOTHDOWN: number

export declare const FFCAP_ET_SQUARE: number

export declare const FFSCL_FOREGROUND: number

export declare const FFPROP_AUTOCENTER: number

export declare const FFPROP_FFGAIN: number

export declare const FFGFFS_DEVICELOST: number

export declare const FFGFFS_SAFETYSWITCHOFF: number

export declare const FFGFFS_POWEROFF: number

export declare const FFGFFS_POWERON: number

export declare const FFGFFS_ACTUATORSOFF: number

export declare const FFGFFS_STOPPED: number

export declare const FFGFFS_EMPTY: number

export declare const FFSFFC_SETACTUATORSOFF: number

export declare const FFSFFC_CONTINUE: number

export declare const FFEGES_EMULATED: number

export declare const FFEGES_PLAYING: number

export declare const FFES_NODOWNLOAD: number

export declare const FFEP_NODOWNLOAD: number

export declare const FFEP_NORESTART: number

export declare const FFEP_START: number

export declare const FFEP_ALLPARAMS: number

export declare const FFEP_DIRECTION: number

export declare const FFEP_AXES: number

export declare const FFEFF_SPHERICAL: number

export declare const FFCAP_ST_KINESTHETIC: number

export declare const kFFAPIMajorRev: number

export declare const FFEP_STARTDELAY: number

export declare const FFSCL_EXCLUSIVE: number

export declare const kFFPlugInAPIMinorAndBugRev: number

export declare const FFCAP_ET_FRICTION: number

export declare const FFEP_DURATION: number

export declare const FFSCL_NONEXCLUSIVE: number

export declare const FFSFFC_RESET: number

export declare const FFGFFS_USERFFSWITCHOFF: number

export declare const FFGFFS_ACTUATORSON: number

export declare const FFEP_TRIGGERBUTTON: number

export declare const FFEFF_CARTESIAN: number

export declare const FFCAP_ET_CONSTANTFORCE: number

export declare const FFEP_GAIN: number

export declare const FFGFFS_SAFETYSWITCHON: number

export declare const FFCAP_ET_RAMPFORCE: number

export declare const FFSFFC_PAUSE: number

export declare const FFES_SOLO: number

export declare const FFEFF_POLAR: number

export declare const FFCAP_ET_INERTIA: number

export declare const FFEB_NOTRIGGER: number

export declare const FFEP_ENVELOPE: number

export declare const FFCAP_ET_SPRING: number

export declare const FFGFFS_USERFFSWITCHON: number

export declare const FFSCL_BACKGROUND: number

export declare const FFCAP_ET_SINE: number

export declare const FFCAP_ET_SAWTOOTHUP: number

export declare const FFCAP_ET_TRIANGLE: number

export declare const FFGFFS_PAUSED: number

export declare const FFSFFC_STOPALL: number

export declare const FFEP_TYPESPECIFICPARAMS: number

export declare const FFEP_SAMPLEPERIOD: number

export declare const FFEGES_NOTPLAYING: number

export declare const FFSFFC_SETACTUATORSON: number

export declare const FFCAP_ST_VIBRATION: number

export declare const FFEP_TRIGGERREPEATINTERVAL: number

export declare class IOForceFeedbackDeviceInterface {
	constructor(init?: IOForceFeedbackDeviceInterface)
	_reserved: interop.Pointer
	QueryInterface: (
		p1: interop.PointerConvertible,
		p2: CFUUIDBytes,
		p3: interop.PointerConvertible,
	) => number | null
	AddRef: (p1: interop.PointerConvertible) => number | null
	Release: (p1: interop.PointerConvertible) => number | null
	ForceFeedbackGetVersion: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	InitializeTerminate: (
		p1: interop.PointerConvertible,
		p2: NumVersion,
		p3: number,
		p4: number,
	) => number | null
	DestroyEffect: (p1: interop.PointerConvertible, p2: number) => number | null
	DownloadEffect: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
	) => number | null
	Escape: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetEffectStatus: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	GetForceFeedbackCapabilities: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	GetForceFeedbackState: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	SendForceFeedbackCommand: (p1: interop.PointerConvertible, p2: number) => number | null
	SetProperty: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	StartEffect: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null
	StopEffect: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class ForceFeedbackVersion {
	constructor(init?: ForceFeedbackVersion)
	apiVersion: NumVersion
	plugInVersion: NumVersion
}

export declare class FFEFFESCAPE {
	constructor(init?: FFEFFESCAPE)
	dwSize: number
	dwCommand: number
	lpvInBuffer: interop.Pointer
	cbInBuffer: number
	lpvOutBuffer: interop.Pointer
	cbOutBuffer: number
}

export declare class FFEFFECT {
	constructor(init?: FFEFFECT)
	dwSize: number
	dwFlags: number
	dwDuration: number
	dwSamplePeriod: number
	dwGain: number
	dwTriggerButton: number
	dwTriggerRepeatInterval: number
	cAxes: number
	rgdwAxes: interop.Pointer
	rglDirection: interop.Pointer
	lpEnvelope: interop.Pointer
	cbTypeSpecificParams: number
	lpvTypeSpecificParams: interop.Pointer
	dwStartDelay: number
}

export declare class FFPERIODIC {
	constructor(init?: FFPERIODIC)
	dwMagnitude: number
	lOffset: number
	dwPhase: number
	dwPeriod: number
}

export declare class FFCONSTANTFORCE {
	constructor(init?: FFCONSTANTFORCE)
	lMagnitude: number
}

export declare class FFCAPABILITIES {
	constructor(init?: FFCAPABILITIES)
	ffSpecVer: NumVersion
	supportedEffects: number
	emulatedEffects: number
	subType: number
	numFfAxes: number
	ffAxes: unknown /* const array */
	storageCapacity: number
	playbackCapacity: number
	firmwareVer: NumVersion
	hardwareVer: NumVersion
	driverVer: NumVersion
}

export declare class __FFEHIDDEN {
	constructor(init?: __FFEHIDDEN)
}

export declare class FFCONDITION {
	constructor(init?: FFCONDITION)
	lOffset: number
	lPositiveCoefficient: number
	lNegativeCoefficient: number
	dwPositiveSaturation: number
	dwNegativeSaturation: number
	lDeadBand: number
}

export declare class FFENVELOPE {
	constructor(init?: FFENVELOPE)
	dwSize: number
	dwAttackLevel: number
	dwAttackTime: number
	dwFadeLevel: number
	dwFadeTime: number
}

export declare class __FFDHIDDEN {
	constructor(init?: __FFDHIDDEN)
}

export declare class ForceFeedbackDeviceState {
	constructor(init?: ForceFeedbackDeviceState)
	dwSize: number
	dwState: number
	dwLoad: number
}

export declare class FFRAMPFORCE {
	constructor(init?: FFRAMPFORCE)
	lStart: number
	lEnd: number
}

export declare class FFCUSTOMFORCE {
	constructor(init?: FFCUSTOMFORCE)
	cChannels: number
	dwSamplePeriod: number
	cSamples: number
	rglForceData: interop.Pointer
}

export declare function FFCreateDevice(
	hidDevice: number,
	pDeviceReference: interop.PointerConvertible,
): number

export declare function FFReleaseDevice(deviceReference: interop.PointerConvertible): number

export declare function FFIsForceFeedback(hidDevice: number): number

export declare function FFDeviceCreateEffect(
	deviceReference: interop.PointerConvertible,
	uuidRef: interop.Object,
	pEffectDefinition: interop.PointerConvertible,
	pEffectReference: interop.PointerConvertible,
): number

export declare function FFDeviceReleaseEffect(
	deviceReference: interop.PointerConvertible,
	effectReference: interop.PointerConvertible,
): number

export declare function FFDeviceEscape(
	deviceReference: interop.PointerConvertible,
	pFFEffectEscape: interop.PointerConvertible,
): number

export declare function FFDeviceGetForceFeedbackState(
	deviceReference: interop.PointerConvertible,
	pFFState: interop.PointerConvertible,
): number

export declare function FFDeviceSendForceFeedbackCommand(
	deviceReference: interop.PointerConvertible,
	flags: number,
): number

export declare function FFDeviceSetForceFeedbackProperty(
	deviceReference: interop.PointerConvertible,
	property: number,
	pValue: interop.PointerConvertible,
): number

export declare function FFDeviceGetForceFeedbackProperty(
	deviceReference: interop.PointerConvertible,
	property: number,
	pValue: interop.PointerConvertible,
	valueSize: number,
): number

export declare function FFDeviceSetCooperativeLevel(
	deviceReference: interop.PointerConvertible,
	taskIdentifier: interop.PointerConvertible,
	flags: number,
): number

export declare function FFDeviceGetForceFeedbackCapabilities(
	deviceReference: interop.PointerConvertible,
	pFFCapabilities: interop.PointerConvertible,
): number

export declare function FFEffectDownload(effectReference: interop.PointerConvertible): number

export declare function FFEffectEscape(
	effectReference: interop.PointerConvertible,
	pFFEffectEscape: interop.PointerConvertible,
): number

export declare function FFEffectGetEffectStatus(
	effectReference: interop.PointerConvertible,
	pFlags: interop.PointerConvertible,
): number

export declare function FFEffectGetParameters(
	effectReference: interop.PointerConvertible,
	pFFEffect: interop.PointerConvertible,
	flags: number,
): number

export declare function FFEffectSetParameters(
	effectReference: interop.PointerConvertible,
	pFFEffect: interop.PointerConvertible,
	flags: number,
): number

export declare function FFEffectStart(
	effectReference: interop.PointerConvertible,
	iterations: number,
	flags: number,
): number

export declare function FFEffectStop(effectReference: interop.PointerConvertible): number

export declare function FFEffectUnload(effectReference: interop.PointerConvertible): number
