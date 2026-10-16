import type { interop } from './objc-runtime'

export declare const kLSMTextPreserveAcronyms: number

export declare const kLSMTextPreserveCase: number

export declare const kLSMMapLoadMutable: number

export declare const kLSMMapDiscardCounts: number

export declare const kLSMClusterTokens: number

export declare const kLSMMapTriplets: number

export declare const kLSMMapOverflow: number

export declare const kLSMMapBadCluster: number

export declare const kLSMMapOutOfState: number

export declare const kLSMClusterAgglomerative: number

export declare const kLSMTextApplySpamHeuristics: number

export declare const kLSMResultBestWords: number

export declare const kLSMClusterWords: number

export declare const kLSMMapBadPath: number

export declare const kLSMMapPairs: number

export declare const kLSMMapWriteError: number

export declare const kLSMMapNoSuchCategory: number

export declare const kLSMMapHashText: number

export declare const kLSMClusterCategories: number

export declare const kLSMClusterKMeans: number

export declare class __LSMResult {
	constructor(init?: __LSMResult)
}

export declare class __LSMMap {
	constructor(init?: __LSMMap)
}

export declare class __LSMText {
	constructor(init?: __LSMText)
}

export declare function LSMMapGetTypeID(): number

export declare function LSMTextGetTypeID(): number

export declare function LSMResultGetTypeID(): number

export declare function LSMMapCreate(alloc: interop.Object, flags: number): interop.Object

export declare function LSMMapSetProperties(
	mapref: interop.Object,
	properties: interop.Object,
): void

export declare function LSMMapGetProperties(mapref: interop.Object): interop.Object

export declare function LSMMapStartTraining(mapref: interop.Object): number

export declare function LSMMapAddCategory(mapref: interop.Object): number

export declare function LSMMapGetCategoryCount(mapref: interop.Object): number

export declare function LSMMapSetStopWords(mapref: interop.Object, textref: interop.Object): number

export declare function LSMMapAddText(
	mapref: interop.Object,
	textref: interop.Object,
	category: number,
): number

export declare function LSMMapAddTextWithWeight(
	mapref: interop.Object,
	textref: interop.Object,
	category: number,
	weight: number,
): number

export declare function LSMMapCompile(mapref: interop.Object): number

export declare function LSMMapCreateClusters(
	alloc: interop.Object,
	mapref: interop.Object,
	subset: interop.Object,
	numClusters: number,
	flags: number,
): interop.Object

export declare function LSMMapApplyClusters(
	mapref: interop.Object,
	clusters: interop.Object,
): number

export declare function LSMResultCreate(
	alloc: interop.Object,
	mapref: interop.Object,
	textref: interop.Object,
	numResults: number,
	flags: number,
): interop.Object

export declare function LSMResultGetCount(result: interop.Object): number

export declare function LSMResultGetCategory(result: interop.Object, n: number): number

export declare function LSMResultGetScore(result: interop.Object, n: number): number

export declare function LSMResultCopyWord(result: interop.Object, n: number): interop.Object

export declare function LSMResultCopyToken(result: interop.Object, n: number): interop.Object

export declare function LSMResultCopyWordCluster(result: interop.Object, n: number): interop.Object

export declare function LSMResultCopyTokenCluster(result: interop.Object, n: number): interop.Object

export declare function LSMMapWriteToURL(
	mapref: interop.Object,
	file: interop.Object,
	flags: number,
): number

export declare function LSMMapCreateFromURL(
	alloc: interop.Object,
	file: interop.Object,
	flags: number,
): interop.Object

export declare function LSMMapWriteToStream(
	mapref: interop.Object,
	textref: interop.Object,
	stream: interop.Object,
	options: number,
): number

export declare function LSMTextCreate(alloc: interop.Object, mapref: interop.Object): interop.Object

export declare function LSMTextAddWord(textref: interop.Object, word: interop.Object): number

export declare function LSMTextAddWords(
	textref: interop.Object,
	words: interop.Object,
	locale: interop.Object,
	flags: number,
): number

export declare function LSMTextAddToken(textref: interop.Object, token: interop.Object): number
