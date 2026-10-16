import type {
	NSArray,
	NSAttributedString,
	NSCoder,
	NSCopying,
	NSData,
	NSDateComponents,
	NSDictionary,
	NSError,
	NSItemProviderReading,
	NSItemProviderWriting,
	NSMutableCopying,
	NSPredicate,
	NSProgress,
	NSSecureCoding,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import {
	NSComparisonResult,
	NSFormatter,
	NSItemProviderRepresentationVisibility,
} from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const CNLabelContactRelationGrandmotherMothersMother: string

export declare const CNLabelContactRelationFather: string

export declare const CNContactPhoneticOrganizationNameKey: string

export declare const CNLabelContactRelationCoSiblingInLaw: string

export declare const CNContactImageDataKey: string

export declare const CNLabelContactRelationYoungerCousinMothersSistersDaughter: string

export declare const CNLabelContactRelationChildInLaw: string

export declare const CNLabelContactRelationAuntParentsElderSister: string

export declare const CNErrorUserInfoAffectedRecordIdentifiersKey: string

export declare const CNErrorUserInfoAffectedRecordsKey: string

export declare const CNPostalAddressLocalizedPropertyNameAttribute: string

export declare const CNContainerTypeKey: string

export declare const CNContainerNameKey: string

export declare const CNContainerIdentifierKey: string

export declare const CNGroupIdentifierKey: string

export declare const CNContactStoreDidChangeNotification: string

export declare const CNContactDatesKey: string

export declare const CNContactPostalAddressesKey: string

export declare const CNContactEmailAddressesKey: string

export declare const CNContactPhoneNumbersKey: string

export declare const CNContactTypeKey: string

export declare const CNContactImageDataAvailableKey: string

export declare const CNContactNonGregorianBirthdayKey: string

export declare const CNContactPhoneticFamilyNameKey: string

export declare const CNContactPhoneticMiddleNameKey: string

export declare const CNContactMiddleNameKey: string

export declare const CNContactGivenNameKey: string

export declare const CNContactNamePrefixKey: string

export declare const CNContactIdentifierKey: string

export declare const CNInstantMessageServiceQQ: string

export declare const CNInstantMessageServiceJabber: string

export declare const CNInstantMessageServiceICQ: string

export declare const CNInstantMessageServiceGoogleTalk: string

export declare const CNInstantMessageServiceAIM: string

export declare const CNInstantMessageAddressServiceKey: string

export declare const CNSocialProfileServiceGameCenter: string

export declare const CNSocialProfileServiceYelp: string

export declare const CNSocialProfileServiceTwitter: string

export declare const CNSocialProfileServiceLinkedIn: string

export declare const CNSocialProfileServiceFacebook: string

export declare const CNSocialProfileServiceKey: string

export declare const CNSocialProfileUsernameKey: string

export declare const CNSocialProfileURLStringKey: string

export declare const CNLabelContactRelationGrandsonOrNephew: string

export declare const CNLabelContactRelationNephewOrCousin: string

export declare const CNLabelContactRelationCousinOrSiblingsChild: string

export declare const CNLabelContactRelationSonInLawOrStepson: string

export declare const CNLabelContactRelationStepbrother: string

export declare const CNLabelContactRelationStepfather: string

export declare const CNLabelContactRelationStepmother: string

export declare const CNLabelContactRelationStepparent: string

export declare const CNLabelContactRelationGrandnephewBrothersGrandson: string

export declare const CNLabelContactRelationGrandnephewSistersGrandson: string

export declare const CNLabelContactRelationGrandniece: string

export declare const CNLabelContactRelationNephewSistersSonOrWifesSiblingsSon: string

export declare const CNLabelContactRelationNephewBrothersSon: string

export declare const CNLabelContactRelationNephewSistersSon: string

export declare const CNLabelContactRelationNieceBrothersDaughterOrHusbandsSiblingsDaughter: string

export declare const CNLabelContactRelationNieceSistersDaughter: string

export declare const CNLabelContactRelationSiblingsChild: string

export declare const CNLabelContactRelationUncleMothersYoungerBrother: string

export declare const CNLabelContactRelationUncleParentsYoungerBrother: string

export declare const CNLabelContactRelationGrandaunt: string

export declare const CNLabelContactRelationAuntMothersBrothersWife: string

export declare const CNLabelContactRelationAuntMothersYoungerSister: string

export declare const CNLabelContactRelationAuntFathersElderBrothersWife: string

export declare const CNLabelContactRelationAuntFathersYoungerBrothersWife: string

export declare const CNLabelContactRelationAuntFathersElderSister: string

export declare const CNLabelContactRelationAuntFathersSister: string

export declare const CNLabelContactRelationAuntParentsSister: string

export declare const CNLabelContactRelationParentsSiblingFathersElderSibling: string

export declare const CNLabelContactRelationParentsSiblingFathersSibling: string

export declare const CNLabelContactRelationParentsYoungerSibling: string

export declare const CNLabelContactRelationYoungerCousinMothersSiblingsDaughterOrFathersSistersDaughter: string

export declare const CNLabelContactRelationCousinGrandparentsSiblingsDaughter: string

export declare const CNLabelContactRelationYoungerCousinFathersBrothersSon: string

export declare const CNLabelContactRelationYoungerCousinFathersBrothersDaughter: string

export declare const CNLabelContactRelationCousinFathersSistersSon: string

export declare const CNLabelContactRelationElderCousinFathersSistersDaughter: string

export declare const CNLabelContactRelationYoungerCousinMothersBrothersSon: string

export declare const CNLabelContactRelationElderCousinMothersBrothersDaughter: string

export declare const CNLabelContactRelationYoungerCousinMothersBrothersDaughter: string

export declare const CNLabelContactRelationCousinMothersBrothersDaughter: string

export declare const CNLabelContactRelationYoungerCousinParentsSiblingsDaughter: string

export declare const CNLabelContactRelationCousinParentsSiblingsDaughter: string

export declare const CNLabelContactRelationYoungerCousinParentsSiblingsSon: string

export declare const CNLabelContactRelationFemaleCousin: string

export declare const CNLabelContactRelationMaleCousin: string

export declare const CNLabelContactRelationCoBrotherInLaw: string

export declare const CNLabelContactRelationBrotherInLawWifesSistersHusband: string

export declare const CNLabelContactRelationSisterInLawHusbandsBrothersWife: string

export declare const CNLabelContactRelationBrotherInLawSpousesBrother: string

export declare const CNLabelContactRelationYoungerBrotherInLaw: string

export declare const CNLabelContactRelationBrotherInLaw: string

export declare const CNLabelContactRelationSisterInLawElderBrothersWife: string

export declare const CNLabelContactRelationSisterInLawYoungerBrothersWife: string

export declare const CNLabelContactRelationSisterInLawBrothersWife: string

export declare const CNLabelContactRelationSisterInLawWifesSister: string

export declare const CNLabelContactRelationElderSisterInLaw: string

export declare const CNLabelContactRelationYoungerSiblingInLaw: string

export declare const CNLabelContactRelationCoFatherInLaw: string

export declare const CNLabelContactRelationCoMotherInLaw: string

export declare const CNLabelContactRelationFatherInLaw: string

export declare const CNLabelContactRelationMotherInLawHusbandsMother: string

export declare const CNLabelContactRelationMotherInLawWifesMother: string

export declare const CNLabelContactRelationGrandsonDaughtersSon: string

export declare const CNLabelContactRelationGrandson: string

export declare const CNLabelContactRelationGranddaughterDaughtersDaughter: string

export declare const CNLabelContactRelationGranddaughter: string

export declare const CNLabelContactRelationGreatGrandparent: string

export declare const CNLabelContactRelationGrandfatherMothersFather: string

export declare const CNLabelContactRelationGrandfather: string

export declare const CNLabelContactRelationGrandmotherFathersMother: string

export declare const CNLabelContactRelationGrandparent: string

export declare const CNLabelContactRelationDaughter: string

export declare const CNLabelContactRelationParent: string

export declare const CNLabelContactRelationGirlfriend: string

export declare const CNLabelContactRelationMalePartner: string

export declare const CNLabelContactRelationWife: string

export declare const CNLabelContactRelationElderBrother: string

export declare const CNLabelContactRelationYoungerBrother: string

export declare const CNLabelContactRelationEldestSister: string

export declare const CNLabelContactRelationElderSister: string

export declare const CNLabelContactRelationYoungestSister: string

export declare const CNLabelContactRelationYoungerSibling: string

export declare const CNLabelContactRelationTeacher: string

export declare const CNLabelContactRelationAssistant: string

export declare const CNPostalAddressISOCountryCodeKey: string

export declare const CNPostalAddressCountryKey: string

export declare const CNPostalAddressSubAdministrativeAreaKey: string

export declare const CNPostalAddressCityKey: string

export declare const CNLabelPhoneNumberMain: string

export declare const CNLabelPhoneNumberiPhone: string

export declare const CNLabelDateAnniversary: string

export declare const CNLabelURLAddressHomePage: string

export declare const CNLabelEmailiCloud: string

export declare const CNLabelOther: string

export declare const CNLabelSchool: string

export declare const CNLabelWork: string

export declare const CNLabelHome: string

export declare const CNLabelContactRelationYoungerCousinMothersSiblingsSonOrFathersSistersSon: string

export declare const CNLabelContactRelationGreatGrandmother: string

export declare const CNLabelContactRelationGranduncle: string

export declare const CNLabelContactRelationCousinFathersSistersDaughter: string

export declare const CNLabelContactRelationElderCousinMothersSistersDaughter: string

export declare const CNLabelContactRelationUncleMothersElderBrother: string

export declare const CNLabelContactRelationElderCousinMothersSiblingsSonOrFathersSistersSon: string

export declare const CNLabelContactRelationColleague: string

export declare const CNSocialProfileUserIdentifierKey: string

export declare const CNLabelContactRelationCousinGrandparentsSiblingsSon: string

export declare const CNLabelContactRelationUncle: string

export declare const CNLabelContactRelationUncleFathersYoungerSistersHusband: string

export declare const CNPostalAddressStreetKey: string

export declare const CNLabelContactRelationNieceBrothersDaughter: string

export declare const CNSocialProfileServiceFlickr: string

export declare const CNLabelContactRelationGrandmother: string

export declare const CNLabelContactRelationSonInLaw: string

export declare const CNLabelContactRelationSpouse: string

export declare const CNLabelContactRelationParentsSibling: string

export declare const CNLabelContactRelationElderCousinFathersSistersSon: string

export declare const CNLabelContactRelationNieceSistersDaughterOrWifesSiblingsDaughter: string

export declare const CNLabelContactRelationNephewBrothersSonOrHusbandsSiblingsSon: string

export declare const CNLabelContactRelationBrotherInLawHusbandsSistersHusband: string

export declare const CNLabelContactRelationElderSiblingInLaw: string

export declare const CNLabelContactRelationGreatGrandfather: string

export declare const CNInstantMessageServiceYahoo: string

export declare const CNLabelContactRelationHusband: string

export declare const CNLabelContactRelationBrotherInLawElderSistersHusband: string

export declare const CNLabelContactRelationStepson: string

export declare const CNLabelContactRelationFatherInLawHusbandsFather: string

export declare const CNLabelContactRelationSonInLawOrBrotherInLaw: string

export declare const CNLabelContactRelationUncleParentsBrother: string

export declare const CNLabelContactRelationGrandnieceBrothersGranddaughter: string

export declare const CNContactUrlAddressesKey: string

export declare const CNLabelContactRelationGrandfatherFathersFather: string

export declare const CNLabelContactRelationNieceOrCousin: string

export declare const CNSocialProfileServiceTencentWeibo: string

export declare const CNContactPropertyAttribute: string

export declare const CNLabelContactRelationSister: string

export declare const CNLabelContactRelationNephew: string

export declare const CNContactInstantMessageAddressesKey: string

export declare const CNLabelContactRelationDaughterInLawOrSisterInLaw: string

export declare const CNLabelContactRelationParentsSiblingMothersSibling: string

export declare const CNLabelContactRelationYoungerCousinFathersSistersSon: string

export declare const CNLabelContactRelationCousin: string

export declare const CNLabelContactRelationGrandchild: string

export declare const CNLabelContactRelationElderSibling: string

export declare const CNLabelContactRelationAunt: string

export declare const CNLabelContactRelationGreatGrandchild: string

export declare const CNLabelContactRelationCousinMothersSistersSon: string

export declare const CNLabelContactRelationUncleFathersElderBrother: string

export declare const CNLabelContactRelationAuntMothersElderSister: string

export declare const CNLabelContactRelationUncleMothersBrother: string

export declare const CNErrorUserInfoKeyPathsKey: string

export declare const CNLabelContactRelationGrandsonSonsSon: string

export declare const CNLabelContactRelationPartner: string

export declare const CNLabelContactRelationSiblingInLaw: string

export declare const CNContactRelationsKey: string

export declare const CNContactOrganizationNameKey: string

export declare const CNLabelContactRelationBrotherInLawWifesBrother: string

export declare const CNLabelContactRelationFemaleFriend: string

export declare const CNLabelContactRelationStepdaughter: string

export declare const CNLabelContactRelationCousinMothersBrothersSon: string

export declare const CNLabelContactRelationMother: string

export declare const CNLabelContactRelationGrandnieceSistersGranddaughter: string

export declare const CNSocialProfileServiceSinaWeibo: string

export declare const CNLabelContactRelationAuntFathersYoungerSister: string

export declare const CNLabelContactRelationUncleFathersBrother: string

export declare const CNLabelPhoneNumberOtherFax: string

export declare const CNSocialProfileServiceMySpace: string

export declare const CNLabelContactRelationSisterInLawWifesBrothersWife: string

export declare const CNLabelContactRelationUncleMothersSistersHusband: string

export declare const CNLabelContactRelationCoParentInLaw: string

export declare const CNLabelContactRelationFriend: string

export declare const CNLabelContactRelationCousinFathersBrothersSon: string

export declare const CNLabelContactRelationGrandnephew: string

export declare const CNLabelContactRelationParentsSiblingMothersElderSibling: string

export declare const CNPostalAddressPropertyAttribute: string

export declare const CNLabelContactRelationYoungerSisterInLaw: string

export declare const CNErrorUserInfoValidationErrorsKey: string

export declare const CNLabelContactRelationDaughterInLaw: string

export declare const CNLabelContactRelationSisterInLawHusbandsSister: string

export declare const CNLabelContactRelationElderCousinParentsSiblingsSon: string

export declare const CNContactFamilyNameKey: string

export declare const CNLabelContactRelationUncleFathersElderSistersHusband: string

export declare const CNPostalAddressStateKey: string

export declare const CNContactThumbnailImageDataKey: string

export declare const CNLabelContactRelationParentsElderSibling: string

export declare const CNContactPropertyNotFetchedExceptionName: string

export declare const CNLabelContactRelationGrandchildOrSiblingsChild: string

export declare const CNLabelContactRelationElderCousinMothersSistersSon: string

export declare const CNLabelContactRelationAuntFathersBrothersWife: string

export declare const CNLabelContactRelationChild: string

export declare const CNLabelContactRelationParentInLaw: string

export declare const CNLabelContactRelationStepsister: string

export declare const CNLabelContactRelationMaleFriend: string

export declare const CNLabelContactRelationBrotherInLawHusbandsBrother: string

export declare const CNInstantMessageAddressUsernameKey: string

export declare const CNLabelContactRelationYoungestBrother: string

export declare const CNInstantMessageServiceGaduGadu: string

export declare const CNLabelContactRelationYoungerCousinFathersSistersDaughter: string

export declare const CNLabelContactRelationGranddaughterOrNiece: string

export declare const CNLabelContactRelationGreatGrandchildOrSiblingsGrandchild: string

export declare const CNContactDepartmentNameKey: string

export declare const CNLabelContactRelationNiece: string

export declare const CNLabelContactRelationElderCousinFathersBrothersDaughter: string

export declare const CNLabelContactRelationAuntMothersSister: string

export declare const CNGroupNameKey: string

export declare const CNContactBirthdayKey: string

export declare const CNLabelContactRelationElderCousinFathersBrothersSon: string

export declare const CNLabelContactRelationCousinParentsSiblingsSon: string

export declare const CNLabelContactRelationCousinFathersBrothersDaughter: string

export declare const CNContactSocialProfilesKey: string

export declare const CNLabelContactRelationFatherInLawOrStepfather: string

export declare const CNLabelContactRelationParentsSiblingFathersYoungerSibling: string

export declare const CNLabelContactRelationCousinGrandparentsSiblingsChild: string

export declare const CNLabelContactRelationYoungerSister: string

export declare const CNInstantMessageServiceSkype: string

export declare const CNInstantMessageServiceMSN: string

export declare const CNPostalAddressPostalCodeKey: string

export declare const CNContactPhoneticGivenNameKey: string

export declare const CNLabelContactRelationUncleFathersYoungerBrother: string

export declare const CNLabelContactRelationElderCousinParentsSiblingsDaughter: string

export declare const CNLabelContactRelationFemalePartner: string

export declare const CNContactJobTitleKey: string

export declare const CNLabelContactRelationElderCousinMothersBrothersSon: string

export declare const CNLabelContactRelationBoyfriend: string

export declare const CNErrorDomain: string

export declare const CNLabelContactRelationYoungerCousinMothersSistersSon: string

export declare const CNLabelContactRelationSisterInLaw: string

export declare const CNLabelPhoneNumberHomeFax: string

export declare const CNLabelContactRelationBrother: string

export declare const CNLabelContactRelationElderBrotherInLaw: string

export declare const CNLabelContactRelationSibling: string

export declare const CNContactNicknameKey: string

export declare const CNInstantMessageServiceFacebook: string

export declare const CNLabelContactRelationEldestBrother: string

export declare const CNLabelContactRelationCousinParentsSiblingsChild: string

export declare const CNLabelContactRelationGreatGranddaughter: string

export declare const CNLabelContactRelationGranddaughterSonsDaughter: string

export declare const CNLabelContactRelationGirlfriendOrBoyfriend: string

export declare const CNLabelContactRelationCousinMothersSistersDaughter: string

export declare const CNLabelContactRelationYoungerCousin: string

export declare const CNLabelContactRelationStepchild: string

export declare const CNLabelContactRelationSisterInLawSpousesSister: string

export declare const CNLabelContactRelationMotherInLaw: string

export declare const CNLabelContactRelationMotherInLawOrStepmother: string

export declare const CNContactNameSuffixKey: string

export declare const CNLabelContactRelationUncleParentsElderBrother: string

export declare const CNLabelContactRelationCoSisterInLaw: string

export declare const CNLabelContactRelationParentsSiblingMothersYoungerSibling: string

export declare const CNLabelContactRelationElderCousinMothersSiblingsDaughterOrFathersSistersDaughter: string

export declare const CNPostalAddressSubLocalityKey: string

export declare const CNLabelPhoneNumberPager: string

export declare const CNLabelContactRelationAuntParentsYoungerSister: string

export declare const CNContactPreviousFamilyNameKey: string

export declare const CNContactNoteKey: string

export declare const CNLabelContactRelationFatherInLawWifesFather: string

export declare const CNLabelContactRelationBrotherInLawSistersHusband: string

export declare const CNLabelContactRelationDaughterInLawOrStepdaughter: string

export declare const CNLabelContactRelationElderCousin: string

export declare const CNLabelContactRelationManager: string

export declare const CNLabelContactRelationSon: string

export declare const CNLabelContactRelationUncleFathersSistersHusband: string

export declare const CNLabelPhoneNumberWorkFax: string

export declare const CNLabelContactRelationBrotherInLawYoungerSistersHusband: string

export declare const CNLabelContactRelationGreatGrandson: string

export declare const CNLabelPhoneNumberMobile: string

export declare const CNEntityType: {
	CNEntityTypeContacts: 0
}

export declare const CNContactSortOrder: {
	None: 0
	UserDefault: 1
	GivenName: 2
	FamilyName: 3
}

export declare const CNContactDisplayNameOrder: {
	UserDefault: 0
	GivenNameFirst: 1
	FamilyNameFirst: 2
}

export declare const CNAuthorizationStatus: {
	NotDetermined: 0
	Restricted: 1
	Denied: 2
	Authorized: 3
}

export declare const CNErrorCode: {
	CommunicationError: 1
	DataAccessError: 2
	AuthorizationDenied: 100
	NoAccessableWritableContainers: 101
	UnauthorizedKeys: 102
	FeatureDisabledByUser: 103
	RecordDoesNotExist: 200
	InsertedRecordAlreadyExists: 201
	ContainmentCycle: 202
	ContainmentScope: 203
	ParentRecordDoesNotExist: 204
	RecordIdentifierInvalid: 205
	RecordNotWritable: 206
	ParentContainerNotWritable: 207
	ValidationMultipleErrors: 300
	ValidationTypeMismatch: 301
	ValidationConfigurationError: 302
	PredicateInvalid: 400
	PolicyViolation: 500
	ClientIdentifierInvalid: 600
	ClientIdentifierDoesNotExist: 601
	ClientIdentifierCollision: 602
	ChangeHistoryExpired: 603
	ChangeHistoryInvalidAnchor: 604
	ChangeHistoryInvalidFetchRequest: 605
	VCardMalformed: 700
	VCardSummarizationError: 701
}

export declare const CNContactFormatterStyle: {
	CNContactFormatterStyleFullName: 0
	Phonetic: 1
}

export declare const CNContainerType: {
	Unassigned: 0
	Local: 1
	Exchange: 2
	CardDAV: 3
}

export declare const CNPostalAddressFormatterStyle: {
	CNPostalAddressFormatterStyleMailingAddress: 0
}

export declare const CNContactType: {
	Person: 0
	Organization: 1
}

export declare interface CNKeyDescriptor extends NSObjectProtocol, NSSecureCoding, NSCopying {}

export declare class CNKeyDescriptor extends NativeObject implements CNKeyDescriptor {}

export declare interface CNChangeHistoryEventVisitor extends NSObjectProtocol {
	visitDropEverythingEvent(event: CNChangeHistoryDropEverythingEvent): void

	visitAddContactEvent(event: CNChangeHistoryAddContactEvent): void

	visitUpdateContactEvent(event: CNChangeHistoryUpdateContactEvent): void

	visitDeleteContactEvent(event: CNChangeHistoryDeleteContactEvent): void

	visitAddGroupEvent?(event: CNChangeHistoryAddGroupEvent): void

	visitUpdateGroupEvent?(event: CNChangeHistoryUpdateGroupEvent): void

	visitDeleteGroupEvent?(event: CNChangeHistoryDeleteGroupEvent): void

	visitAddMemberToGroupEvent?(event: CNChangeHistoryAddMemberToGroupEvent): void

	visitRemoveMemberFromGroupEvent?(event: CNChangeHistoryRemoveMemberFromGroupEvent): void

	visitAddSubgroupToGroupEvent?(event: CNChangeHistoryAddSubgroupToGroupEvent): void

	visitRemoveSubgroupFromGroupEvent?(event: CNChangeHistoryRemoveSubgroupFromGroupEvent): void
}

export declare class CNChangeHistoryEventVisitor
	extends NativeObject
	implements CNChangeHistoryEventVisitor {}

export declare class CNChangeHistoryEvent extends NSObject implements NSCopying, NSSecureCoding {
	acceptEventVisitor(visitor: CNChangeHistoryEventVisitor): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNChangeHistoryAddMemberToGroupEvent extends CNChangeHistoryEvent {
	readonly member: CNContact

	readonly group: CNGroup
}

export declare class CNContactProperty extends NSObject implements NSCopying, NSSecureCoding {
	readonly contact: CNContact

	readonly key: string

	readonly value: interop.Object

	readonly identifier: string

	readonly label: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNFetchRequest extends NSObject {}

export declare class CNContactVCardSerialization extends NSObject {
	static descriptorForRequiredKeys(): CNKeyDescriptor

	static dataWithContactsError(
		contacts: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSData

	static contactsWithDataError(data: NSData, error: interop.PointerConvertible): NSArray
}

export declare class CNPostalAddressFormatter extends NSFormatter {
	static stringFromPostalAddressStyle(
		postalAddress: CNPostalAddress,
		style: interop.Enum<typeof CNPostalAddressFormatterStyle>,
	): string

	static attributedStringFromPostalAddressStyleWithDefaultAttributes(
		postalAddress: CNPostalAddress,
		style: interop.Enum<typeof CNPostalAddressFormatterStyle>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSAttributedString

	style: interop.Enum<typeof CNPostalAddressFormatterStyle>

	stringFromPostalAddress(postalAddress: CNPostalAddress): string

	attributedStringFromPostalAddressWithDefaultAttributes(
		postalAddress: CNPostalAddress,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): NSAttributedString
}

export declare class CNContactFormatter extends NSFormatter implements NSSecureCoding {
	static descriptorForRequiredKeysForStyle(
		style: interop.Enum<typeof CNContactFormatterStyle>,
	): CNKeyDescriptor

	static readonly descriptorForRequiredKeysForNameOrder: CNKeyDescriptor

	static readonly descriptorForRequiredKeysForDelimiter: CNKeyDescriptor

	static stringFromContactStyle(
		contact: CNContact,
		style: interop.Enum<typeof CNContactFormatterStyle>,
	): string

	static attributedStringFromContactStyleDefaultAttributes(
		contact: CNContact,
		style: interop.Enum<typeof CNContactFormatterStyle>,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSAttributedString

	static nameOrderForContact(contact: CNContact): interop.Enum<typeof CNContactDisplayNameOrder>

	static delimiterForContact(contact: CNContact): string

	style: interop.Enum<typeof CNContactFormatterStyle>

	stringFromContact(contact: CNContact): string

	attributedStringFromContactDefaultAttributes(
		contact: CNContact,
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSAttributedString

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNPhoneNumber extends NSObject implements NSCopying, NSSecureCoding {
	static phoneNumberWithStringValue<This extends abstract new (...args: any) => any>(
		this: This,
		stringValue: string,
	): InstanceType<This>

	initWithStringValue(string: string): this

	init(): this

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	readonly stringValue: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNGroup
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding
{
	readonly identifier: string

	readonly name: string

	static predicateForGroupsWithIdentifiers(
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static predicateForSubgroupsInGroupWithIdentifier(parentGroupIdentifier: string): NSPredicate

	static predicateForGroupsInContainerWithIdentifier(containerIdentifier: string): NSPredicate

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNMutableContact extends CNContact {
	// @ts-ignore MemberDecl.tsIgnore
	contactType: interop.Enum<typeof CNContactType>

	// @ts-ignore MemberDecl.tsIgnore
	namePrefix: string

	// @ts-ignore MemberDecl.tsIgnore
	givenName: string

	// @ts-ignore MemberDecl.tsIgnore
	middleName: string

	// @ts-ignore MemberDecl.tsIgnore
	familyName: string

	// @ts-ignore MemberDecl.tsIgnore
	previousFamilyName: string

	// @ts-ignore MemberDecl.tsIgnore
	nameSuffix: string

	// @ts-ignore MemberDecl.tsIgnore
	nickname: string

	// @ts-ignore MemberDecl.tsIgnore
	organizationName: string

	// @ts-ignore MemberDecl.tsIgnore
	departmentName: string

	// @ts-ignore MemberDecl.tsIgnore
	jobTitle: string

	// @ts-ignore MemberDecl.tsIgnore
	phoneticGivenName: string

	// @ts-ignore MemberDecl.tsIgnore
	phoneticMiddleName: string

	// @ts-ignore MemberDecl.tsIgnore
	phoneticFamilyName: string

	// @ts-ignore MemberDecl.tsIgnore
	phoneticOrganizationName: string

	// @ts-ignore MemberDecl.tsIgnore
	note: string

	// @ts-ignore MemberDecl.tsIgnore
	imageData: NSData

	// @ts-ignore MemberDecl.tsIgnore
	get phoneNumbers(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set phoneNumbers(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get emailAddresses(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set emailAddresses(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get postalAddresses(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set postalAddresses(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get urlAddresses(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set urlAddresses(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get contactRelations(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set contactRelations(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get socialProfiles(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set socialProfiles(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	get instantMessageAddresses(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set instantMessageAddresses(value: NSArray<interop.Object> | Array<interop.Object>)

	// @ts-ignore MemberDecl.tsIgnore
	birthday: NSDateComponents

	// @ts-ignore MemberDecl.tsIgnore
	nonGregorianBirthday: NSDateComponents

	// @ts-ignore MemberDecl.tsIgnore
	get dates(): NSArray
	// @ts-ignore MemberDecl.tsIgnore
	set dates(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class CNChangeHistoryRemoveSubgroupFromGroupEvent extends CNChangeHistoryEvent {
	readonly subgroup: CNGroup

	readonly group: CNGroup
}

export declare class CNChangeHistoryAddSubgroupToGroupEvent extends CNChangeHistoryEvent {
	readonly subgroup: CNGroup

	readonly group: CNGroup
}

export declare class CNChangeHistoryRemoveMemberFromGroupEvent extends CNChangeHistoryEvent {
	readonly member: CNContact

	readonly group: CNGroup
}

export declare class CNChangeHistoryUpdateGroupEvent extends CNChangeHistoryEvent {
	readonly group: CNGroup
}

export declare class CNChangeHistoryAddGroupEvent extends CNChangeHistoryEvent {
	readonly group: CNGroup

	readonly containerIdentifier: string
}

export declare class CNChangeHistoryUpdateContactEvent extends CNChangeHistoryEvent {
	readonly contact: CNContact
}

export declare class CNChangeHistoryDropEverythingEvent extends CNChangeHistoryEvent {}

export declare class CNContactRelation extends NSObject implements NSCopying, NSSecureCoding {
	static contactRelationWithName<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	initWithName(name: string): this

	readonly name: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNLabeledValue<ValueType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	readonly identifier: string

	readonly label: string

	readonly value: ValueType

	static labeledValueWithLabelValue<ValueType, This extends abstract new (...args: any) => any>(
		this: This,
		label: string | null,
		value: ValueType,
	): InstanceType<This>

	initWithLabelValue(label: string | null, value: ValueType): this

	labeledValueBySettingLabel(label: string | null): this

	labeledValueBySettingValue(value: ValueType): this

	labeledValueBySettingLabelValue(label: string | null, value: ValueType): this

	static localizedStringForLabel<ValueType>(label: string): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNChangeHistoryAddContactEvent extends CNChangeHistoryEvent {
	readonly contact: CNContact

	readonly containerIdentifier: string
}

export declare class CNChangeHistoryDeleteContactEvent extends CNChangeHistoryEvent {
	readonly contactIdentifier: string
}

export declare class CNContactFetchRequest extends CNFetchRequest implements NSSecureCoding {
	initWithKeysToFetch(keysToFetch: NSArray<interop.Object> | Array<interop.Object>): this

	predicate: NSPredicate

	get keysToFetch(): NSArray
	set keysToFetch(value: NSArray<interop.Object> | Array<interop.Object>)

	mutableObjects: boolean

	unifyResults: boolean

	sortOrder: interop.Enum<typeof CNContactSortOrder>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNMutableGroup extends CNGroup {
	// @ts-ignore MemberDecl.tsIgnore
	name: string
}

export declare class CNContactsUserDefaults extends NSObject {
	static sharedDefaults<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	readonly sortOrder: interop.Enum<typeof CNContactSortOrder>

	readonly countryCode: string
}

export declare class CNContainer extends NSObject implements NSCopying, NSSecureCoding {
	readonly identifier: string

	readonly name: string

	readonly type: interop.Enum<typeof CNContainerType>

	static predicateForContainersWithIdentifiers(
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static predicateForContainerOfContactWithIdentifier(contactIdentifier: string): NSPredicate

	static predicateForContainerOfGroupWithIdentifier(groupIdentifier: string): NSPredicate

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNSaveRequest extends NSObject {
	addContactToContainerWithIdentifier(contact: CNMutableContact, identifier: string | null): void

	updateContact(contact: CNMutableContact): void

	deleteContact(contact: CNMutableContact): void

	addGroupToContainerWithIdentifier(group: CNMutableGroup, identifier: string | null): void

	updateGroup(group: CNMutableGroup): void

	deleteGroup(group: CNMutableGroup): void

	addSubgroupToGroup(subgroup: CNGroup, group: CNGroup): void

	removeSubgroupFromGroup(subgroup: CNGroup, group: CNGroup): void

	addMemberToGroup(contact: CNContact, group: CNGroup): void

	removeMemberFromGroup(contact: CNContact, group: CNGroup): void
}

export declare class CNFetchResult<ValueType = interop.Object> extends NSObject {
	readonly value: ValueType

	readonly currentHistoryToken: NSData
}

export declare class CNChangeHistoryFetchRequest extends CNFetchRequest implements NSSecureCoding {
	startingToken: NSData

	get additionalContactKeyDescriptors(): NSArray
	set additionalContactKeyDescriptors(value: NSArray<interop.Object> | Array<interop.Object>)

	shouldUnifyResults: boolean

	mutableObjects: boolean

	includeGroupChanges: boolean

	get excludedTransactionAuthors(): NSArray
	set excludedTransactionAuthors(value: NSArray<interop.Object> | Array<interop.Object>)

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNPostalAddress
	extends NSObject
	implements NSCopying, NSMutableCopying, NSSecureCoding
{
	readonly street: string

	readonly subLocality: string

	readonly city: string

	readonly subAdministrativeArea: string

	readonly state: string

	readonly postalCode: string

	readonly country: string

	readonly ISOCountryCode: string

	static localizedStringForKey(key: string): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNContact
	extends NSObject
	implements
		NSCopying,
		NSMutableCopying,
		NSSecureCoding,
		NSItemProviderReading,
		NSItemProviderWriting
{
	readonly identifier: string

	readonly contactType: interop.Enum<typeof CNContactType>

	readonly namePrefix: string

	readonly givenName: string

	readonly middleName: string

	readonly familyName: string

	readonly previousFamilyName: string

	readonly nameSuffix: string

	readonly nickname: string

	readonly organizationName: string

	readonly departmentName: string

	readonly jobTitle: string

	readonly phoneticGivenName: string

	readonly phoneticMiddleName: string

	readonly phoneticFamilyName: string

	readonly phoneticOrganizationName: string

	readonly note: string

	readonly imageData: NSData

	readonly thumbnailImageData: NSData

	readonly imageDataAvailable: boolean

	readonly phoneNumbers: NSArray

	readonly emailAddresses: NSArray

	readonly postalAddresses: NSArray

	readonly urlAddresses: NSArray

	readonly contactRelations: NSArray

	readonly socialProfiles: NSArray

	readonly instantMessageAddresses: NSArray

	readonly birthday: NSDateComponents

	readonly nonGregorianBirthday: NSDateComponents

	readonly dates: NSArray

	isKeyAvailable(key: string): boolean

	areKeysAvailable(keyDescriptors: NSArray<interop.Object> | Array<interop.Object>): boolean

	static localizedStringForKey(key: string): string

	static comparatorForNameSortOrder(
		sortOrder: interop.Enum<typeof CNContactSortOrder>,
	): (p1: interop.Object, p2: interop.Object) => interop.Enum<typeof NSComparisonResult>

	static descriptorForAllComparatorKeys(): CNKeyDescriptor

	isUnifiedWithContactWithIdentifier(contactIdentifier: string): boolean

	static predicateForContactsMatchingName(name: string): NSPredicate

	static predicateForContactsMatchingEmailAddress(emailAddress: string): NSPredicate

	static predicateForContactsMatchingPhoneNumber(phoneNumber: CNPhoneNumber): NSPredicate

	static predicateForContactsWithIdentifiers(
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static predicateForContactsInGroupWithIdentifier(groupIdentifier: string): NSPredicate

	static predicateForContactsInContainerWithIdentifier(containerIdentifier: string): NSPredicate

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly readableTypeIdentifiersForItemProvider: NSArray

	static objectWithItemProviderDataTypeIdentifierError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData,
		typeIdentifier: string,
		outError: interop.PointerConvertible,
	): InstanceType<This>

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	static readonly writableTypeIdentifiersForItemProvider: NSArray

	readonly writableTypeIdentifiersForItemProvider: NSArray

	static itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	itemProviderVisibilityForRepresentationWithTypeIdentifier(
		typeIdentifier: string,
	): interop.Enum<typeof NSItemProviderRepresentationVisibility>

	loadDataWithTypeIdentifierForItemProviderCompletionHandler(
		typeIdentifier: string,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): NSProgress
}

export declare class CNSocialProfile extends NSObject implements NSCopying, NSSecureCoding {
	readonly urlString: string

	readonly username: string

	readonly userIdentifier: string

	readonly service: string

	initWithUrlStringUsernameUserIdentifierService(
		urlString: string | null,
		username: string | null,
		userIdentifier: string | null,
		service: string | null,
	): this

	static localizedStringForKey(key: string): string

	static localizedStringForService(service: string): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CNChangeHistoryDeleteGroupEvent extends CNChangeHistoryEvent {
	readonly groupIdentifier: string
}

export declare class CNContactStore extends NSObject {
	static authorizationStatusForEntityType(
		entityType: interop.Enum<typeof CNEntityType>,
	): interop.Enum<typeof CNAuthorizationStatus>

	requestAccessForEntityTypeCompletionHandler(
		entityType: interop.Enum<typeof CNEntityType>,
		completionHandler: (p1: boolean, p2: NSError) => void | null,
	): void

	unifiedContactsMatchingPredicateKeysToFetchError(
		predicate: NSPredicate,
		keys: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSArray

	unifiedContactWithIdentifierKeysToFetchError(
		identifier: string,
		keys: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): CNContact

	unifiedMeContactWithKeysToFetchError(
		keys: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): CNContact

	enumeratorForContactFetchRequestError(
		request: CNContactFetchRequest,
		error: interop.PointerConvertible,
	): CNFetchResult

	enumeratorForChangeHistoryFetchRequestError(
		request: CNChangeHistoryFetchRequest,
		error: interop.PointerConvertible,
	): CNFetchResult

	enumerateContactsWithFetchRequestErrorUsingBlock(
		fetchRequest: CNContactFetchRequest,
		error: interop.PointerConvertible,
		block: (p1: CNContact, p2: interop.PointerConvertible) => void,
	): boolean

	groupsMatchingPredicateError(
		predicate: NSPredicate | null,
		error: interop.PointerConvertible,
	): NSArray

	containersMatchingPredicateError(
		predicate: NSPredicate | null,
		error: interop.PointerConvertible,
	): NSArray

	executeSaveRequestError(saveRequest: CNSaveRequest, error: interop.PointerConvertible): boolean

	readonly currentHistoryToken: NSData

	defaultContainerIdentifier(): string
}

export declare class CNMutablePostalAddress extends CNPostalAddress {
	// @ts-ignore MemberDecl.tsIgnore
	street: string

	// @ts-ignore MemberDecl.tsIgnore
	subLocality: string

	// @ts-ignore MemberDecl.tsIgnore
	city: string

	// @ts-ignore MemberDecl.tsIgnore
	subAdministrativeArea: string

	// @ts-ignore MemberDecl.tsIgnore
	state: string

	// @ts-ignore MemberDecl.tsIgnore
	postalCode: string

	// @ts-ignore MemberDecl.tsIgnore
	country: string

	// @ts-ignore MemberDecl.tsIgnore
	ISOCountryCode: string
}

export declare class CNInstantMessageAddress extends NSObject implements NSCopying, NSSecureCoding {
	readonly username: string

	readonly service: string

	initWithUsernameService(username: string, service: string): this

	static localizedStringForKey(key: string): string

	static localizedStringForService(service: string): string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
