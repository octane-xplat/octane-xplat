import type {
	NSAppleEventDescriptor,
	NSArray,
	NSAttributedString,
	NSCopying,
	NSData,
	NSURL,
} from './Foundation'

import type { interop } from './objc-runtime'

import { NSController, NSTextView } from './AppKit'

import { NSObject } from './Runtime'

export declare const OSAStorageTextType: string

export declare const OSAStorageApplicationBundleType: string

export declare const OSAStorageScriptBundleType: string

export declare const OSAStorageScriptType: string

export declare const OSAScriptErrorBriefMessage: string

export declare const OSAScriptErrorMessage: string

export declare const OSAScriptErrorRangeKey: string

export declare const OSAScriptErrorAppAddressKey: string

export declare const OSAScriptErrorExpectedTypeKey: string

export declare const OSAScriptErrorBriefMessageKey: string

export declare const OSAScriptErrorMessageKey: string

export declare const OSAScriptErrorAppNameKey: string

export declare const OSAScriptErrorOffendingObjectKey: string

export declare const OSAScriptErrorNumberKey: string

export declare const OSAScriptErrorRange: string

export declare const OSAScriptErrorPartialResultKey: string

export declare const OSAStorageApplicationType: string

export declare const OSAScriptErrorNumber: string

export declare const OSAScriptErrorAppName: string

export declare const OSALanguageFeatures: {
	Compiling: 2
	GetSource: 4
	AECoercion: 8
	AESending: 16
	Recording: 32
	Convenience: 64
	Dialects: 128
	EventHandling: 256
}

export declare const OSAScriptState: {
	Stopped: 0
	Running: 1
	Recording: 2
}

export declare const OSAStorageOptions: {
	Null: 0
	PreventGetSource: 1
	CompileIntoContext: 2
	DontSetScriptLocation: 16777216
	StayOpenApplet: 268435456
	ShowStartupScreen: 536870912
}

export declare class OSAScriptController extends NSController {
	scriptView: OSAScriptView

	resultView: NSTextView

	script: OSAScript

	language: OSALanguage

	readonly scriptState: interop.Enum<typeof OSAScriptState>

	readonly compiling: boolean

	compileScript(sender: interop.Object | null): void

	recordScript(sender: interop.Object | null): void

	runScript(sender: interop.Object | null): void

	stopScript(sender: interop.Object | null): void

	isCompiling(): boolean
}

export declare class OSALanguageInstance extends NSObject {
	static languageInstanceWithLanguage<This extends abstract new (...args: any) => any>(
		this: This,
		language: OSALanguage,
	): InstanceType<This>

	initWithLanguage(language: OSALanguage): this

	readonly language: OSALanguage

	readonly componentInstance: interop.Pointer

	defaultTarget: NSAppleEventDescriptor

	richTextFromDescriptor(descriptor: NSAppleEventDescriptor): NSAttributedString
}

export declare class OSAScriptView extends NSTextView {
	source: string

	usesScriptAssistant: boolean

	usesTabs: boolean

	tabWidth: number

	wrapsLines: boolean

	indentsWrappedLines: boolean

	indentWidth: number
}

export declare class OSALanguage extends NSObject {
	static availableLanguages(): NSArray

	static languageForName(name: string): OSALanguage

	static languageForScriptDataDescriptor(descriptor: NSAppleEventDescriptor): OSALanguage

	static defaultLanguage(): OSALanguage

	static setDefaultLanguage(defaultLanguage: OSALanguage): void

	initWithComponent(component: interop.PointerConvertible): this

	sharedLanguageInstance(): OSALanguageInstance

	readonly componentInstance: interop.Pointer

	readonly name: string

	readonly info: string

	readonly version: string

	readonly type: number

	readonly subType: number

	readonly manufacturer: number

	readonly features: interop.Enum<typeof OSALanguageFeatures>

	readonly threadSafe: boolean

	isThreadSafe(): boolean
}

export declare class OSAScript extends NSObject implements NSCopying {
	static scriptDataDescriptorWithContentsOfURL(url: NSURL): NSAppleEventDescriptor

	initWithSource(source: string): this

	initWithSourceLanguage(source: string, language: OSALanguage | null): this

	initWithSourceFromURLLanguageInstanceUsingStorageOptions(
		source: string,
		url: NSURL | null,
		instance: OSALanguageInstance | null,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
	): this

	initWithContentsOfURLError(url: NSURL, errorInfo: interop.PointerConvertible): this

	initWithContentsOfURLLanguageError(
		url: NSURL,
		language: OSALanguage,
		errorInfo: interop.PointerConvertible,
	): this

	initWithContentsOfURLLanguageInstanceUsingStorageOptionsError(
		url: NSURL,
		instance: OSALanguageInstance | null,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
		errorInfo: interop.PointerConvertible,
	): this

	initWithCompiledDataError(data: NSData, errorInfo: interop.PointerConvertible): this

	initWithCompiledDataFromURLUsingStorageOptionsError(
		data: NSData,
		url: NSURL | null,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
		errorInfo: interop.PointerConvertible,
	): this

	initWithScriptDataDescriptorFromURLLanguageInstanceUsingStorageOptionsError(
		data: NSAppleEventDescriptor,
		url: NSURL | null,
		instance: OSALanguageInstance | null,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
		errorInfo: interop.PointerConvertible,
	): this

	readonly source: string

	readonly url: NSURL

	language: OSALanguage

	languageInstance: OSALanguageInstance

	readonly compiled: boolean

	compileAndReturnError(errorInfo: interop.PointerConvertible): boolean

	executeAndReturnError(errorInfo: interop.PointerConvertible): NSAppleEventDescriptor

	executeAppleEventError(
		event: NSAppleEventDescriptor,
		errorInfo: interop.PointerConvertible,
	): NSAppleEventDescriptor

	executeAndReturnDisplayValueError(
		displayValue: interop.PointerConvertible,
		errorInfo: interop.PointerConvertible,
	): NSAppleEventDescriptor

	executeHandlerWithNameArgumentsError(
		name: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		errorInfo: interop.PointerConvertible,
	): NSAppleEventDescriptor

	readonly richTextSource: NSAttributedString

	richTextFromDescriptor(descriptor: NSAppleEventDescriptor): NSAttributedString

	writeToURLOfTypeError(url: NSURL, type: string, errorInfo: interop.PointerConvertible): boolean

	writeToURLOfTypeUsingStorageOptionsError(
		url: NSURL,
		type: string,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
		errorInfo: interop.PointerConvertible,
	): boolean

	compiledDataForTypeUsingStorageOptionsError(
		type: string,
		storageOptions: interop.Enum<typeof OSAStorageOptions>,
		errorInfo: interop.PointerConvertible,
	): NSData

	isCompiled(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}
