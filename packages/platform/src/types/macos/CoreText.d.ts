import type { CFRange, CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { interop } from './objc-runtime'

import { CFComparisonResult } from './CoreFoundation'

import { NativeObject } from './objc-runtime'

export declare const kCTFontTableAvar: number

export declare const kHanjaToHangulSelector: number

export declare const kJUSTpcGlyphStretchAction: number

export declare const kCTFontTableFvar: number

export declare const kCTFontOrientationAttribute: interop.Pointer

export declare const kFullWidthCJKRomanSelector: number

export declare const kFontSlavicScript: number

export declare const kCTFontSymbolicTrait: interop.Pointer

export declare const kRubyKanaType: number

export declare const kFontUniqueName: number

export declare const kTRAKUniformFormat: number

export declare const kFontSpanishLanguage: number

export declare const kFontFarsiLanguage: number

export declare const kCTFontDescriptorLanguageAttribute: interop.Pointer

export declare const kAbbrevSquaredLigaturesOnSelector: number

export declare const kFontDanishLanguage: number

export declare const kHyphenToMinusOnSelector: number

export declare const kMORTraDxA: number

export declare const kCTFontFeatureSampleTextKey: interop.Pointer

export declare const kCaseSensitiveSpacingOnSelector: number

export declare const kStylisticAltEightOffSelector: number

export declare const kCTTypesetterOptionDisableBidiProcessing: interop.Pointer

export declare const kCJKItalicRomanOffSelector: number

export declare const kAlternateHorizKanaOffSelector: number

export declare const kUnicodeDecompositionType: number

export declare const kFontSomaliLanguage: number

export declare const kFontNoPlatformCode: number

export declare const kSmartSwashType: number

export declare const kCTFontVariationAxisMinimumValueKey: interop.Pointer

export declare const kFontKoreanLanguage: number

export declare const kKERXSimpleArray: number

export declare const kUnconnectedSelector: number

export declare const kFontKashmiriLanguage: number

export declare const kStylisticAltOneOnSelector: number

export declare const kIdeographicAltFiveSelector: number

export declare const kQuarterWidthTextSelector: number

export declare const kUpperAndLowerCaseSelector: number

export declare const kFontVersionName: number

export declare const kRomanNumeralAnnotationSelector: number

export declare const kHalfWidthIdeographsSelector: number

export declare const kFontSwahiliLanguage: number

export declare const kStylisticAltFifteenOffSelector: number

export declare const kCTRubyAnnotationScaleToFitAttributeName: interop.Pointer

export declare const kCTFontPriorityDynamic: number

export declare const kCTStrokeColorAttributeName: interop.Pointer

export declare const kFontGallaLanguage: number

export declare const kNormalPositionSelector: number

export declare const kMORTLigatureType: number

export declare const kFontNoNameCode: number

export declare const kCTFontDesignerURLNameKey: interop.Pointer

export declare const kInitialCapsAndSmallCapsSelector: number

export declare const sizeof_sfntInstance: number

export declare const kHyphensToEmDashOnSelector: number

export declare const kCTFontFamilyNameAttribute: interop.Pointer

export declare const kCTFontManagerRegisteredFontsChangedNotification: interop.Pointer

export declare const kKERNStateTable: number

export declare const kFontMalteseLanguage: number

export declare const kMathematicalGreekOffSelector: number

export declare const kUpperCaseNumbersSelector: number

export declare const kDefaultUpperCaseSelector: number

export declare const kJUSTCurrentVersion: number

export declare const kCanonicalCompositionOffSelector: number

export declare const kFontMalayalamScript: number

export declare const kUpperCaseSmallCapsSelector: number

export declare const kFontDesignerURLName: number

export declare const kCTFontTableLcar: number

export declare const kCTFontVariationAxisNameKey: interop.Pointer

export declare const kFontVietnameseLanguage: number

export declare const kFontEstonianLanguage: number

export declare const kFontMarathiLanguage: number

export declare const kStylisticAltSixteenOnSelector: number

export declare const kKERNNoStakeNote: number

export declare const kSFNTLookupSegmentArray: number

export declare const kNoAlternatesSelector: number

export declare const kFontBulgarianLanguage: number

export declare const kJIS2004CharactersSelector: number

export declare const kExponentsOffSelector: number

export declare const kInvertedCircleAnnotationSelector: number

export declare const kCTTabColumnTerminatorsAttributeName: interop.Pointer

export declare const descriptorFontTableTag: number

export declare const kAltHalfWidthTextSelector: number

export declare const kRareLigaturesOnSelector: number

export declare const kFontNoScriptCode: number

export declare const kJUSTStandardFormat: number

export declare const kLineInitialSwashesOnSelector: number

export declare const kSymbolLigaturesOnSelector: number

export declare const kLTAGCurrentVersion: number

export declare const kCTFontFixedAdvanceAttribute: interop.Pointer

export declare const kFontKhmerScript: number

export declare const kCTRubyAnnotationAttributeName: interop.Pointer

export declare const kCTWritingDirectionOverride: number

export declare const kCTWritingDirectionEmbedding: number

export declare const kCTFontTableVmtx: number

export declare const kCTBaselineOffsetAttributeName: interop.Pointer

export declare const kCTBaselineInfoAttributeName: interop.Pointer

export declare const kCTRunDelegateAttributeName: interop.Pointer

export declare const kCTCharacterShapeAttributeName: interop.Pointer

export declare const kCTGlyphInfoAttributeName: interop.Pointer

export declare const kCTUnderlineStyleAttributeName: interop.Pointer

export declare const kCTParagraphStyleAttributeName: interop.Pointer

export declare const kCTLigatureAttributeName: interop.Pointer

export declare const kCTKernAttributeName: interop.Pointer

export declare const kCTRubyAnnotationSizeFactorAttributeName: interop.Pointer

export declare const kCTFrameClippingPathsAttributeName: interop.Pointer

export declare const kCTFramePathFillRuleAttributeName: interop.Pointer

export declare const kCTFrameProgressionAttributeName: interop.Pointer

export declare const kCTFontManagerBundleIdentifier: interop.Pointer

export declare const kCTFontCollectionDisallowAutoActivationOption: interop.Pointer

export declare const kCTBaselineClassHanging: interop.Pointer

export declare const kCTBaselineClassIdeographicCentered: interop.Pointer

export declare const kCTBaselineClassRoman: interop.Pointer

export declare const kCTFontTableTrak: number

export declare const kCTFontTableSbit: number

export declare const kCTFontTablePost: number

export declare const kCTFontTableName: number

export declare const kCTFontTableMorx: number

export declare const kCTFontTableKerx: number

export declare const kCTFontTableKern: number

export declare const kCTFontTableHmtx: number

export declare const kCTFontTableHead: number

export declare const kCTFontTableHdmx: number

export declare const kCTFontTableGlyf: number

export declare const kCTFontTableGasp: number

export declare const kCTFontTableFond: number

export declare const kCTFontTableFmtx: number

export declare const kCTFontTableFdsc: number

export declare const kCTFontTableCvt: number

export declare const kCTFontTableCvar: number

export declare const kCTFontTableCidg: number

export declare const kCTFontTableBsln: number

export declare const kCTFontTableBdat: number

export declare const kCTFontTableVVAR: number

export declare const kCTFontTableSVG: number

export declare const kCTFontTableSTAT: number

export declare const kCTFontTablePCLT: number

export declare const kCTFontTableMERG: number

export declare const kCTFontTableJSTF: number

export declare const kCTFontTableHVAR: number

export declare const kCTFontTableGSUB: number

export declare const kCTFontTableGDEF: number

export declare const kCTFontTableEBLC: number

export declare const kCTFontTableEBDT: number

export declare const kCTFontTableCOLR: number

export declare const kCTFontTableCFF: number

export declare const kCTFontTableBASE: number

export declare const kCTFontFeatureTooltipTextKey: interop.Pointer

export declare const kCTFontFeatureSelectorDefaultKey: interop.Pointer

export declare const kCTFontOpenTypeFeatureTag: interop.Pointer

export declare const kCTFontVariationAxisDefaultValueKey: interop.Pointer

export declare const kCTFontVariationAxisMaximumValueKey: interop.Pointer

export declare const kCTFontSampleTextNameKey: interop.Pointer

export declare const kCTFontLicenseURLNameKey: interop.Pointer

export declare const kCTFontLicenseNameKey: interop.Pointer

export declare const kCTFontDescriptionNameKey: interop.Pointer

export declare const kCTFontDesignerNameKey: interop.Pointer

export declare const kCTFontTrademarkNameKey: interop.Pointer

export declare const kCTFontPostScriptNameKey: interop.Pointer

export declare const kCTFontCopyrightNameKey: interop.Pointer

export declare const kCTFontDescriptorMatchingTotalAssetSize: interop.Pointer

export declare const kCTFontDescriptorMatchingResult: interop.Pointer

export declare const kCTFontDescriptorMatchingDescriptors: interop.Pointer

export declare const kCTFontDescriptorMatchingSourceDescriptor: interop.Pointer

export declare const kCTFontOpticalSizeAttribute: interop.Pointer

export declare const kCTFontEnabledAttribute: interop.Pointer

export declare const kCTFontPriorityComputer: number

export declare const kCTFontPriorityNetwork: number

export declare const kCTFontPrioritySystem: number

export declare const kCTFontPriorityAttribute: interop.Pointer

export declare const kCTFontFormatAttribute: interop.Pointer

export declare const kCTFontFeatureSettingsAttribute: interop.Pointer

export declare const kCTFontBaselineAdjustAttribute: interop.Pointer

export declare const kMORTraCDxAB: number

export declare const kCTFontLanguagesAttribute: interop.Pointer

export declare const kCTFontTraitsAttribute: interop.Pointer

export declare const kCTFontMatrixAttribute: interop.Pointer

export declare const kCTFontSizeAttribute: interop.Pointer

export declare const kCTFontVariationAttribute: interop.Pointer

export declare const kCTFontStyleNameAttribute: interop.Pointer

export declare const kCTFontNameAttribute: interop.Pointer

export declare const kCTFontURLAttribute: interop.Pointer

export declare const kCTBaselineReferenceFont: interop.Pointer

export declare const kCTFontClassMaskShift: number

export declare const kCTFontSlantTrait: interop.Pointer

export declare const kCTFontTableEBSC: number

export declare const kFontAmharicLanguage: number

export declare const kFontCatalanLanguage: number

export declare const kCTBaselineClassIdeographicHigh: interop.Pointer

export declare const kCTFontCollectionRemoveDuplicatesOption: interop.Pointer

export declare const kCTForegroundColorFromContextAttributeName: interop.Pointer

export declare const kMORXCoverLogicalOrder: number

export declare const featureFontTableTag: number

export declare const sizeof_sfntDescriptorHeader: number

export declare const kMORTraDCxA: number

export declare const sizeof_sfntVariationHeader: number

export declare const sizeof_sfntVariationAxis: number

export declare const sizeof_sfntNameRecord: number

export declare const kFontPostScriptCIDName: number

export declare const kFontSampleTextName: number

export declare const kFontLicenseDescriptionName: number

export declare const kFontVendorURLName: number

export declare const kFontManufacturerName: number

export declare const kFontTrademarkName: number

export declare const kFontPostscriptName: number

export declare const kFontFullName: number

export declare const kFontStyleName: number

export declare const kFontFamilyName: number

export declare const kFontCopyrightName: number

export declare const nameFontTableTag: number

export declare const sizeof_sfntCMapHeader: number

export declare const kFontNoLanguageCode: number

export declare const kFontSundaneseRomLanguage: number

export declare const kFontTatarLanguage: number

export declare const kCTFontMacintoshEncodingsAttribute: interop.Pointer

export declare const kFontQuechuaLanguage: number

export declare const kFontWelshLanguage: number

export declare const kFontChewaLanguage: number

export declare const kSlashedZeroOffSelector: number

export declare const kFontOromoLanguage: number

export declare const kFontTigrinyaLanguage: number

export declare const kFontMalayArabicLanguage: number

export declare const kFontMalayRomanLanguage: number

export declare const kFontTagalogLanguage: number

export declare const kFontBurmeseLanguage: number

export declare const kFontTeluguLanguage: number

export declare const kFontKannadaLanguage: number

export declare const kFontMalayalamLanguage: number

export declare const kFontGujaratiLanguage: number

export declare const kFontBengaliLanguage: number

export declare const kFontSanskritLanguage: number

export declare const kFontSindhiLanguage: number

export declare const kFontMongolianCyrLanguage: number

export declare const kFontTurkmenLanguage: number

export declare const kFontMoldavianLanguage: number

export declare const kFontGeorgianLanguage: number

export declare const kFontAzerbaijanArLanguage: number

export declare const kFontAzerbaijaniLanguage: number

export declare const kFontByelorussianLanguage: number

export declare const kFontUkrainianLanguage: number

export declare const kFontMacedonianLanguage: number

export declare const kFontYiddishLanguage: number

export declare const kFontSlovenianLanguage: number

export declare const kFontSlovakLanguage: number

export declare const kPROPANDirectionClass: number

export declare const kFontCzechLanguage: number

export declare const kFontIrishLanguage: number

export declare const kFontFlemishLanguage: number

export declare const kFontRussianLanguage: number

export declare const kFontPersianLanguage: number

export declare const kFontFaeroeseLanguage: number

export declare const kFontLettishLanguage: number

export declare const kFontHungarianLanguage: number

export declare const kFontPolishLanguage: number

export declare const kFontLithuanianLanguage: number

export declare const kFontThaiLanguage: number

export declare const kFontHindiLanguage: number

export declare const kFontUrduLanguage: number

export declare const kFontTradChineseLanguage: number

export declare const kFontCroatianLanguage: number

export declare const kFontTurkishLanguage: number

export declare const kFontIcelandicLanguage: number

export declare const kFontNorwegianLanguage: number

export declare const kFontPortugueseLanguage: number

export declare const kFontDutchLanguage: number

export declare const kContextualSwashAlternatesOnSelector: number

export declare const kFontGermanLanguage: number

export declare const kFontEnglishLanguage: number

export declare const kFontCustom816BitScript: number

export declare const kFontCustom8BitScript: number

export declare const kFontMicrosoftStandardScript: number

export declare const kFontMicrosoftSymbolScript: number

export declare const kFontVietnameseScript: number

export declare const kFontEastEuropeanRomanScript: number

export declare const kFontEthiopicScript: number

export declare const kFontGeezScript: number

export declare const kFontMongolianScript: number

export declare const kFontArmenianScript: number

export declare const kFontThaiScript: number

export declare const kFontBurmeseScript: number

export declare const kFontSinhaleseScript: number

export declare const kCTFontTableCmap: number

export declare const kFontKannadaScript: number

export declare const kFontTeluguScript: number

export declare const kFontTamilScript: number

export declare const kFontOriyaScript: number

export declare const kFontGujaratiScript: number

export declare const kFontDevanagariScript: number

export declare const kFontRussian: number

export declare const kFontCyrillicScript: number

export declare const kFontArabicScript: number

export declare const kFontKoreanScript: number

export declare const kFontTraditionalChineseScript: number

export declare const kFontJapaneseScript: number

export declare const kFontUnicodeV2_0BMPOnlySemantics: number

export declare const kFontISO10646_1993Semantics: number

export declare const kFontCustomPlatform: number

export declare const kFontMicrosoftPlatform: number

export declare const kFontMacintoshPlatform: number

export declare const kFontUnicodePlatform: number

export declare const cmapFontTableTag: number

export declare const sizeof_sfntDirectory: number

export declare const kANKRCurrentVersion: number

export declare const kBSLNNoBaselineOverride: number

export declare const kBSLNNoBaseline: number

export declare const kFontSimpleChineseScript: number

export declare const kBSLNNumBaselineClasses: number

export declare const kBSLNLastBaseline: number

export declare const kBSLNIdeographicHighBaseline: number

export declare const kBSLNMathBaseline: number

export declare const kBSLNHangingBaseline: number

export declare const kBSLNIdeographicLowBaseline: number

export declare const kCTSuperscriptAttributeName: interop.Pointer

export declare const kBSLNControlPointFormatWithMap: number

export declare const kBSLNDistanceFormatWithMap: number

export declare const kBSLNCurrentVersion: number

export declare const kBSLNTag: number

export declare const kKERXValuesAreLong: number

export declare const kKERXActionOffsetMask: number

export declare const kKERXActionTypeControlPoints: number

export declare const kKERXNoStakeNote: number

export declare const kKERXLineEndKerning: number

export declare const kKERXLineStart: number

export declare const kKERXControlPoint: number

export declare const kKERXFormatMask: number

export declare const kKERXUnusedBits: number

export declare const kKERXCrossStream: number

export declare const kKERXResetCrossStream: number

export declare const kKERXCurrentVersion: number

export declare const kKERNNoCrossKerning: number

export declare const kKERNLineStart: number

export declare const kKERNOrderedList: number

export declare const kKERNFormatMask: number

export declare const kPROPTag: number

export declare const kKERNVariation: number

export declare const kKERNCrossStream: number

export declare const kKERNResetCrossStream: number

export declare const kKERNCurrentVersion: number

export declare const kKERNTag: number

export declare const kTRAKCurrentVersion: number

export declare const kPROPNumDirectionClasses: number

export declare const kPROPBNDirectionClass: number

export declare const kPROPNSMDirectionClass: number

export declare const kPROPPDFDirectionClass: number

export declare const kPROPRLODirectionClass: number

export declare const kPROPLREDirectionClass: number

export declare const kPROPSENDirectionClass: number

export declare const kPROPONDirectionClass: number

export declare const kPROPWSDirectionClass: number

export declare const kPROPSDirectionClass: number

export declare const kPROPPSDirectionClass: number

export declare const kPROPCSDirectionClass: number

export declare const kPROPESDirectionClass: number

export declare const kPROPALDirectionClass: number

export declare const kPROPLDirectionClass: number

export declare const kPROPZeroReserved: number

export declare const kPROPRightConnectMask: number

export declare const kPROPPairOffsetMask: number

export declare const kPROPUseRLPairMask: number

export declare const kPROPPairOffsetShift: number

export declare const kMORXCoverIgnoreVertical: number

export declare const kMORXCoverDescending: number

export declare const kMORXCurrentVersion: number

export declare const kMORTMarkInsertCountShift: number

export declare const kMORTCurrInsertCountShift: number

export declare const kMORTCurrInsertCountMask: number

export declare const kMORTCurrJustTableCountShift: number

export declare const kMORTCurrJustTableCountMask: number

export declare const kMORTMarkJustTableCountShift: number

export declare const kMORTMarkJustTableCountMask: number

export declare const kMORTCurrInsertBefore: number

export declare const kMORTMarkInsertKashidaLike: number

export declare const kMORTCurrInsertKashidaLike: number

export declare const kMORTInsertionsCountMask: number

export declare const kMORTraDCxBA: number

export declare const kJUSTPriorityCount: number

export declare const kMORTraxBA: number

export declare const kMORTraDx: number

export declare const kMORTLigFormOffsetShift: number

export declare const kMORTLigFormOffsetMask: number

export declare const kMORTSwashType: number

export declare const kMORTContextualType: number

export declare const kMORTCoverTypeMask: number

export declare const kMORTCoverIgnoreVertical: number

export declare const kMORTCoverDescending: number

export declare const kMORTCoverVertical: number

export declare const kMORTCurrentVersion: number

export declare const kMORTTag: number

export declare const kOPBDControlPointFormat: number

export declare const kOPBDDistanceFormat: number

export declare const kOPBDCurrentVersion: number

export declare const kOPBDTag: number

export declare const kJUSTPriorityMask: number

export declare const kJUSTOverrideLimits: number

export declare const kJUSTOverridePriority: number

export declare const kCTFontVariationAxisHiddenKey: interop.Pointer

export declare const kJUSTLetterPriority: number

export declare const kJUSTKashidaPriority: number

export declare const kJUSTpcGlyphRepeatAddAction: number

export declare const kJUSTpcDuctilityAction: number

export declare const kJUSTpcConditionalAddAction: number

export declare const kJUSTpcDecompositionAction: number

export declare const kLCARCurrentVersion: number

export declare const kSTRearrVerbMask: number

export declare const kSTLigActionMask: number

export declare const kSTMarkEnd: number

export declare const kSTClassEndOfLine: number

export declare const kSTClassOutOfBounds: number

export declare const kSTClassEndOfText: number

export declare const kSFNTLookupVector: number

export declare const kSFNTLookupTrimmedArray: number

export declare const kSFNTLookupSingleTable: number

export declare const kSFNTLookupSegmentSingle: number

export declare const kSFNTLookupSimpleArray: number

export declare const kProportionalCJKRomanSelector: number

export declare const kUpperCasePetiteCapsSelector: number

export declare const kLowerCasePetiteCapsSelector: number

export declare const kSwashAlternatesOffSelector: number

export declare const kSwashAlternatesOnSelector: number

export declare const kStylisticAltTwentyOnSelector: number

export declare const kStylisticAltNineteenOffSelector: number

export declare const kStylisticAltEighteenOnSelector: number

export declare const kStylisticAltSeventeenOnSelector: number

export declare const kStylisticAltSixteenOffSelector: number

export declare const kStylisticAltFifteenOnSelector: number

export declare const kStylisticAltFourteenOffSelector: number

export declare const kStylisticAltFourteenOnSelector: number

export declare const kStylisticAltThirteenOnSelector: number

export declare const kFontTibetanScript: number

export declare const kStylisticAltTwelveOnSelector: number

export declare const kStylisticAltElevenOffSelector: number

export declare const kStylisticAltElevenOnSelector: number

export declare const kHalfWidthCJKRomanSelector: number

export declare const kStylisticAltTenOffSelector: number

export declare const kStylisticAltTenOnSelector: number

export declare const kStylisticAltEightOnSelector: number

export declare const kStylisticAltSevenOnSelector: number

export declare const kStylisticAltSixOffSelector: number

export declare const kStylisticAltSixOnSelector: number

export declare const kSTClassDeletedGlyph: number

export declare const kStylisticAltFiveOffSelector: number

export declare const kStylisticAltThreeOffSelector: number

export declare const kStylisticAltThreeOnSelector: number

export declare const kStylisticAltTwoOffSelector: number

export declare const kStylisticAltTwoOnSelector: number

export declare const kAlternateVertKanaOffSelector: number

export declare const kAlternateHorizKanaOnSelector: number

export declare const kCaseSensitiveSpacingOffSelector: number

export declare const kCJKItalicRomanOnSelector: number

export declare const kCTFontDescriptorMatchingPercentage: interop.Pointer

export declare const kCJKItalicRomanSelector: number

export declare const kNoCJKItalicRomanSelector: number

export declare const kCJKVerticalRomanCenteredSelector: number

export declare const kKERNCrossStreamResetNote: number

export declare const kIdeographicAltFourSelector: number

export declare const kIdeographicAltThreeSelector: number

export declare const kIdeographicAltOneSelector: number

export declare const kNoIdeographicAlternativesSelector: number

export declare const kCJKSymbolAltFourSelector: number

export declare const kCJKSymbolAltThreeSelector: number

export declare const kNoCJKSymbolAlternativesSelector: number

export declare const kRubyKanaOffSelector: number

export declare const kRubyKanaOnSelector: number

export declare const kNoRubyKanaSelector: number

export declare const kTranscodingCompositionOffSelector: number

export declare const kTranscodingCompositionOnSelector: number

export declare const kCompatibilityCompositionOffSelector: number

export declare const kProportionalIdeographsSelector: number

export declare const kFullWidthKanaSelector: number

export declare const kInvertedRoundedBoxAnnotationSelector: number

export declare const kPeriodAnnotationSelector: number

export declare const kParenthesisAnnotationSelector: number

export declare const kCircleAnnotationSelector: number

export declare const kHanjaToHangulAltTwoSelector: number

export declare const kRomanizationToKatakanaSelector: number

export declare const kRomanizationToHiraganaSelector: number

export declare const kKanaToRomanizationSelector: number

export declare const kAltProportionalTextSelector: number

export declare const kThirdWidthTextSelector: number

export declare const kOverlappingCharactersType: number

export declare const kHalfWidthTextSelector: number

export declare const kTraditionalNamesCharactersSelector: number

export declare const kExpertCharactersSelector: number

export declare const kTraditionalAltFiveSelector: number

export declare const kTraditionalAltFourSelector: number

export declare const kTraditionalAltThreeSelector: number

export declare const kJIS1983CharactersSelector: number

export declare const kSimplifiedCharactersSelector: number

export declare const kTraditionalCharactersSelector: number

export declare const kTallCapsSelector: number

export declare const kTitlingCapsSelector: number

export declare const kProportionalKanaSelector: number

export declare const kIlluminatedCapsSelector: number

export declare const kDisplayTextSelector: number

export declare const kDesignLevel5Selector: number

export declare const kDesignLevel4Selector: number

export declare const kDesignLevel3Selector: number

export declare const kInternationalSymbolsSelector: number

export declare const kFleuronsSelector: number

export declare const kPiCharactersSelector: number

export declare const kDingbatsSelector: number

export declare const kCTFontTableVhea: number

export declare const kNoOrnamentsSelector: number

export declare const kMathematicalGreekOnSelector: number

export declare const kExponentsOnSelector: number

export declare const kInequalityLigaturesOffSelector: number

export declare const kInequalityLigaturesOnSelector: number

export declare const kSlashToDivideOffSelector: number

export declare const kAsteriskToMultiplyOffSelector: number

export declare const kHyphenToMinusOffSelector: number

export declare const kFontUnicode_FullRepertoire: number

export declare const kPeriodsToEllipsisOffSelector: number

export declare const kSmartQuotesOnSelector: number

export declare const kSlashedZeroOnSelector: number

export declare const kHyphenToEnDashOnSelector: number

export declare const kPreventOverlapOffSelector: number

export declare const kPreventOverlapOnSelector: number

export declare const kDiagonalFractionsSelector: number

export declare const kVerticalFractionsSelector: number

export declare const kNoFractionsSelector: number

export declare const kInferiorsSelector: number

export declare const kSuperiorsSelector: number

export declare const kShowDiacriticsSelector: number

export declare const kLineFinalSwashesOffSelector: number

export declare const kLineFinalSwashesOnSelector: number

export declare const kLineInitialSwashesOffSelector: number

export declare const kWordInitialSwashesOffSelector: number

export declare const kWordInitialSwashesOnSelector: number

export declare const kThirdWidthNumbersSelector: number

export declare const kProportionalNumbersSelector: number

export declare const kMonospacedNumbersSelector: number

export declare const kLinguisticRearrangementOffSelector: number

export declare const kLinguisticRearrangementOnSelector: number

export declare const kSubstituteVerticalFormsOffSelector: number

export declare const kSubstituteVerticalFormsOnSelector: number

export declare const kInitialCapsSelector: number

export declare const kSmallCapsSelector: number

export declare const kAllLowerCaseSelector: number

export declare const kAllCapsSelector: number

export declare const kPartiallyConnectedSelector: number

export declare const kHistoricalLigaturesOnSelector: number

export declare const kContextualLigaturesOnSelector: number

export declare const kSymbolLigaturesOffSelector: number

export declare const kAbbrevSquaredLigaturesOffSelector: number

export declare const kSquaredLigaturesOffSelector: number

export declare const kSquaredLigaturesOnSelector: number

export declare const kDiphthongLigaturesOnSelector: number

export declare const kRebusPicturesOffSelector: number

export declare const kRebusPicturesOnSelector: number

export declare const kLogosOffSelector: number

export declare const kCommonLigaturesOffSelector: number

export declare const kCommonLigaturesOnSelector: number

export declare const kRequiredLigaturesOffSelector: number

export declare const kRequiredLigaturesOnSelector: number

export declare const kAllTypeFeaturesOnSelector: number

export declare const kCJKRomanSpacingType: number

export declare const kLanguageTagType: number

export declare const kLCARTag: number

export declare const kUpperCaseType: number

export declare const kLowerCaseType: number

export declare const kStylisticAlternativesType: number

export declare const kCaseSensitiveLayoutType: number

export declare const kItalicCJKRomanType: number

export declare const kIdeographicAlternativesType: number

export declare const kCharacterShapeType: number

export declare const kDesignComplexityType: number

export declare const kCharacterAlternativesType: number

export declare const kOrnamentSetsType: number

export declare const os2FontTableTag: number

export declare const kMathematicalExtrasType: number

export declare const kDiacriticsType: number

export declare const kNumberSpacingType: number

export declare const kLinguisticRearrangementType: number

export declare const kVerticalSubstitutionType: number

export declare const kLetterCaseType: number

export declare const kLigaturesType: number

export declare const kCJKSymbolAltTwoSelector: number

export declare const kHojoCharactersSelector: number

export declare const kFontPunjabiLanguage: number

export declare const kCTFontTableFeat: number

export declare const kFontExtendedArabicScript: number

export declare const kMORTMarkInsertBefore: number

export declare const kCTFontTableSbix: number

export declare const kNonFinalSwashesOnSelector: number

export declare const kFontPreferredFamilyName: number

export declare const kPROPCanHangLTMask: number

export declare const kCTStrokeWidthAttributeName: interop.Pointer

export declare const kMORTRearrangementType: number

export declare const kFractionsType: number

export declare const kCTFontDescriptorMatchingTotalDownloadedSize: interop.Pointer

export declare const kStylisticAltFourOffSelector: number

export declare const sizeof_sfntCMapExtendedSubHeader: number

export declare const kFontGurmukhiScript: number

export declare const kJIS1990CharactersSelector: number

export declare const kMORTLigStoreLigature: number

export declare const kTraditionalAltTwoSelector: number

export declare const kFontLaoLanguage: number

export declare const kKatakanaToHiraganaSelector: number

export declare const kRareLigaturesOffSelector: number

export declare const kIdeographicSpacingType: number

export declare const kFontMicrosoftUCS4Script: number

export declare const kFontDescriptionName: number

export declare const kFontTajikiLanguage: number

export declare const kMORTraxAB: number

export declare const kMORTraxA: number

export declare const kCTFontDownloadableAttribute: interop.Pointer

export declare const kCTFontVariationAxisIdentifierKey: interop.Pointer

export declare const kCTFontFeatureTypeExclusiveKey: interop.Pointer

export declare const kDefaultLowerCaseSelector: number

export declare const kHyphenToEnDashOffSelector: number

export declare const kLCARCtlPointFormat: number

export declare const kFormInterrobangOnSelector: number

export declare const kAllTypeFeaturesOffSelector: number

export declare const kFontHebrewLanguage: number

export declare const kKERXVariation: number

export declare const kCTFontVendorURLNameKey: interop.Pointer

export declare const kCTFontCollectionIncludeDisabledFontsOption: interop.Pointer

export declare const kPROPRLEDirectionClass: number

export declare const kFontOriyaLanguage: number

export declare const kCTFontPriorityProcess: number

export declare const kCTBaselineClassIdeographicLow: interop.Pointer

export declare const kCTFramePathClippingPathAttributeName: interop.Pointer

export declare const kFontArmenianLanguage: number

export declare const kMORTraDCxAB: number

export declare const kStyleOptionsType: number

export declare const kCTFontFamilyNameKey: interop.Pointer

export declare const kCTFontUniqueNameKey: interop.Pointer

export declare const kFontJapaneseLanguage: number

export declare const kFontHebrewScript: number

export declare const kJUSTpcUnconditionalAddAction: number

export declare const kMORXCoverTypeMask: number

export declare const kSlashToDivideOnSelector: number

export declare const kMORTIsSplitVowelPiece: number

export declare const kCJKVerticalRomanPlacementType: number

export declare const kCTFontTableVORG: number

export declare const kAllTypographicFeaturesType: number

export declare const kCTFontTableMaxp: number

export declare const kNoStylisticAlternatesSelector: number

export declare const kRubyKanaSelector: number

export declare const kFontGeorgianScript: number

export declare const kFontMacCompatibleFullName: number

export declare const kCJKSymbolAltOneSelector: number

export declare const kFontItalianLanguage: number

export declare const kFontBasqueLanguage: number

export declare const kCTFontTableCBLC: number

export declare const kNoStyleOptionsSelector: number

export declare const sizeof_sfntNameHeader: number

export declare const kCTFontTableHsty: number

export declare const kCTFontManagerErrorDomain: interop.Pointer

export declare const kFontGreekLanguage: number

export declare const kFormInterrobangOffSelector: number

export declare const kKERXStateTable: number

export declare const kCTFontTableFpgm: number

export declare const kStylisticAltNineOnSelector: number

export declare const kContextualAlternatesOnSelector: number

export declare const kJUSTUnlimited: number

export declare const kStylisticAltSevenOffSelector: number

export declare const kStylisticAltTwelveOffSelector: number

export declare const kFontRSymbolScript: number

export declare const kJUSTNullPriority: number

export declare const kDesignLevel2Selector: number

export declare const kHyphensToEmDashOffSelector: number

export declare const kCTFontCharacterSetAttribute: interop.Pointer

export declare const kCTFontTableOpbd: number

export declare const sizeof_sfntCMapEncoding: number

export declare const kFontKhmerLanguage: number

export declare const kCTFontFeaturesAttribute: interop.Pointer

export declare const kOrdinalsSelector: number

export declare const kWordFinalSwashesOffSelector: number

export declare const kCTFontVariationAxesAttribute: interop.Pointer

export declare const kCursiveSelector: number

export declare const kKanaSpacingType: number

export declare const kKERNVertical: number

export declare const kStylisticAltThirteenOffSelector: number

export declare const kCursiveConnectionType: number

export declare const kKERXDescending: number

export declare const kCTFontDescriptorMatchingError: interop.Pointer

export declare const kCTFontManufacturerNameKey: interop.Pointer

export declare const kTraditionalAltOneSelector: number

export declare const kFontAmharicScript: number

export declare const kFontMongolianLanguage: number

export declare const kCTFontTableHhea: number

export declare const kBSLNIdeographicCenterBaseline: number

export declare const kCTBaselineOriginalFont: interop.Pointer

export declare const kJUSTSpacePriority: number

export declare const kContextualAlternatesOffSelector: number

export declare const kFontTamilLanguage: number

export declare const kKERXOrderedList: number

export declare const kCTBackgroundColorAttributeName: interop.Pointer

export declare const kCTVerticalFormsAttributeName: interop.Pointer

export declare const kDefaultCJKRomanSelector: number

export declare const kDecorativeBordersSelector: number

export declare const kCTFontTableJust: number

export declare const kCTFontFeatureSelectorIdentifierKey: interop.Pointer

export declare const kCJKSymbolAltFiveSelector: number

export declare const kStylisticAltTwentyOffSelector: number

export declare const kCTFontFeatureSelectorNameKey: interop.Pointer

export declare const kCTFontTableBhed: number

export declare const kCTFontFeatureSelectorSettingKey: interop.Pointer

export declare const kPROPLRODirectionClass: number

export declare const kStylisticAltEighteenOffSelector: number

export declare const kKERXActionTypeCoordinates: number

export declare const kCTHorizontalInVerticalFormsAttributeName: interop.Pointer

export declare const kFontLatinLanguage: number

export declare const kCaseSensitiveLayoutOnSelector: number

export declare const kLowerCaseSmallCapsSelector: number

export declare const kFontUnicodeV2_0FullCoverageSemantics: number

export declare const kFontKirghizLanguage: number

export declare const kProportionalTextSelector: number

export declare const kNumberCaseType: number

export declare const kTRAKTag: number

export declare const kLowerCaseNumbersSelector: number

export declare const kCTBaselineClassMath: interop.Pointer

export declare const kPROPETDirectionClass: number

export declare const kCTFontFullNameKey: interop.Pointer

export declare const kCTFontDisplayNameAttribute: interop.Pointer

export declare const kCTTypesetterOptionForcedEmbeddingLevel: interop.Pointer

export declare const kMORTInsertionType: number

export declare const kBSLNControlPointFormatNoMap: number

export declare const kCTFontTablePrep: number

export declare const kVerticalPositionType: number

export declare const kPROPPairOffsetSign: number

export declare const kMathSymbolsSelector: number

export declare const kStylisticAltNineteenOnSelector: number

export declare const kSmartQuotesOffSelector: number

export declare const kFontIndonesianLanguage: number

export declare const kKERXIndexArray: number

export declare const kTextSpacingType: number

export declare const kCTFontPriorityUser: number

export declare const kCTFontTableCBDT: number

export declare const kFontArabicLanguage: number

export declare const kCanonicalCompositionOnSelector: number

export declare const kCTFontTableXref: number

export declare const kFontChineseScript: number

export declare const kFontSimpChineseLanguage: number

export declare const kCTFontAttributeName: interop.Pointer

export declare const kCTFramePathWidthAttributeName: interop.Pointer

export declare const kCTFontPostScriptCIDNameKey: interop.Pointer

export declare const kFontNepaliLanguage: number

export declare const kCTTrackingAttributeName: interop.Pointer

export declare const kScientificInferiorsSelector: number

export declare const kStylisticAltOneOffSelector: number

export declare const kJUSTnoGlyphcode: number

export declare const kCTFontWidthTrait: interop.Pointer

export declare const kFontUnicodeDefaultSemantics: number

export declare const kKERXNotesRequested: number

export declare const kFontEsperantoLanguage: number

export declare const kFontMalagasyLanguage: number

export declare const kKERXNoCrossKerning: number

export declare const kMonospacedTextSelector: number

export declare const kCTFontStyleNameKey: interop.Pointer

export declare const kFontSinhaleseLanguage: number

export declare const kCTFontTableMATH: number

export declare const kKERXTag: number

export declare const kBoxAnnotationSelector: number

export declare const kCTFontTableBloc: number

export declare const kAnnotationType: number

export declare const kCTFontTableLoca: number

export declare const kCTFontTableCFF2: number

export declare const kHanjaToHangulAltOneSelector: number

export declare const kMORTraDCx: number

export declare const kTransliterationType: number

export declare const kKERNUnusedBits: number

export declare const kCTFontDownloadedAttribute: interop.Pointer

export declare const kCTLanguageAttributeName: interop.Pointer

export declare const kFontRomanianLanguage: number

export declare const kNonFinalSwashesOffSelector: number

export declare const kCTFontTableDSIG: number

export declare const kFontLatvianLanguage: number

export declare const kFontSaamiskLanguage: number

export declare const kCTFontTableAcnt: number

export declare const kLCARLinearFormat: number

export declare const kFontCustom16BitScript: number

export declare const kMORTraCDxA: number

export declare const kCTUnderlineColorAttributeName: interop.Pointer

export declare const kFontSindhiScript: number

export declare const kCTFontTableOS2: number

export declare const kCTFontTableVDMX: number

export declare const sizeof_sfntCMapSubHeader: number

export declare const kMORXCoverVertical: number

export declare const kFontRomanScript: number

export declare const kKERNSimpleArray: number

export declare const kCTFontTableLtag: number

export declare const kCTFontTableProp: number

export declare const kSTSetMark: number

export declare const kFontJavaneseRomLanguage: number

export declare const kFontLaotianScript: number

export declare const kKERNIndexArray: number

export declare const kFontLicenseInfoURLName: number

export declare const kHanjaToHangulAltThreeSelector: number

export declare const kCTFontFeatureTypeSelectorsKey: interop.Pointer

export declare const kFontDesignerName: number

export declare const kSTXHasLigAction: number

export declare const kFontAymaraLanguage: number

export declare const kKERNLineEndKerning: number

export declare const kFontGuaraniLanguage: number

export declare const kKERXVertical: number

export declare const kTypographicExtrasType: number

export declare const kKERXCrossStreamResetNote: number

export declare const kBSLNRomanBaseline: number

export declare const kPROPDirectionMask: number

export declare const nonGlyphID: number

export declare const kCTFontTableGvar: number

export declare const kHistoricalLigaturesOffSelector: number

export declare const kEngravedTextSelector: number

export declare const kLastFeatureType: number

export declare const kFontFinnishLanguage: number

export declare const variationFontTableTag: number

export declare const kDecomposeDiacriticsSelector: number

export declare const kCTFontFeatureTypeNameKey: interop.Pointer

export declare const kContextualAlternatesType: number

export declare const kNLCCharactersSelector: number

export declare const kFontKazakhLanguage: number

export declare const kKERXUnusedFlags: number

export declare const kCTFontTableMort: number

export declare const kCTFontTableGPOS: number

export declare const kDesignLevel1Selector: number

export declare const kSTKCrossStreamReset: number

export declare const kFontBengaliScript: number

export declare const kFontUighurLanguage: number

export declare const kHiraganaToKatakanaSelector: number

export declare const kFontAssameseLanguage: number

export declare const kCTFontTableMeta: number

export declare const kFontUnicodeV1_1Semantics: number

export declare const kFullWidthIdeographsSelector: number

export declare const kPeriodsToEllipsisOnSelector: number

export declare const kCTFontFeatureTypeIdentifierKey: interop.Pointer

export declare const kJUSTTag: number

export declare const kFontUninterpretedScript: number

export declare const kKERNNotesRequested: number

export declare const kPROPCurrentVersion: number

export declare const kStylisticAltSeventeenOffSelector: number

export declare const kFontSwedishLanguage: number

export declare const kFontUzbekLanguage: number

export declare const kFontAlbanianLanguage: number

export declare const kCTFontTableAnkr: number

export declare const kPROPRDirectionClass: number

export declare const kCTForegroundColorAttributeName: interop.Pointer

export declare const kCTWritingDirectionAttributeName: interop.Pointer

export declare const kAlternateKanaType: number

export declare const kJIS1978CharactersSelector: number

export declare const kFontKurdishLanguage: number

export declare const kWordFinalSwashesOnSelector: number

export declare const kSTNoAdvance: number

export declare const kIdeographicAltTwoSelector: number

export declare const kMORTDoInsertionsBefore: number

export declare const kFontSerbianLanguage: number

export declare const kAsteriskToMultiplyOnSelector: number

export declare const kFontPreferredSubfamilyName: number

export declare const kCTFontWeightTrait: interop.Pointer

export declare const kMORTraCDxBA: number

export declare const kFontDzongkhaLanguage: number

export declare const kFontRuandaLanguage: number

export declare const kPROPCanHangRBMask: number

export declare const kStylisticAltFiveOnSelector: number

export declare const kCTFontVersionNameKey: interop.Pointer

export declare const kCompatibilityCompositionOnSelector: number

export declare const kKERXNotApplied: number

export declare const kCTFontTableLTSH: number

export declare const kPROPIsFloaterMask: number

export declare const kCTFontSubFamilyNameKey: interop.Pointer

export declare const kCTBaselineReferenceInfoAttributeName: interop.Pointer

export declare const kCTRunDelegateVersion1: number

export declare const kKERXActionTypeAnchorPoints: number

export declare const kCJKSymbolAlternativesType: number

export declare const kFontUnicodeV4_0VariationSequenceSemantics: number

export declare const kMORTLigLastAction: number

export declare const kHideDiacriticsSelector: number

export declare const kCTRunDelegateCurrentVersion: number

export declare const kCJKVerticalRomanHBaselineSelector: number

export declare const kCTFontCascadeListAttribute: interop.Pointer

export declare const kMORTMarkInsertCountMask: number

export declare const kFontGreekScript: number

export declare const kCTFontRegistrationScopeAttribute: interop.Pointer

export declare const kFontRundiLanguage: number

export declare const kStylisticAltFourOnSelector: number

export declare const kMORTraDxBA: number

export declare const kFontFrenchLanguage: number

export declare const kNoTransliterationSelector: number

export declare const kFontReservedPlatform: number

export declare const kFontPashtoLanguage: number

export declare const kKERNNotApplied: number

export declare const kInvertedBoxAnnotationSelector: number

export declare const kCTFontTableMVAR: number

export declare const kFontTibetanLanguage: number

export declare const kCTFontDescriptorMatchingCurrentAssetSize: interop.Pointer

export declare const kFontLastReservedName: number

export declare const kLogosOnSelector: number

export declare const kPROPENDirectionClass: number

export declare const kContextualSwashAlternatesOffSelector: number

export declare const kContextualLigaturesOffSelector: number

export declare const kKERXActionTypeMask: number

export declare const kCTFontManagerErrorFontURLsKey: interop.Pointer

export declare const kCTFontTableZapf: number

export declare const kBSLNDistanceFormatNoMap: number

export declare const kMORTraCDx: number

export declare const kNoAnnotationSelector: number

export declare const kCTBaselineClassAttributeName: interop.Pointer

export declare const kStylisticAltNineOffSelector: number

export declare const kCTFontOpenTypeFeatureValue: interop.Pointer

export declare const kMORTraDxAB: number

export declare const kDiamondAnnotationSelector: number

export declare const kCTFontTableCPAL: number

export declare const kDiphthongLigaturesOffSelector: number

export declare const kCTTypesetterOptionAllowUnboundedLayout: interop.Pointer

export declare const kRoundedBoxAnnotationSelector: number

export declare const kMORXTag: number

export declare const kCaseSensitiveLayoutOffSelector: number

export declare const kQuarterWidthNumbersSelector: number

export declare const kJUSTOverrideUnlimited: number

export declare const kMORTraNoAction: number

export declare const kFontLappishLanguage: number

export declare const kAlternateVertKanaOnSelector: number

export declare const CTFontManagerError: {
	FileNotFound: 101
	InsufficientPermissions: 102
	UnrecognizedFormat: 103
	InvalidFontData: 104
	AlreadyRegistered: 105
	ExceededResourceLimit: 106
	AssetNotFound: 107
	NotRegistered: 201
	InUse: 202
	SystemRequired: 203
	RegistrationFailed: 301
	MissingEntitlement: 302
	InsufficientInfo: 303
	CancelledByUser: 304
	DuplicatedName: 305
	InvalidFilePath: 306
	UnsupportedScope: 307
}

export declare const CTFontManagerAutoActivationSetting: {
	Default: 0
	Disabled: 1
	Enabled: 2
	PromptUser: 3
}

export declare const CTFrameProgression: {
	TopToBottom: 0
	RightToLeft: 1
	LeftToRight: 2
}

export declare const CTFontOptions: {
	Default: 0
	PreventAutoActivation: 1
	PreferSystemFont: 4
}

export declare const CTLineTruncationType: {
	Start: 0
	End: 1
	Middle: 2
}

export declare const CTParagraphStyleSpecifier: {
	Alignment: 0
	FirstLineHeadIndent: 1
	HeadIndent: 2
	TailIndent: 3
	TabStops: 4
	DefaultTabInterval: 5
	LineBreakMode: 6
	LineHeightMultiple: 7
	MaximumLineHeight: 8
	MinimumLineHeight: 9
	LineSpacing: 10
	ParagraphSpacing: 11
	ParagraphSpacingBefore: 12
	BaseWritingDirection: 13
	MaximumLineSpacing: 14
	MinimumLineSpacing: 15
	LineSpacingAdjustment: 16
	LineBoundsOptions: 17
	Count: 18
}

export declare const CTUnderlineStyle: {
	None: 0
	Single: 1
	Thick: 2
	Double: 9
}

export declare const CTFontDescriptorMatchingState: {
	DidBegin: 0
	DidFinish: 1
	WillBeginQuerying: 2
	Stalled: 3
	WillBeginDownloading: 4
	Downloading: 5
	DidFinishDownloading: 6
	DidMatch: 7
	DidFailWithError: 8
}

export declare const CTRunStatus: {
	NoStatus: 0
	RightToLeft: 1
	NonMonotonic: 2
	HasNonIdentityMatrix: 4
}

export declare const CTWritingDirection: {
	Natural: -1
	LeftToRight: 0
	RightToLeft: 1
}

export declare const CTTextAlignment: {
	TextAlignmentLeft: 0
	TextAlignmentRight: 1
	TextAlignmentCenter: 2
	TextAlignmentJustified: 3
	TextAlignmentNatural: 4
	LeftTextAlignment: 0
	RightTextAlignment: 1
	CenterTextAlignment: 2
	JustifiedTextAlignment: 3
	NaturalTextAlignment: 4
}

export declare const CTFramePathFillRule: {
	EvenOdd: 0
	WindingNumber: 1
}

export declare const CTFontManagerScope: {
	None: 0
	Process: 1
	Persistent: 2
	Session: 3
	User: 2
}

export declare const CTFontFormat: {
	Unrecognized: 0
	OpenTypePostScript: 1
	OpenTypeTrueType: 2
	TrueType: 3
	PostScript: 4
	Bitmap: 5
}

export declare const CTFontOrientation: {
	OrientationDefault: 0
	OrientationHorizontal: 1
	OrientationVertical: 2
	DefaultOrientation: 0
	HorizontalOrientation: 1
	VerticalOrientation: 2
}

export declare const CTFontSymbolicTraits: {
	TraitItalic: 1
	TraitBold: 2
	TraitExpanded: 32
	TraitCondensed: 64
	TraitMonoSpace: 1024
	TraitVertical: 2048
	TraitUIOptimized: 4096
	TraitColorGlyphs: 8192
	TraitComposite: 16384
	TraitClassMask: -268435456
	ItalicTrait: 1
	BoldTrait: 2
	ExpandedTrait: 32
	CondensedTrait: 64
	MonoSpaceTrait: 1024
	VerticalTrait: 2048
	UIOptimizedTrait: 4096
	ColorGlyphsTrait: 8192
	CompositeTrait: 16384
	ClassMaskTrait: -268435456
}

export declare const CTFontTableOptions: {
	NoOptions: 0
	ExcludeSynthetic: 1
}

export declare const CTLineBreakMode: {
	WordWrapping: 0
	CharWrapping: 1
	Clipping: 2
	TruncatingHead: 3
	TruncatingTail: 4
	TruncatingMiddle: 5
}

export declare const CTUnderlineStyleModifiers: {
	Solid: 0
	Dot: 256
	Dash: 512
	DashDot: 768
	DashDotDot: 1024
}

export declare const CTFontStylisticClass: {
	ClassUnknown: 0
	ClassOldStyleSerifs: 268435456
	ClassTransitionalSerifs: 536870912
	ClassModernSerifs: 805306368
	ClassClarendonSerifs: 1073741824
	ClassSlabSerifs: 1342177280
	ClassFreeformSerifs: 1879048192
	ClassSansSerif: -2147483648
	ClassOrnamentals: -1879048192
	ClassScripts: -1610612736
	ClassSymbolic: -1073741824
	UnknownClass: 0
	OldStyleSerifsClass: 268435456
	TransitionalSerifsClass: 536870912
	ModernSerifsClass: 805306368
	ClarendonSerifsClass: 1073741824
	SlabSerifsClass: 1342177280
	FreeformSerifsClass: 1879048192
	SansSerifClass: -2147483648
	OrnamentalsClass: -1879048192
	ScriptsClass: -1610612736
	SymbolicClass: -1073741824
}

export declare const CTFontCollectionCopyOptions: {
	DefaultOptions: 0
	Unique: 1
	StandardSort: 2
}

export declare const CTRubyPosition: {
	Before: 0
	After: 1
	InterCharacter: 2
	Inline: 3
	Count: 4
}

export declare const CTRubyOverhang: {
	Invalid: -1
	Auto: 0
	Start: 1
	End: 2
	None: 3
}

export declare const CTRubyAlignment: {
	Invalid: -1
	Auto: 0
	Start: 1
	Center: 2
	End: 3
	DistributeLetter: 4
	DistributeSpace: 5
	LineEdge: 6
}

export declare const CTLineBoundsOptions: {
	ExcludeTypographicLeading: 1
	ExcludeTypographicShifts: 2
	UseHangingPunctuation: 4
	UseGlyphPathBounds: 8
	UseOpticalBounds: 16
	IncludeLanguageExtents: 32
}

export declare const CTCharacterCollection: {
	CharacterCollectionIdentityMapping: 0
	CharacterCollectionAdobeCNS1: 1
	CharacterCollectionAdobeGB1: 2
	CharacterCollectionAdobeJapan1: 3
	CharacterCollectionAdobeJapan2: 4
	CharacterCollectionAdobeKorea1: 5
	IdentityMappingCharacterCollection: 0
	AdobeCNS1CharacterCollection: 1
	AdobeGB1CharacterCollection: 2
	AdobeJapan1CharacterCollection: 3
	AdobeJapan2CharacterCollection: 4
	AdobeKorea1CharacterCollection: 5
}

export declare const CTFontUIFontType: {
	UIFontNone: -1
	UIFontUser: 0
	UIFontUserFixedPitch: 1
	UIFontSystem: 2
	UIFontEmphasizedSystem: 3
	UIFontSmallSystem: 4
	UIFontSmallEmphasizedSystem: 5
	UIFontMiniSystem: 6
	UIFontMiniEmphasizedSystem: 7
	UIFontViews: 8
	UIFontApplication: 9
	UIFontLabel: 10
	UIFontMenuTitle: 11
	UIFontMenuItem: 12
	UIFontMenuItemMark: 13
	UIFontMenuItemCmdKey: 14
	UIFontWindowTitle: 15
	UIFontPushButton: 16
	UIFontUtilityWindowTitle: 17
	UIFontAlertHeader: 18
	UIFontSystemDetail: 19
	UIFontEmphasizedSystemDetail: 20
	UIFontToolbar: 21
	UIFontSmallToolbar: 22
	UIFontMessage: 23
	UIFontPalette: 24
	UIFontToolTip: 25
	UIFontControlContent: 26
	NoFontType: -1
	UserFontType: 0
	UserFixedPitchFontType: 1
	SystemFontType: 2
	EmphasizedSystemFontType: 3
	SmallSystemFontType: 4
	SmallEmphasizedSystemFontType: 5
	MiniSystemFontType: 6
	MiniEmphasizedSystemFontType: 7
	ViewsFontType: 8
	ApplicationFontType: 9
	LabelFontType: 10
	MenuTitleFontType: 11
	MenuItemFontType: 12
	MenuItemMarkFontType: 13
	MenuItemCmdKeyFontType: 14
	WindowTitleFontType: 15
	PushButtonFontType: 16
	UtilityWindowTitleFontType: 17
	AlertHeaderFontType: 18
	SystemDetailFontType: 19
	EmphasizedSystemDetailFontType: 20
	ToolbarFontType: 21
	SmallToolbarFontType: 22
	MessageFontType: 23
	PaletteFontType: 24
	ToolTipFontType: 25
	ControlContentFontType: 26
}

export declare class MortSubtable {
	constructor(init?: MortSubtable)
	length: number
	coverage: number
	flags: number
	u: MortSpecificSubtable
}

export declare class MortSwashSubtable {
	constructor(init?: MortSwashSubtable)
	lookup: SFNTLookupTable
}

export declare class STXHeader {
	constructor(init?: STXHeader)
	nClasses: number
	classTableOffset: number
	stateArrayOffset: number
	entryTableOffset: number
}

export declare class KernKerningPair {
	constructor(init?: KernKerningPair)
	left: number
	right: number
}

export declare class AnchorPointTable {
	constructor(init?: AnchorPointTable)
	nPoints: number
	points: unknown /* const array */
}

export declare class KerxAnchorPointAction {
	constructor(init?: KerxAnchorPointAction)
	markAnchorPoint: number
	currAnchorPoint: number
}

export declare class KerxSimpleArrayHeader {
	constructor(init?: KerxSimpleArrayHeader)
	rowWidth: number
	leftOffsetTable: number
	rightOffsetTable: number
	theArray: number
	firstTable: unknown /* const array */
}

export declare class STXEntryTwo {
	constructor(init?: STXEntryTwo)
	newState: number
	flags: number
	index1: number
	index2: number
}

export declare class KerxSubtableHeader {
	constructor(init?: KerxSubtableHeader)
	length: number
	stInfo: number
	tupleCount: number
	fsHeader: KerxFormatSpecificHeader
}

export declare class __CTParagraphStyle {
	constructor(init?: __CTParagraphStyle)
}

export declare class STEntryZero {
	constructor(init?: STEntryZero)
	newState: number
	flags: number
}

export declare class sfntFontFeatureSetting {
	constructor(init?: sfntFontFeatureSetting)
	setting: number
	nameID: number
}

export declare class __CTTextTab {
	constructor(init?: __CTTextTab)
}

export declare class CTRunDelegateCallbacks {
	constructor(init?: CTRunDelegateCallbacks)
	version: number
	dealloc: (p1: interop.PointerConvertible) => void | null
	getAscent: (p1: interop.PointerConvertible) => number | null
	getDescent: (p1: interop.PointerConvertible) => number | null
	getWidth: (p1: interop.PointerConvertible) => number | null
}

export declare class __CTRunDelegate {
	constructor(init?: __CTRunDelegate)
}

export declare class __CTRun {
	constructor(init?: __CTRun)
}

export declare class CTParagraphStyleSetting {
	constructor(init?: CTParagraphStyleSetting)
	spec: interop.Enum<typeof CTParagraphStyleSpecifier>
	valueSize: number
	value: interop.Pointer
}

export declare class __CTGlyphInfo {
	constructor(init?: __CTGlyphInfo)
}

export declare class __CTTypesetter {
	constructor(init?: __CTTypesetter)
}

export declare class __CTFrame {
	constructor(init?: __CTFrame)
}

export declare class __CTFontCollection {
	constructor(init?: __CTFontCollection)
}

export declare class __CTFont {
	constructor(init?: __CTFont)
}

export declare class __CTFontDescriptor {
	constructor(init?: __CTFontDescriptor)
}

export declare class PropTable {
	constructor(init?: PropTable)
	version: number
	format: number
	defaultProps: number
	lookup: SFNTLookupTable
}

export declare class FontVariation {
	constructor(init?: FontVariation)
	name: number
	value: number
}

export declare class sfntFeatureHeader {
	constructor(init?: sfntFeatureHeader)
	version: number
	featureNameCount: number
	featureSetCount: number
	reserved: number
	names: unknown /* const array */
	settings: unknown /* const array */
	runs: unknown /* const array */
}

export declare class sfntFeatureName {
	constructor(init?: sfntFeatureName)
	featureType: number
	settingCount: number
	offsetToSettings: number
	featureFlags: number
	nameID: number
}

export declare class sfntDescriptorHeader {
	constructor(init?: sfntDescriptorHeader)
	version: number
	descriptorCount: number
	descriptor: unknown /* const array */
}

export declare class sfntFontDescriptor {
	constructor(init?: sfntFontDescriptor)
	name: number
	value: number
}

export declare class sfntVariationHeader {
	constructor(init?: sfntVariationHeader)
	version: number
	offsetToData: number
	countSizePairs: number
	axisCount: number
	axisSize: number
	instanceCount: number
	instanceSize: number
	axis: unknown /* const array */
	instance: unknown /* const array */
}

export declare class sfntVariationAxis {
	constructor(init?: sfntVariationAxis)
	axisTag: number
	minValue: number
	defaultValue: number
	maxValue: number
	flags: number
	nameID: number
}

export declare class sfntNameHeader {
	constructor(init?: sfntNameHeader)
	format: number
	count: number
	stringOffset: number
	rec: unknown /* const array */
}

export declare class sfntCMapHeader {
	constructor(init?: sfntCMapHeader)
	version: number
	numTables: number
	encoding: unknown /* const array */
}

export declare class sfntCMapEncoding {
	constructor(init?: sfntCMapEncoding)
	platformID: number
	scriptID: number
	offset: number
}

export declare class sfntCMapExtendedSubHeader {
	constructor(init?: sfntCMapExtendedSubHeader)
	format: number
	reserved: number
	length: number
	language: number
}

export declare class sfntCMapSubHeader {
	constructor(init?: sfntCMapSubHeader)
	format: number
	length: number
	languageID: number
}

export declare class KerxControlPointAction {
	constructor(init?: KerxControlPointAction)
	markControlPoint: number
	currControlPoint: number
}

export declare class sfntDirectory {
	constructor(init?: sfntDirectory)
	format: number
	numOffsets: number
	searchRange: number
	entrySelector: number
	rangeShift: number
	table: unknown /* const array */
}

export declare class sfntDirectoryEntry {
	constructor(init?: sfntDirectoryEntry)
	tableTag: number
	checkSum: number
	offset: number
	length: number
}

export declare class LtagTable {
	constructor(init?: LtagTable)
	version: number
	flags: number
	numTags: number
	tagRange: unknown /* const array */
}

export declare class LtagStringRange {
	constructor(init?: LtagStringRange)
	offset: number
	length: number
}

export declare class AnkrTable {
	constructor(init?: AnkrTable)
	version: number
	flags: number
	lookupTableOffset: number
	anchorPointTableOffset: number
}

export declare class AnchorPoint {
	constructor(init?: AnchorPoint)
	x: number
	y: number
}

export declare class sfntInstance {
	constructor(init?: sfntInstance)
	nameID: number
	flags: number
	coord: unknown /* const array */
}

export declare class ALMXGlyphEntry {
	constructor(init?: ALMXGlyphEntry)
	GlyphIndexOffset: number
	HorizontalAdvance: number
	XOffsetToHOrigin: number
	VerticalAdvance: number
	YOffsetToVOrigin: number
}

export declare class BslnFormat1Part {
	constructor(init?: BslnFormat1Part)
	deltas: unknown /* const array */
	mappingData: SFNTLookupTable
}

export declare class BslnFormat0Part {
	constructor(init?: BslnFormat0Part)
	deltas: unknown /* const array */
}

export declare class KerxIndexArrayHeader {
	constructor(init?: KerxIndexArrayHeader)
	flags: number
	rowCount: number
	columnCount: number
	rowIndexTableOffset: number
	columnIndexTableOffset: number
	kerningArrayOffset: number
	kerningVectorOffset: number
}

export declare class KerxControlPointEntry {
	constructor(init?: KerxControlPointEntry)
	newState: number
	flags: number
	actionIndex: number
}

export declare class KerxOrderedListEntry {
	constructor(init?: KerxOrderedListEntry)
	pair: KerxKerningPair
	value: number
}

export declare class KernOffsetTable {
	constructor(init?: KernOffsetTable)
	firstGlyph: number
	nGlyphs: number
	offsetTable: unknown /* const array */
}

export declare class KerxKerningPair {
	constructor(init?: KerxKerningPair)
	left: number
	right: number
}

export declare class KernSubtableHeader {
	constructor(init?: KernSubtableHeader)
	length: number
	stInfo: number
	tupleIndex: number
	fsHeader: KernFormatSpecificHeader
}

export declare class KernSimpleArrayHeader {
	constructor(init?: KernSimpleArrayHeader)
	rowWidth: number
	leftOffsetTable: number
	rightOffsetTable: number
	theArray: number
	firstTable: unknown /* const array */
}

export declare class KernStateHeader {
	constructor(init?: KernStateHeader)
	header: STHeader
	valueTable: number
	firstTable: unknown /* const array */
}

export declare class KernTableHeader {
	constructor(init?: KernTableHeader)
	version: number
	nTables: number
	firstSubtable: unknown /* const array */
}

export declare class TrakTableData {
	constructor(init?: TrakTableData)
	nTracks: number
	nSizes: number
	sizeTableOffset: number
	trakTable: unknown /* const array */
}

export declare class PropLookupSegment {
	constructor(init?: PropLookupSegment)
	lastGlyph: number
	firstGlyph: number
	value: number
}

export declare class MorxLigatureSubtable {
	constructor(init?: MorxLigatureSubtable)
	header: STXHeader
	ligatureActionTableOffset: number
	componentTableOffset: number
	ligatureTableOffset: number
}

export declare class BslnFormat3Part {
	constructor(init?: BslnFormat3Part)
	stdGlyph: number
	ctlPoints: unknown /* const array */
	mappingData: SFNTLookupTable
}

export declare class KerxOrderedListHeader {
	constructor(init?: KerxOrderedListHeader)
	nPairs: number
	searchRange: number
	entrySelector: number
	rangeShift: number
	table: unknown /* const array */
}

export declare class MortInsertionSubtable {
	constructor(init?: MortInsertionSubtable)
	header: STHeader
}

export declare class MortContextualSubtable {
	constructor(init?: MortContextualSubtable)
	header: STHeader
	substitutionTableOffset: number
}

export declare class JustWidthDeltaGroup {
	constructor(init?: JustWidthDeltaGroup)
	count: number
	entries: unknown /* const array */
}

export declare class JustWidthDeltaEntry {
	constructor(init?: JustWidthDeltaEntry)
	justClass: number
	beforeGrowLimit: number
	beforeShrinkLimit: number
	afterGrowLimit: number
	afterShrinkLimit: number
	growFlags: number
	shrinkFlags: number
}

export declare class JustPCDuctilityAction {
	constructor(init?: JustPCDuctilityAction)
	ductilityAxis: number
	minimumLimit: number
	noStretchValue: number
	maximumLimit: number
}

export declare class LcarCaretClassEntry {
	constructor(init?: LcarCaretClassEntry)
	count: number
	partials: unknown /* const array */
}

export declare class STXEntryZero {
	constructor(init?: STXEntryZero)
	newState: number
	flags: number
}

export declare class STHeader {
	constructor(init?: STHeader)
	filler: number
	nClasses: number
	classTableOffset: number
	stateArrayOffset: number
	entryTableOffset: number
}

export declare class SFNTLookupSingleHeader {
	constructor(init?: SFNTLookupSingleHeader)
	binSearch: SFNTLookupBinarySearchHeader
	entries: unknown /* const array */
}

export declare class SFNTLookupSegment {
	constructor(init?: SFNTLookupSegment)
	lastGlyph: number
	firstGlyph: number
	value: unknown /* const array */
}

export declare class SFNTLookupVectorHeader {
	constructor(init?: SFNTLookupVectorHeader)
	valueSize: number
	firstGlyph: number
	count: number
	values: unknown /* const array */
}

export declare class SFNTLookupTrimmedArrayHeader {
	constructor(init?: SFNTLookupTrimmedArrayHeader)
	firstGlyph: number
	count: number
	valueArray: unknown /* const array */
}

export declare class SFNTLookupArrayHeader {
	constructor(init?: SFNTLookupArrayHeader)
	lookupValues: unknown /* const array */
}

export declare class STXEntryOne {
	constructor(init?: STXEntryOne)
	newState: number
	flags: number
	index1: number
}

export declare class SFNTLookupTable {
	constructor(init?: SFNTLookupTable)
	format: number
	fsHeader: SFNTLookupFormatSpecificHeader
}

export declare class MorxTable {
	constructor(init?: MorxTable)
	version: number
	nChains: number
	chains: unknown /* const array */
}

export declare class JustPostcompTable {
	constructor(init?: JustPostcompTable)
	lookupTable: SFNTLookupTable
}

export declare class KerxCoordinateAction {
	constructor(init?: KerxCoordinateAction)
	markX: number
	markY: number
	currX: number
	currY: number
}

export declare class PropLookupSingle {
	constructor(init?: PropLookupSingle)
	glyph: number
	props: number
}

export declare class LcarCaretTable {
	constructor(init?: LcarCaretTable)
	version: number
	format: number
	lookup: SFNTLookupTable
}

export declare class MorxInsertionSubtable {
	constructor(init?: MorxInsertionSubtable)
	header: STXHeader
	insertionGlyphTableOffset: number
}

export declare class STEntryOne {
	constructor(init?: STEntryOne)
	newState: number
	flags: number
	offset1: number
}

export declare class JustPCAction {
	constructor(init?: JustPCAction)
	actionCount: number
	actions: unknown /* const array */
}

export declare class SFNTLookupBinarySearchHeader {
	constructor(init?: SFNTLookupBinarySearchHeader)
	unitSize: number
	nUnits: number
	searchRange: number
	entrySelector: number
	rangeShift: number
}

export declare class sfntNameRecord {
	constructor(init?: sfntNameRecord)
	platformID: number
	scriptID: number
	languageID: number
	nameID: number
	length: number
	offset: number
}

export declare class KerxStateHeader {
	constructor(init?: KerxStateHeader)
	header: STXHeader
	valueTable: number
	firstTable: unknown /* const array */
}

export declare class ROTAHeader {
	constructor(init?: ROTAHeader)
	Version: number
	Flags: number
	NMasters: number
	FirstGlyph: number
	LastGlyph: number
	lookup: SFNTLookupTable
}

export declare class JustTable {
	constructor(init?: JustTable)
	version: number
	format: number
	horizHeaderOffset: number
	vertHeaderOffset: number
}

export declare class STEntryTwo {
	constructor(init?: STEntryTwo)
	newState: number
	flags: number
	offset1: number
	offset2: number
}

export declare class BslnTable {
	constructor(init?: BslnTable)
	version: number
	format: number
	defaultBaseline: number
	parts: BslnFormatUnion
}

export declare class OpbdTable {
	constructor(init?: OpbdTable)
	version: number
	format: number
	lookupTable: SFNTLookupTable
}

export declare class MortLigatureSubtable {
	constructor(init?: MortLigatureSubtable)
	header: STHeader
	ligatureActionTableOffset: number
	componentTableOffset: number
	ligatureTableOffset: number
}

export declare class MorxContextualSubtable {
	constructor(init?: MorxContextualSubtable)
	header: STXHeader
	substitutionTableOffset: number
}

export declare class MorxRearrangementSubtable {
	constructor(init?: MorxRearrangementSubtable)
	header: STXHeader
}

export declare class SFNTLookupSegmentHeader {
	constructor(init?: SFNTLookupSegmentHeader)
	binSearch: SFNTLookupBinarySearchHeader
	segments: unknown /* const array */
}

export declare class STClassTable {
	constructor(init?: STClassTable)
	firstGlyph: number
	nGlyphs: number
	classes: unknown /* const array */
}

export declare class KernOrderedListHeader {
	constructor(init?: KernOrderedListHeader)
	nPairs: number
	searchRange: number
	entrySelector: number
	rangeShift: number
	table: unknown /* const array */
}

export declare class JustDirectionTable {
	constructor(init?: JustDirectionTable)
	justClass: number
	widthDeltaClusters: number
	postcomp: number
	lookup: SFNTLookupTable
}

export declare class KernStateEntry {
	constructor(init?: KernStateEntry)
	newState: number
	flags: number
}

export declare class __CTFramesetter {
	constructor(init?: __CTFramesetter)
}

export declare class TrakTable {
	constructor(init?: TrakTable)
	version: number
	format: number
	horizOffset: number
	vertOffset: number
}

export declare class __CTLine {
	constructor(init?: __CTLine)
}

export declare class KernIndexArrayHeader {
	constructor(init?: KernIndexArrayHeader)
	glyphCount: number
	kernValueCount: number
	leftClassCount: number
	rightClassCount: number
	flags: number
	kernValue: unknown /* const array */
	leftClass: unknown /* const array */
	rightClass: unknown /* const array */
	kernIndex: unknown /* const array */
}

export declare class MorxSubtable {
	constructor(init?: MorxSubtable)
	length: number
	coverage: number
	flags: number
	u: MorxSpecificSubtable
}

export declare class KerxStateEntry {
	constructor(init?: KerxStateEntry)
	newState: number
	flags: number
	valueIndex: number
}

export declare class MortTable {
	constructor(init?: MortTable)
	version: number
	nChains: number
	chains: unknown /* const array */
}

export declare class JustPCDecompositionAction {
	constructor(init?: JustPCDecompositionAction)
	lowerLimit: number
	upperLimit: number
	order: number
	count: number
	glyphs: unknown /* const array */
}

export declare class BslnFormat2Part {
	constructor(init?: BslnFormat2Part)
	stdGlyph: number
	ctlPoints: unknown /* const array */
}

export declare class __CTRubyAnnotation {
	constructor(init?: __CTRubyAnnotation)
}

export declare class MorxChain {
	constructor(init?: MorxChain)
	defaultFlags: number
	length: number
	nFeatures: number
	nSubtables: number
	featureEntries: unknown /* const array */
}

export declare class KerxTableHeader {
	constructor(init?: KerxTableHeader)
	version: number
	nTables: number
	firstSubtable: unknown /* const array */
}

export declare class ROTAGlyphEntry {
	constructor(init?: ROTAGlyphEntry)
	GlyphIndexOffset: number
	HBaselineOffset: number
	VBaselineOffset: number
}

export declare class KernVersion0SubtableHeader {
	constructor(init?: KernVersion0SubtableHeader)
	version: number
	length: number
	stInfo: number
	fsHeader: KernFormatSpecificHeader
}

export declare class ALMXHeader {
	constructor(init?: ALMXHeader)
	Version: number
	Flags: number
	NMasters: number
	FirstGlyph: number
	LastGlyph: number
	lookup: SFNTLookupTable
}

export declare class SFNTLookupSingle {
	constructor(init?: SFNTLookupSingle)
	glyph: number
	value: unknown /* const array */
}

export declare class MortRearrangementSubtable {
	constructor(init?: MortRearrangementSubtable)
	header: STHeader
}

export declare class TrakTableEntry {
	constructor(init?: TrakTableEntry)
	track: number
	nameTableIndex: number
	sizesOffset: number
}

export declare class JustPCConditionalAddAction {
	constructor(init?: JustPCConditionalAddAction)
	substThreshold: number
	addGlyph: number
	substGlyph: number
}

export declare class JustPCActionSubrecord {
	constructor(init?: JustPCActionSubrecord)
	theClass: number
	theType: number
	length: number
	data: number
}

export declare class MortChain {
	constructor(init?: MortChain)
	defaultFlags: number
	length: number
	nFeatures: number
	nSubtables: number
	featureEntries: unknown /* const array */
}

export declare class KerxControlPointHeader {
	constructor(init?: KerxControlPointHeader)
	header: STXHeader
	flags: number
	firstTable: unknown /* const array */
}

export declare class OpbdSideValues {
	constructor(init?: OpbdSideValues)
	leftSideShift: number
	topSideShift: number
	rightSideShift: number
	bottomSideShift: number
}

export declare class JustPCGlyphRepeatAddAction {
	constructor(init?: JustPCGlyphRepeatAddAction)
	flags: number
	glyph: number
}

export declare class KernVersion0Header {
	constructor(init?: KernVersion0Header)
	version: number
	nTables: number
	firstSubtable: unknown /* const array */
}

export declare class KernOrderedListEntry {
	constructor(init?: KernOrderedListEntry)
	pair: KernKerningPair
	value: number
}

export declare class MortFeatureEntry {
	constructor(init?: MortFeatureEntry)
	featureType: number
	featureSelector: number
	enableFlags: number
	disableFlags: number
}

export declare class sfntFontRunFeature {
	constructor(init?: sfntFontRunFeature)
	featureType: number
	setting: number
}

export type KerxFormatSpecificHeaderDescriptor =
	| { orderedList: KerxOrderedListHeader }
	| { stateTable: KerxStateHeader }
	| { simpleArray: KerxSimpleArrayHeader }
	| { indexArray: KerxIndexArrayHeader }
	| { controlPoint: KerxControlPointHeader }

export declare class KerxFormatSpecificHeader {
	constructor(init?: KerxFormatSpecificHeaderDescriptor)
	orderedList: KerxOrderedListHeader
	stateTable: KerxStateHeader
	simpleArray: KerxSimpleArrayHeader
	indexArray: KerxIndexArrayHeader
	controlPoint: KerxControlPointHeader
}

export type MortSpecificSubtableDescriptor =
	| { rearrangement: MortRearrangementSubtable }
	| { contextual: MortContextualSubtable }
	| { ligature: MortLigatureSubtable }
	| { swash: MortSwashSubtable }
	| { insertion: MortInsertionSubtable }

export declare class MortSpecificSubtable {
	constructor(init?: MortSpecificSubtableDescriptor)
	rearrangement: MortRearrangementSubtable
	contextual: MortContextualSubtable
	ligature: MortLigatureSubtable
	swash: MortSwashSubtable
	insertion: MortInsertionSubtable
}

export type SFNTLookupFormatSpecificHeaderDescriptor =
	| { theArray: SFNTLookupArrayHeader }
	| { segment: SFNTLookupSegmentHeader }
	| { single: SFNTLookupSingleHeader }
	| { trimmedArray: SFNTLookupTrimmedArrayHeader }
	| { vector: SFNTLookupVectorHeader }

export declare class SFNTLookupFormatSpecificHeader {
	constructor(init?: SFNTLookupFormatSpecificHeaderDescriptor)
	theArray: SFNTLookupArrayHeader
	segment: SFNTLookupSegmentHeader
	single: SFNTLookupSingleHeader
	trimmedArray: SFNTLookupTrimmedArrayHeader
	vector: SFNTLookupVectorHeader
}

export type MorxSpecificSubtableDescriptor =
	| { rearrangement: MorxRearrangementSubtable }
	| { contextual: MorxContextualSubtable }
	| { ligature: MorxLigatureSubtable }
	| { swash: MortSwashSubtable }
	| { insertion: MorxInsertionSubtable }

export declare class MorxSpecificSubtable {
	constructor(init?: MorxSpecificSubtableDescriptor)
	rearrangement: MorxRearrangementSubtable
	contextual: MorxContextualSubtable
	ligature: MorxLigatureSubtable
	swash: MortSwashSubtable
	insertion: MorxInsertionSubtable
}

export type BslnFormatUnionDescriptor =
	| { fmt0Part: BslnFormat0Part }
	| { fmt1Part: BslnFormat1Part }
	| { fmt2Part: BslnFormat2Part }
	| { fmt3Part: BslnFormat3Part }

export declare class BslnFormatUnion {
	constructor(init?: BslnFormatUnionDescriptor)
	fmt0Part: BslnFormat0Part
	fmt1Part: BslnFormat1Part
	fmt2Part: BslnFormat2Part
	fmt3Part: BslnFormat3Part
}

export type KernFormatSpecificHeaderDescriptor =
	| { orderedList: KernOrderedListHeader }
	| { stateTable: KernStateHeader }
	| { simpleArray: KernSimpleArrayHeader }
	| { indexArray: KernIndexArrayHeader }

export declare class KernFormatSpecificHeader {
	constructor(init?: KernFormatSpecificHeaderDescriptor)
	orderedList: KernOrderedListHeader
	stateTable: KernStateHeader
	simpleArray: KernSimpleArrayHeader
	indexArray: KernIndexArrayHeader
}

export declare function CTFontDescriptorGetTypeID(): number

export declare function CTFontDescriptorCreateWithNameAndSize(
	name: interop.Object,
	size: number,
): interop.Object

export declare function CTFontDescriptorCreateWithAttributes(
	attributes: interop.Object,
): interop.Object

export declare function CTFontDescriptorCreateCopyWithAttributes(
	original: interop.Object,
	attributes: interop.Object,
): interop.Object

export declare function CTFontDescriptorCreateCopyWithFamily(
	original: interop.Object,
	family: interop.Object,
): interop.Object

export declare function CTFontDescriptorCreateCopyWithSymbolicTraits(
	original: interop.Object,
	symTraitValue: interop.Enum<typeof CTFontSymbolicTraits>,
	symTraitMask: interop.Enum<typeof CTFontSymbolicTraits>,
): interop.Object

export declare function CTFontDescriptorCreateCopyWithVariation(
	original: interop.Object,
	variationIdentifier: interop.Object,
	variationValue: number,
): interop.Object

export declare function CTFontDescriptorCreateCopyWithFeature(
	original: interop.Object,
	featureTypeIdentifier: interop.Object,
	featureSelectorIdentifier: interop.Object,
): interop.Object

export declare function CTFontDescriptorCreateMatchingFontDescriptors(
	descriptor: interop.Object,
	mandatoryAttributes: interop.Object,
): interop.Object

export declare function CTFontDescriptorCreateMatchingFontDescriptor(
	descriptor: interop.Object,
	mandatoryAttributes: interop.Object,
): interop.Object

export declare function CTFontDescriptorMatchFontDescriptorsWithProgressHandler(
	descriptors: interop.Object,
	mandatoryAttributes: interop.Object,
	progressBlock: (
		p1: interop.Enum<typeof CTFontDescriptorMatchingState>,
		p2: interop.PointerConvertible,
	) => boolean,
): boolean

export declare function CTFontDescriptorCopyAttributes(descriptor: interop.Object): interop.Object

export declare function CTFontDescriptorCopyAttribute(
	descriptor: interop.Object,
	attribute: interop.Object,
): interop.Object

export declare function CTFontDescriptorCopyLocalizedAttribute(
	descriptor: interop.Object,
	attribute: interop.Object,
	language: interop.PointerConvertible,
): interop.Object

export declare function CTFontGetTypeID(): number

export declare function CTFontCreateWithName(
	name: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
): interop.Object

export declare function CTFontCreateWithFontDescriptor(
	descriptor: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
): interop.Object

export declare function CTFontCreateWithNameAndOptions(
	name: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	options: interop.Enum<typeof CTFontOptions>,
): interop.Object

export declare function CTFontCreateWithFontDescriptorAndOptions(
	descriptor: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	options: interop.Enum<typeof CTFontOptions>,
): interop.Object

export declare function CTFontCreateUIFontForLanguage(
	uiType: interop.Enum<typeof CTFontUIFontType>,
	size: number,
	language: interop.Object,
): interop.Object

export declare function CTFontGetUIFontType(
	font: interop.Object,
): interop.Enum<typeof CTFontUIFontType>

export declare function CTFontCreateCopyWithAttributes(
	font: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	attributes: interop.Object,
): interop.Object

export declare function CTFontCreateCopyWithSymbolicTraits(
	font: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	symTraitValue: interop.Enum<typeof CTFontSymbolicTraits>,
	symTraitMask: interop.Enum<typeof CTFontSymbolicTraits>,
): interop.Object

export declare function CTFontCreateCopyWithFamily(
	font: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	family: interop.Object,
): interop.Object

export declare function CTFontCreateForString(
	currentFont: interop.Object,
	string: interop.Object,
	range: CFRange,
): interop.Object

export declare function CTFontCreateForStringWithLanguage(
	currentFont: interop.Object,
	string: interop.Object,
	range: CFRange,
	language: interop.Object,
): interop.Object

export declare function CTFontCopyFontDescriptor(font: interop.Object): interop.Object

export declare function CTFontCopyAttribute(
	font: interop.Object,
	attribute: interop.Object,
): interop.Object

export declare function CTFontGetSize(font: interop.Object): number

export declare function CTFontGetMatrix(font: interop.Object): CGAffineTransform

export declare function CTFontGetSymbolicTraits(
	font: interop.Object,
): interop.Enum<typeof CTFontSymbolicTraits>

export declare function CTFontCopyTraits(font: interop.Object): interop.Object

export declare function CTFontCopyDefaultCascadeListForLanguages(
	font: interop.Object,
	languagePrefList: interop.Object,
): interop.Object

export declare function CTFontCopyPostScriptName(font: interop.Object): interop.Object

export declare function CTFontCopyFamilyName(font: interop.Object): interop.Object

export declare function CTFontCopyFullName(font: interop.Object): interop.Object

export declare function CTFontCopyDisplayName(font: interop.Object): interop.Object

export declare function CTFontCopyName(
	font: interop.Object,
	nameKey: interop.Object,
): interop.Object

export declare function CTFontCopyLocalizedName(
	font: interop.Object,
	nameKey: interop.Object,
	actualLanguage: interop.PointerConvertible,
): interop.Object

export declare function CTFontCopyCharacterSet(font: interop.Object): interop.Object

export declare function CTFontGetStringEncoding(font: interop.Object): number

export declare function CTFontCopySupportedLanguages(font: interop.Object): interop.Object

export declare function CTFontGetGlyphsForCharacters(
	font: interop.Object,
	characters: interop.PointerConvertible,
	glyphs: interop.PointerConvertible,
	count: number,
): boolean

export declare function CTFontGetAscent(font: interop.Object): number

export declare function CTFontGetDescent(font: interop.Object): number

export declare function CTFontGetLeading(font: interop.Object): number

export declare function CTFontGetUnitsPerEm(font: interop.Object): number

export declare function CTFontGetGlyphCount(font: interop.Object): number

export declare function CTFontGetBoundingBox(font: interop.Object): CGRect

export declare function CTFontGetUnderlinePosition(font: interop.Object): number

export declare function CTFontGetUnderlineThickness(font: interop.Object): number

export declare function CTFontGetSlantAngle(font: interop.Object): number

export declare function CTFontGetCapHeight(font: interop.Object): number

export declare function CTFontGetXHeight(font: interop.Object): number

export declare function CTFontGetGlyphWithName(
	font: interop.Object,
	glyphName: interop.Object,
): number

export declare function CTFontCopyNameForGlyph(font: interop.Object, glyph: number): interop.Object

export declare function CTFontGetBoundingRectsForGlyphs(
	font: interop.Object,
	orientation: interop.Enum<typeof CTFontOrientation>,
	glyphs: interop.PointerConvertible,
	boundingRects: interop.PointerConvertible,
	count: number,
): CGRect

export declare function CTFontGetOpticalBoundsForGlyphs(
	font: interop.Object,
	glyphs: interop.PointerConvertible,
	boundingRects: interop.PointerConvertible,
	count: number,
	options: number,
): CGRect

export declare function CTFontGetAdvancesForGlyphs(
	font: interop.Object,
	orientation: interop.Enum<typeof CTFontOrientation>,
	glyphs: interop.PointerConvertible,
	advances: interop.PointerConvertible,
	count: number,
): number

export declare function CTFontGetVerticalTranslationsForGlyphs(
	font: interop.Object,
	glyphs: interop.PointerConvertible,
	translations: interop.PointerConvertible,
	count: number,
): void

export declare function CTFontCreatePathForGlyph(
	font: interop.Object,
	glyph: number,
	matrix: interop.PointerConvertible,
): interop.Object

export declare function CTFontCopyVariationAxes(font: interop.Object): interop.Object

export declare function CTFontCopyVariation(font: interop.Object): interop.Object

export declare function CTFontCopyFeatures(font: interop.Object): interop.Object

export declare function CTFontCopyFeatureSettings(font: interop.Object): interop.Object

export declare function CTFontCopyGraphicsFont(
	font: interop.Object,
	attributes: interop.PointerConvertible,
): interop.Object

export declare function CTFontCreateWithGraphicsFont(
	graphicsFont: interop.Object,
	size: number,
	matrix: interop.PointerConvertible,
	attributes: interop.Object,
): interop.Object

export declare function CTFontGetPlatformFont(
	font: interop.Object,
	attributes: interop.PointerConvertible,
): number

export declare function CTFontCreateWithPlatformFont(
	platformFont: number,
	size: number,
	matrix: interop.PointerConvertible,
	attributes: interop.Object,
): interop.Object

export declare function CTFontCreateWithQuickdrawInstance(
	name: interop.PointerConvertible,
	identifier: number,
	style: number,
	size: number,
): interop.Object

export declare function CTFontCopyAvailableTables(
	font: interop.Object,
	options: interop.Enum<typeof CTFontTableOptions>,
): interop.Object

export declare function CTFontHasTable(font: interop.Object, tag: number): boolean

export declare function CTFontCopyTable(
	font: interop.Object,
	table: number,
	options: interop.Enum<typeof CTFontTableOptions>,
): interop.Object

export declare function CTFontDrawGlyphs(
	font: interop.Object,
	glyphs: interop.PointerConvertible,
	positions: interop.PointerConvertible,
	count: number,
	context: interop.Object,
): void

export declare function CTFontGetLigatureCaretPositions(
	font: interop.Object,
	glyph: number,
	positions: interop.PointerConvertible,
	maxPositions: number,
): number

export declare function CTFontCollectionGetTypeID(): number

export declare function CTFontCollectionCreateFromAvailableFonts(
	options: interop.Object,
): interop.Object

export declare function CTFontCollectionCreateWithFontDescriptors(
	queryDescriptors: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CTFontCollectionCreateCopyWithFontDescriptors(
	original: interop.Object,
	queryDescriptors: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CTFontCollectionCreateMutableCopy(original: interop.Object): interop.Object

export declare function CTFontCollectionCopyQueryDescriptors(
	collection: interop.Object,
): interop.Object

export declare function CTFontCollectionSetQueryDescriptors(
	collection: interop.Object,
	descriptors: interop.Object,
): void

export declare function CTFontCollectionCopyExclusionDescriptors(
	collection: interop.Object,
): interop.Object

export declare function CTFontCollectionSetExclusionDescriptors(
	collection: interop.Object,
	descriptors: interop.Object,
): void

export declare function CTFontCollectionCreateMatchingFontDescriptors(
	collection: interop.Object,
): interop.Object

export declare function CTFontCollectionCreateMatchingFontDescriptorsSortedWithCallback(
	collection: interop.Object,
	sortCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => interop.Enum<typeof CFComparisonResult>,
	refCon: interop.PointerConvertible,
): interop.Object

export declare function CTFontCollectionCreateMatchingFontDescriptorsWithOptions(
	collection: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CTFontCollectionCreateMatchingFontDescriptorsForFamily(
	collection: interop.Object,
	familyName: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CTFontCollectionCopyFontAttribute(
	collection: interop.Object,
	attributeName: interop.Object,
	options: interop.Enum<typeof CTFontCollectionCopyOptions>,
): interop.Object

export declare function CTFontCollectionCopyFontAttributes(
	collection: interop.Object,
	attributeNames: interop.Object,
	options: interop.Enum<typeof CTFontCollectionCopyOptions>,
): interop.Object

export declare function CTFontManagerCopyAvailablePostScriptNames(): interop.Object

export declare function CTFontManagerCopyAvailableFontFamilyNames(): interop.Object

export declare function CTFontManagerCopyAvailableFontURLs(): interop.Object

export declare function CTFontManagerCompareFontFamilyNames(
	family1: interop.PointerConvertible,
	family2: interop.PointerConvertible,
	context: interop.PointerConvertible,
): interop.Enum<typeof CFComparisonResult>

export declare function CTFontManagerCreateFontDescriptorsFromURL(
	fileURL: interop.Object,
): interop.Object

export declare function CTFontManagerCreateFontDescriptorFromData(
	data: interop.Object,
): interop.Object

export declare function CTFontManagerCreateFontDescriptorsFromData(
	data: interop.Object,
): interop.Object

export declare function CTFontManagerRegisterFontsForURL(
	fontURL: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	error: interop.PointerConvertible,
): boolean

export declare function CTFontManagerUnregisterFontsForURL(
	fontURL: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	error: interop.PointerConvertible,
): boolean

export declare function CTFontManagerRegisterGraphicsFont(
	font: interop.Object,
	error: interop.PointerConvertible,
): boolean

export declare function CTFontManagerUnregisterGraphicsFont(
	font: interop.Object,
	error: interop.PointerConvertible,
): boolean

export declare function CTFontManagerRegisterFontsForURLs(
	fontURLs: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	errors: interop.PointerConvertible,
): boolean

export declare function CTFontManagerUnregisterFontsForURLs(
	fontURLs: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	errors: interop.PointerConvertible,
): boolean

export declare function CTFontManagerRegisterFontURLs(
	fontURLs: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	enabled: boolean,
	registrationHandler: (p1: interop.PointerConvertible, p2: boolean) => boolean,
): void

export declare function CTFontManagerUnregisterFontURLs(
	fontURLs: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	registrationHandler: (p1: interop.PointerConvertible, p2: boolean) => boolean,
): void

export declare function CTFontManagerRegisterFontDescriptors(
	fontDescriptors: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	enabled: boolean,
	registrationHandler: (p1: interop.PointerConvertible, p2: boolean) => boolean,
): void

export declare function CTFontManagerUnregisterFontDescriptors(
	fontDescriptors: interop.Object,
	scope: interop.Enum<typeof CTFontManagerScope>,
	registrationHandler: (p1: interop.PointerConvertible, p2: boolean) => boolean,
): void

export declare function CTFontManagerEnableFontDescriptors(
	descriptors: interop.Object,
	enable: boolean,
): void

export declare function CTFontManagerGetScopeForURL(
	fontURL: interop.Object,
): interop.Enum<typeof CTFontManagerScope>

export declare function CTFontManagerIsSupportedFont(fontURL: interop.Object): boolean

export declare function CTFontManagerCreateFontRequestRunLoopSource(
	sourceOrder: number,
	createMatchesCallback: (p1: interop.PointerConvertible, p2: number) => interop.Pointer,
): interop.Object

export declare function CTFontManagerSetAutoActivationSetting(
	bundleIdentifier: interop.Object,
	setting: interop.Enum<typeof CTFontManagerAutoActivationSetting>,
): void

export declare function CTFontManagerGetAutoActivationSetting(
	bundleIdentifier: interop.Object,
): interop.Enum<typeof CTFontManagerAutoActivationSetting>

export declare function CTFrameGetTypeID(): number

export declare function CTFrameGetStringRange(frame: interop.Object): CFRange

export declare function CTFrameGetVisibleStringRange(frame: interop.Object): CFRange

export declare function CTFrameGetPath(frame: interop.Object): interop.Object

export declare function CTFrameGetFrameAttributes(frame: interop.Object): interop.Object

export declare function CTFrameGetLines(frame: interop.Object): interop.Object

export declare function CTFrameGetLineOrigins(
	frame: interop.Object,
	range: CFRange,
	origins: interop.PointerConvertible,
): void

export declare function CTFrameDraw(frame: interop.Object, context: interop.Object): void

export declare function CTLineGetTypeID(): number

export declare function CTLineCreateWithAttributedString(attrString: interop.Object): interop.Object

export declare function CTLineCreateTruncatedLine(
	line: interop.Object,
	width: number,
	truncationType: interop.Enum<typeof CTLineTruncationType>,
	truncationToken: interop.Object,
): interop.Object

export declare function CTLineCreateJustifiedLine(
	line: interop.Object,
	justificationFactor: number,
	justificationWidth: number,
): interop.Object

export declare function CTLineGetGlyphCount(line: interop.Object): number

export declare function CTLineGetGlyphRuns(line: interop.Object): interop.Object

export declare function CTLineGetStringRange(line: interop.Object): CFRange

export declare function CTLineGetPenOffsetForFlush(
	line: interop.Object,
	flushFactor: number,
	flushWidth: number,
): number

export declare function CTLineDraw(line: interop.Object, context: interop.Object): void

export declare function CTLineGetTypographicBounds(
	line: interop.Object,
	ascent: interop.PointerConvertible,
	descent: interop.PointerConvertible,
	leading: interop.PointerConvertible,
): number

export declare function CTLineGetBoundsWithOptions(
	line: interop.Object,
	options: interop.Enum<typeof CTLineBoundsOptions>,
): CGRect

export declare function CTLineGetTrailingWhitespaceWidth(line: interop.Object): number

export declare function CTLineGetImageBounds(line: interop.Object, context: interop.Object): CGRect

export declare function CTLineGetStringIndexForPosition(
	line: interop.Object,
	position: CGPoint,
): number

export declare function CTLineGetOffsetForStringIndex(
	line: interop.Object,
	charIndex: number,
	secondaryOffset: interop.PointerConvertible,
): number

export declare function CTLineEnumerateCaretOffsets(
	line: interop.Object,
	block: (p1: number, p2: number, p3: boolean, p4: interop.PointerConvertible) => void,
): void

export declare function CTTypesetterGetTypeID(): number

export declare function CTTypesetterCreateWithAttributedString(
	string: interop.Object,
): interop.Object

export declare function CTTypesetterCreateWithAttributedStringAndOptions(
	string: interop.Object,
	options: interop.Object,
): interop.Object

export declare function CTTypesetterCreateLineWithOffset(
	typesetter: interop.Object,
	stringRange: CFRange,
	offset: number,
): interop.Object

export declare function CTTypesetterCreateLine(
	typesetter: interop.Object,
	stringRange: CFRange,
): interop.Object

export declare function CTTypesetterSuggestLineBreakWithOffset(
	typesetter: interop.Object,
	startIndex: number,
	width: number,
	offset: number,
): number

export declare function CTTypesetterSuggestLineBreak(
	typesetter: interop.Object,
	startIndex: number,
	width: number,
): number

export declare function CTTypesetterSuggestClusterBreakWithOffset(
	typesetter: interop.Object,
	startIndex: number,
	width: number,
	offset: number,
): number

export declare function CTTypesetterSuggestClusterBreak(
	typesetter: interop.Object,
	startIndex: number,
	width: number,
): number

export declare function CTFramesetterGetTypeID(): number

export declare function CTFramesetterCreateWithTypesetter(
	typesetter: interop.Object,
): interop.Object

export declare function CTFramesetterCreateWithAttributedString(
	attrString: interop.Object,
): interop.Object

export declare function CTFramesetterCreateFrame(
	framesetter: interop.Object,
	stringRange: CFRange,
	path: interop.Object,
	frameAttributes: interop.Object,
): interop.Object

export declare function CTFramesetterGetTypesetter(framesetter: interop.Object): interop.Object

export declare function CTFramesetterSuggestFrameSizeWithConstraints(
	framesetter: interop.Object,
	stringRange: CFRange,
	frameAttributes: interop.Object,
	constraints: CGSize,
	fitRange: interop.PointerConvertible,
): CGSize

export declare function CTGlyphInfoGetTypeID(): number

export declare function CTGlyphInfoCreateWithGlyphName(
	glyphName: interop.Object,
	font: interop.Object,
	baseString: interop.Object,
): interop.Object

export declare function CTGlyphInfoCreateWithGlyph(
	glyph: number,
	font: interop.Object,
	baseString: interop.Object,
): interop.Object

export declare function CTGlyphInfoCreateWithCharacterIdentifier(
	cid: number,
	collection: interop.Enum<typeof CTCharacterCollection>,
	baseString: interop.Object,
): interop.Object

export declare function CTGlyphInfoGetGlyphName(glyphInfo: interop.Object): interop.Object

export declare function CTGlyphInfoGetGlyph(glyphInfo: interop.Object): number

export declare function CTGlyphInfoGetCharacterIdentifier(glyphInfo: interop.Object): number

export declare function CTGlyphInfoGetCharacterCollection(
	glyphInfo: interop.Object,
): interop.Enum<typeof CTCharacterCollection>

export declare function CTParagraphStyleGetTypeID(): number

export declare function CTParagraphStyleCreate(
	settings: interop.PointerConvertible,
	settingCount: number,
): interop.Object

export declare function CTParagraphStyleCreateCopy(paragraphStyle: interop.Object): interop.Object

export declare function CTParagraphStyleGetValueForSpecifier(
	paragraphStyle: interop.Object,
	spec: interop.Enum<typeof CTParagraphStyleSpecifier>,
	valueBufferSize: number,
	valueBuffer: interop.PointerConvertible,
): boolean

export declare function CTRubyAnnotationGetTypeID(): number

export declare function CTRubyAnnotationCreate(
	alignment: interop.Enum<typeof CTRubyAlignment>,
	overhang: interop.Enum<typeof CTRubyOverhang>,
	sizeFactor: number,
	text: interop.PointerConvertible,
): interop.Object

export declare function CTRubyAnnotationCreateWithAttributes(
	alignment: interop.Enum<typeof CTRubyAlignment>,
	overhang: interop.Enum<typeof CTRubyOverhang>,
	position: interop.Enum<typeof CTRubyPosition>,
	string: interop.Object,
	attributes: interop.Object,
): interop.Object

export declare function CTRubyAnnotationCreateCopy(rubyAnnotation: interop.Object): interop.Object

export declare function CTRubyAnnotationGetAlignment(
	rubyAnnotation: interop.Object,
): interop.Enum<typeof CTRubyAlignment>

export declare function CTRubyAnnotationGetOverhang(
	rubyAnnotation: interop.Object,
): interop.Enum<typeof CTRubyOverhang>

export declare function CTRubyAnnotationGetSizeFactor(rubyAnnotation: interop.Object): number

export declare function CTRubyAnnotationGetTextForPosition(
	rubyAnnotation: interop.Object,
	position: interop.Enum<typeof CTRubyPosition>,
): interop.Object

export declare function CTRunGetTypeID(): number

export declare function CTRunGetGlyphCount(run: interop.Object): number

export declare function CTRunGetAttributes(run: interop.Object): interop.Object

export declare function CTRunGetStatus(run: interop.Object): interop.Enum<typeof CTRunStatus>

export declare function CTRunGetGlyphsPtr(run: interop.Object): interop.Pointer

export declare function CTRunGetGlyphs(
	run: interop.Object,
	range: CFRange,
	buffer: interop.PointerConvertible,
): void

export declare function CTRunGetPositionsPtr(run: interop.Object): interop.Pointer

export declare function CTRunGetPositions(
	run: interop.Object,
	range: CFRange,
	buffer: interop.PointerConvertible,
): void

export declare function CTRunGetAdvancesPtr(run: interop.Object): interop.Pointer

export declare function CTRunGetAdvances(
	run: interop.Object,
	range: CFRange,
	buffer: interop.PointerConvertible,
): void

export declare function CTRunGetStringIndicesPtr(run: interop.Object): interop.Pointer

export declare function CTRunGetStringIndices(
	run: interop.Object,
	range: CFRange,
	buffer: interop.PointerConvertible,
): void

export declare function CTRunGetStringRange(run: interop.Object): CFRange

export declare function CTRunGetTypographicBounds(
	run: interop.Object,
	range: CFRange,
	ascent: interop.PointerConvertible,
	descent: interop.PointerConvertible,
	leading: interop.PointerConvertible,
): number

export declare function CTRunGetImageBounds(
	run: interop.Object,
	context: interop.Object,
	range: CFRange,
): CGRect

export declare function CTRunGetTextMatrix(run: interop.Object): CGAffineTransform

export declare function CTRunGetBaseAdvancesAndOrigins(
	runRef: interop.Object,
	range: CFRange,
	advancesBuffer: interop.PointerConvertible,
	originsBuffer: interop.PointerConvertible,
): void

export declare function CTRunDraw(
	run: interop.Object,
	context: interop.Object,
	range: CFRange,
): void

export declare function CTRunDelegateGetTypeID(): number

export declare function CTRunDelegateCreate(
	callbacks: interop.PointerConvertible,
	refCon: interop.PointerConvertible,
): interop.Object

export declare function CTRunDelegateGetRefCon(runDelegate: interop.Object): interop.Pointer

export declare function CTTextTabGetTypeID(): number

export declare function CTTextTabCreate(
	alignment: interop.Enum<typeof CTTextAlignment>,
	location: number,
	options: interop.Object,
): interop.Object

export declare function CTTextTabGetAlignment(
	tab: interop.Object,
): interop.Enum<typeof CTTextAlignment>

export declare function CTTextTabGetLocation(tab: interop.Object): number

export declare function CTTextTabGetOptions(tab: interop.Object): interop.Object

export declare function CTGetCoreTextVersion(): number

export declare interface CTAdaptiveImageProviding {
	imageForProposedSizeScaleFactorImageOffsetImageSize(
		proposedSize: CGSize,
		scaleFactor: number,
		outImageOffset: interop.PointerConvertible,
		outImageSize: interop.PointerConvertible,
	): interop.Object | null
}

export declare class CTAdaptiveImageProviding
	extends NativeObject
	implements CTAdaptiveImageProviding {}
