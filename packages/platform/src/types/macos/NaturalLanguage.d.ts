import type { MLModel } from './CoreML'

import type { NSArray, NSCoder, NSCopying, NSData, NSDictionary, NSError, NSIndexSet, NSOrthography, NSSecureCoding, NSURL, _NSRange } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const NLTagOrganizationName: string;

export declare const NLTagPlaceName: string;

export declare const NLTagOtherPunctuation: string;

export declare const NLTagDash: string;

export declare const NLTagWordJoiner: string;

export declare const NLTagCloseQuote: string;

export declare const NLTagSentenceTerminator: string;

export declare const NLTagOtherWord: string;

export declare const NLTagIdiom: string;

export declare const NLTagConjunction: string;

export declare const NLTagNumber: string;

export declare const NLTagPreposition: string;

export declare const NLTagPronoun: string;

export declare const NLTagNoun: string;

export declare const NLTagWhitespace: string;

export declare const NLTagPunctuation: string;

export declare const NLTagWord: string;

export declare const NLTagSchemeNameTypeOrLexicalClass: string;

export declare const NLTagSchemeNameType: string;

export declare const NLTagSchemeLexicalClass: string;

export declare const NLContextualEmbeddingKeyRevision: string;

export declare const NLContextualEmbeddingKeyScripts: string;

export declare const NLLanguageVietnamese: string;

export declare const NLLanguageUrdu: string;

export declare const NLLanguageUkrainian: string;

export declare const NLLanguageTraditionalChinese: string;

export declare const NLLanguageTelugu: string;

export declare const NLLanguageSpanish: string;

export declare const NLLanguageSinhalese: string;

export declare const NLLanguageSimplifiedChinese: string;

export declare const NLLanguageRussian: string;

export declare const NLLanguageRomanian: string;

export declare const NLLanguageOriya: string;

export declare const NLLanguageNorwegian: string;

export declare const NLLanguageMarathi: string;

export declare const NLLanguageMalay: string;

export declare const NLLanguageLao: string;

export declare const NLLanguageKorean: string;

export declare const NLLanguageIndonesian: string;

export declare const NLLanguageHungarian: string;

export declare const NLLanguageGujarati: string;

export declare const NLLanguageGreek: string;

export declare const NLLanguageGerman: string;

export declare const NLLanguageFrench: string;

export declare const NLLanguageEnglish: string;

export declare const NLLanguageDutch: string;

export declare const NLLanguageDanish: string;

export declare const NLLanguageCroatian: string;

export declare const NLLanguageCherokee: string;

export declare const NLLanguageBulgarian: string;

export declare const NLLanguageBengali: string;

export declare const NLLanguageArabic: string;

export declare const NLLanguageAmharic: string;

export declare const NLLanguageHindi: string;

export declare const NLTagSchemeScript: string;

export declare const NLLanguageTamil: string;

export declare const NLLanguageCzech: string;

export declare const NLLanguageThai: string;

export declare const NLLanguagePolish: string;

export declare const NLLanguageSwedish: string;

export declare const NLLanguageTurkish: string;

export declare const NLLanguagePersian: string;

export declare const NLLanguageUndetermined: string;

export declare const NLTagVerb: string;

export declare const NLTagParagraphBreak: string;

export declare const NLLanguageHebrew: string;

export declare const NLLanguageTibetan: string;

export declare const NLLanguageBurmese: string;

export declare const NLLanguageGeorgian: string;

export declare const NLTagSchemeSentimentScore: string;

export declare const NLContextualEmbeddingKeyLanguages: string;

export declare const NLTagSchemeTokenType: string;

export declare const NLLanguagePunjabi: string;

export declare const NLTagCloseParenthesis: string;

export declare const NLTagAdverb: string;

export declare const NLTagOpenParenthesis: string;

export declare const NLTagAdjective: string;

export declare const NLLanguageFinnish: string;

export declare const NLTagOtherWhitespace: string;

export declare const NLTagOpenQuote: string;

export declare const NLTagParticle: string;

export declare const NLLanguageMongolian: string;

export declare const NLTagSchemeLanguage: string;

export declare const NLLanguageSlovak: string;

export declare const NLTagPersonalName: string;

export declare const NLTagDeterminer: string;

export declare const NLTagClassifier: string;

export declare const NLLanguageMalayalam: string;

export declare const NLTagSchemeLemma: string;

export declare const NLLanguageArmenian: string;

export declare const NLLanguageCatalan: string;

export declare const NLLanguageKannada: string;

export declare const NLLanguagePortuguese: string;

export declare const NLLanguageKhmer: string;

export declare const NLLanguageIcelandic: string;

export declare const NLLanguageItalian: string;

export declare const NLTagOther: string;

export declare const NLTagInterjection: string;

export declare const NLLanguageJapanese: string;

export declare const NLTaggerAssetsResult: {
  Available: 0,
  NotAvailable: 1,
  Error: 2,
};

export declare const NLTaggerOptions: {
  OmitWords: 1,
  OmitPunctuation: 2,
  OmitWhitespace: 4,
  OmitOther: 8,
  JoinNames: 16,
  JoinContractions: 32,
};

export declare const NLModelType: {
  Classifier: 0,
  Sequence: 1,
};

export declare const NLTokenizerAttributes: {
  Numeric: 1,
  Symbolic: 2,
  Emoji: 4,
};

export declare const NLDistanceType: {
  NLDistanceTypeCosine: 0,
};

export declare const NLTokenUnit: {
  Word: 0,
  Sentence: 1,
  Paragraph: 2,
  Document: 3,
};

export declare const NLContextualEmbeddingAssetsResult: {
  Available: 0,
  NotAvailable: 1,
  Error: 2,
};

export declare class NLTagger extends NSObject {
  initWithTagSchemes(tagSchemes: NSArray<interop.Object> | Array<interop.Object>): this;

  readonly tagSchemes: NSArray;

  string: string;

  static availableTagSchemesForUnitLanguage(unit: interop.Enum<typeof NLTokenUnit>, language: string): NSArray;

  tokenRangeAtIndexUnit(characterIndex: number, unit: interop.Enum<typeof NLTokenUnit>): _NSRange;

  tokenRangeForRangeUnit(range: _NSRange, unit: interop.Enum<typeof NLTokenUnit>): _NSRange;

  readonly dominantLanguage: string;

  enumerateTagsInRangeUnitSchemeOptionsUsingBlock(range: _NSRange, unit: interop.Enum<typeof NLTokenUnit>, scheme: string, options: interop.Enum<typeof NLTaggerOptions>, block: (p1: string, p2: _NSRange, p3: interop.PointerConvertible) => void | null): void;

  tagAtIndexUnitSchemeTokenRange(characterIndex: number, unit: interop.Enum<typeof NLTokenUnit>, scheme: string, tokenRange: interop.PointerConvertible): string;

  tagsInRangeUnitSchemeOptionsTokenRanges(range: _NSRange, unit: interop.Enum<typeof NLTokenUnit>, scheme: string, options: interop.Enum<typeof NLTaggerOptions>, tokenRanges: interop.PointerConvertible): NSArray;

  tagHypothesesAtIndexUnitSchemeMaximumCountTokenRange(characterIndex: number, unit: interop.Enum<typeof NLTokenUnit>, scheme: string, maximumCount: number, tokenRange: interop.PointerConvertible): NSDictionary;

  setLanguageRange(language: string, range: _NSRange): void;

  setOrthographyRange(orthography: NSOrthography, range: _NSRange): void;

  setModelsForTagScheme(models: NSArray<interop.Object> | Array<interop.Object>, tagScheme: string): void;

  modelsForTagScheme(tagScheme: string): NSArray;

  setGazetteersForTagScheme(gazetteers: NSArray<interop.Object> | Array<interop.Object>, tagScheme: string): void;

  gazetteersForTagScheme(tagScheme: string): NSArray;

  static requestAssetsForLanguageTagSchemeCompletionHandler(language: string, tagScheme: string, completionHandler: (p1: interop.Enum<typeof NLTaggerAssetsResult>, p2: NSError) => void | null): void;
}

export declare class NLModel extends NSObject {
  static modelWithContentsOfURLError<This extends abstract new (...args: any) => any>(this: This, url: NSURL, error: interop.PointerConvertible): InstanceType<This>;

  static modelWithMLModelError<This extends abstract new (...args: any) => any>(this: This, mlModel: MLModel, error: interop.PointerConvertible): InstanceType<This>;

  readonly configuration: NLModelConfiguration;

  predictedLabelForString(string: string): string;

  predictedLabelsForTokens(tokens: NSArray<interop.Object> | Array<interop.Object>): NSArray;

  predictedLabelHypothesesForStringMaximumCount(string: string, maximumCount: number): NSDictionary;

  predictedLabelHypothesesForTokensMaximumCount(tokens: NSArray<interop.Object> | Array<interop.Object>, maximumCount: number): NSArray;
}

export declare class NLLanguageRecognizer extends NSObject {
  static dominantLanguageForString(string: string): string;

  init(): this;

  processString(string: string): void;

  reset(): void;

  readonly dominantLanguage: string;

  languageHypothesesWithMaximum(maxHypotheses: number): NSDictionary;

  get languageHints(): NSDictionary;
  set languageHints(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  get languageConstraints(): NSArray;
  set languageConstraints(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class NLGazetteer extends NSObject {
  static gazetteerWithContentsOfURLError<This extends abstract new (...args: any) => any>(this: This, url: NSURL, error: interop.PointerConvertible): InstanceType<This>;

  initWithContentsOfURLError(url: NSURL, error: interop.PointerConvertible): this;

  initWithDataError(data: NSData, error: interop.PointerConvertible): this;

  initWithDictionaryLanguageError(dictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, language: string | null, error: interop.PointerConvertible): this;

  labelForString(string: string): string;

  readonly language: string;

  readonly data: NSData;

  static writeGazetteerForDictionaryLanguageToURLError(dictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, language: string | null, url: NSURL, error: interop.PointerConvertible): boolean;
}

export declare class NLEmbedding extends NSObject {
  static wordEmbeddingForLanguage(language: string): NLEmbedding;

  static wordEmbeddingForLanguageRevision(language: string, revision: number): NLEmbedding;

  static sentenceEmbeddingForLanguage(language: string): NLEmbedding;

  static sentenceEmbeddingForLanguageRevision(language: string, revision: number): NLEmbedding;

  static embeddingWithContentsOfURLError<This extends abstract new (...args: any) => any>(this: This, url: NSURL, error: interop.PointerConvertible): InstanceType<This>;

  containsString(string: string): boolean;

  distanceBetweenStringAndStringDistanceType(firstString: string, secondString: string, distanceType: interop.Enum<typeof NLDistanceType>): number;

  enumerateNeighborsForStringMaximumCountDistanceTypeUsingBlock(string: string, maxCount: number, distanceType: interop.Enum<typeof NLDistanceType>, block: (p1: string, p2: number, p3: interop.PointerConvertible) => void): void;

  enumerateNeighborsForStringMaximumCountMaximumDistanceDistanceTypeUsingBlock(string: string, maxCount: number, maxDistance: number, distanceType: interop.Enum<typeof NLDistanceType>, block: (p1: string, p2: number, p3: interop.PointerConvertible) => void): void;

  neighborsForStringMaximumCountDistanceType(string: string, maxCount: number, distanceType: interop.Enum<typeof NLDistanceType>): NSArray;

  neighborsForStringMaximumCountMaximumDistanceDistanceType(string: string, maxCount: number, maxDistance: number, distanceType: interop.Enum<typeof NLDistanceType>): NSArray;

  vectorForString(string: string): NSArray;

  getVectorForString(vector: interop.PointerConvertible, string: string): boolean;

  enumerateNeighborsForVectorMaximumCountDistanceTypeUsingBlock(vector: NSArray<interop.Object> | Array<interop.Object>, maxCount: number, distanceType: interop.Enum<typeof NLDistanceType>, block: (p1: string, p2: number, p3: interop.PointerConvertible) => void): void;

  enumerateNeighborsForVectorMaximumCountMaximumDistanceDistanceTypeUsingBlock(vector: NSArray<interop.Object> | Array<interop.Object>, maxCount: number, maxDistance: number, distanceType: interop.Enum<typeof NLDistanceType>, block: (p1: string, p2: number, p3: interop.PointerConvertible) => void): void;

  neighborsForVectorMaximumCountDistanceType(vector: NSArray<interop.Object> | Array<interop.Object>, maxCount: number, distanceType: interop.Enum<typeof NLDistanceType>): NSArray;

  neighborsForVectorMaximumCountMaximumDistanceDistanceType(vector: NSArray<interop.Object> | Array<interop.Object>, maxCount: number, maxDistance: number, distanceType: interop.Enum<typeof NLDistanceType>): NSArray;

  readonly dimension: number;

  readonly vocabularySize: number;

  readonly language: string;

  readonly revision: number;

  static supportedRevisionsForLanguage(language: string): NSIndexSet;

  static currentRevisionForLanguage(language: string): number;

  static supportedSentenceEmbeddingRevisionsForLanguage(language: string): NSIndexSet;

  static currentSentenceEmbeddingRevisionForLanguage(language: string): number;

  static writeEmbeddingForDictionaryLanguageRevisionToURLError(dictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, language: string | null, revision: number, url: NSURL, error: interop.PointerConvertible): boolean;
}

export declare class NLTokenizer extends NSObject {
  initWithUnit(unit: interop.Enum<typeof NLTokenUnit>): this;

  readonly unit: interop.Enum<typeof NLTokenUnit>;

  string: string;

  setLanguage(language: string): void;

  tokenRangeAtIndex(characterIndex: number): _NSRange;

  tokenRangeForRange(range: _NSRange): _NSRange;

  tokensForRange(range: _NSRange): NSArray;

  enumerateTokensInRangeUsingBlock(range: _NSRange, block: (p1: _NSRange, p2: interop.Enum<typeof NLTokenizerAttributes>, p3: interop.PointerConvertible) => void): void;
}

export declare class NLModelConfiguration extends NSObject implements NSCopying, NSSecureCoding {
  readonly type: interop.Enum<typeof NLModelType>;

  readonly language: string;

  readonly revision: number;

  static supportedRevisionsForType(type: interop.Enum<typeof NLModelType>): NSIndexSet;

  static currentRevisionForType(type: interop.Enum<typeof NLModelType>): number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}
