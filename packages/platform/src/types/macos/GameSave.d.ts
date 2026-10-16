import type { NSWindow } from './AppKit'

import type { NSArray, NSDate, NSError, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const GameSaveVersionString: interop.Pointer

export declare const GameSaveVersionNumber: number

export declare const GSSyncState: {
	Ready: 0
	Offline: 1
	Local: 2
	Syncing: 3
	Conflicted: 4
	Error: 5
	Closed: 6
}

export declare class GSSyncedDirectory extends NSObject {
	static openDirectoryForContainerIdentifier(containerIdentifier: string | null): GSSyncedDirectory

	close(): void

	triggerPendingUploadWithCompletionHandler(completion: (p1: boolean) => void): void

	resolveConflictsWithVersion(version: GSSyncedDirectoryVersion): void

	finishSyncingWithCompletionHandler(completion: () => void): void

	finishSyncingCompletionHandler(statusDisplay: NSWindow, completion: () => void): void

	readonly directoryState: GSSyncedDirectoryState
}

export declare class GSSyncedDirectoryVersion extends NSObject {
	readonly isLocal: boolean

	readonly localizedNameOfSavingComputer: string

	readonly modifiedDate: NSDate

	readonly url: NSURL

	readonly description: string
}

export declare class GSSyncedDirectoryState extends NSObject {
	readonly state: interop.Enum<typeof GSSyncState>

	readonly url: NSURL

	readonly conflictedVersions: NSArray

	readonly error: NSError
}
