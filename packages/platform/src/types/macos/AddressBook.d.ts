import type { CGRect } from './CoreFoundation'

import type { NSArray, NSAttributedString, NSCopying, NSData, NSDictionary, NSFastEnumeration, NSMutableCopying } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { NSRectEdge } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const kEventParamABPickerRef: number;

export declare const kEventABPeoplePickerGroupDoubleClicked: number;

export declare const kEventABPeoplePickerValueSelectionChanged: number;

export declare const kEventABPeoplePickerNameSelectionChanged: number;

export declare const kEventABPeoplePickerGroupSelectionChanged: number;

export declare const kEventClassABPeoplePicker: number;

export declare const kABPickerAllowGroupSelection: number;

export declare const ABPeoplePickerDisplayedPropertyDidChangeNotification: string;

export declare const ABPeoplePickerGroupSelectionDidChangeNotification: string;

export declare const ABAddressBookErrorDomain: string;

export declare const ABPropertyReadOnlyError: number;

export declare const ABPropertyValueValidationError: number;

export declare const ABAddRecordsError: number;

export declare const kABDeletedRecords: string;

export declare const kABDatabaseChangedExternallyNotification: string;

export declare const kABOtherLabel: string;

export declare const kABGroupNameProperty: string;

export declare const kABSuffixProperty: string;

export declare const kABTitleProperty: string;

export declare const kABSocialProfileServiceMySpace: string;

export declare const kABSocialProfileServiceFlickr: string;

export declare const kABSocialProfileServiceLinkedIn: string;

export declare const kABSocialProfileServiceFacebook: string;

export declare const kABSocialProfileServiceTwitter: string;

export declare const kABSocialProfileServiceKey: string;

export declare const kABInstantMessageServiceJabber: string;

export declare const kABInstantMessageServiceICQ: string;

export declare const kABInstantMessageServiceGoogleTalk: string;

export declare const kABInstantMessageServiceGaduGadu: string;

export declare const kABInstantMessageServiceFacebook: string;

export declare const kABInstantMessageServiceKey: string;

export declare const kABYahooHomeLabel: string;

export declare const kABYahooWorkLabel: string;

export declare const kABMSNWorkLabel: string;

export declare const kABMSNInstantProperty: string;

export declare const kABJabberHomeLabel: string;

export declare const kABJabberWorkLabel: string;

export declare const kABAIMMobileMeLabel: string;

export declare const kABPhonePagerLabel: string;

export declare const kABPhoneMainLabel: string;

export declare const kABPhoneProperty: string;

export declare const kABPersonFlags: string;

export declare const kABPartnerLabel: string;

export declare const kABSpouseLabel: string;

export declare const kABChildLabel: string;

export declare const kABBrotherLabel: string;

export declare const kABFatherLabel: string;

export declare const kABRelatedNamesProperty: string;

export declare const kABAddressHomeLabel: string;

export declare const kABAddressZIPKey: string;

export declare const kABAddressStateKey: string;

export declare const kABAddressCityKey: string;

export declare const kABAddressStreetKey: string;

export declare const kABEmailHomeLabel: string;

export declare const kABURLsProperty: string;

export declare const kABJobTitleProperty: string;

export declare const kABOrganizationPhoneticProperty: string;

export declare const kABAlternateBirthdayComponentsProperty: string;

export declare const kABMaidenNameProperty: string;

export declare const kABNicknameProperty: string;

export declare const kABLastNamePhoneticProperty: string;

export declare const kABFirstNameProperty: string;

export declare const kABCreationDateProperty: string;

export declare const kABAnniversaryLabel: string;

export declare const kABMiddleNameProperty: string;

export declare const kABInstantMessageServiceMSN: string;

export declare const kABDatabaseChangedNotification: string;

export declare const kABSocialProfileUsernameKey: string;

export declare const kABUpdatedRecords: string;

export declare const kABAIMInstantProperty: string;

export declare const kABPhoneHomeLabel: string;

export declare const kABInstantMessageProperty: string;

export declare const kABUIDProperty: string;

export declare const kABICQWorkLabel: string;

export declare const kABPickerAllowMultipleSelection: number;

export declare const kABLastNameProperty: string;

export declare const kABDepartmentProperty: string;

export declare const kABHomePageLabel: string;

export declare const kABICQHomeLabel: string;

export declare const kABAddressProperty: string;

export declare const kABSocialProfileURLKey: string;

export declare const kABSocialProfileServiceSinaWeibo: string;

export declare const kABICQInstantProperty: string;

export declare const kABPhoneHomeFAXLabel: string;

export declare const kEventABPeoplePickerNameDoubleClicked: number;

export declare const kABSocialProfileUserIdentifierKey: string;

export declare const kABHomeLabel: string;

export declare const kABAssistantLabel: string;

export declare const kABBirthdayComponentsProperty: string;

export declare const ABRemoveRecordsError: number;

export declare const kABSocialProfileProperty: string;

export declare const kABPickerSingleValueSelection: number;

export declare const kABPhoneWorkLabel: string;

export declare const kABYahooInstantProperty: string;

export declare const kABWorkLabel: string;

export declare const kABInstantMessageServiceYahoo: string;

export declare const kABFriendLabel: string;

export declare const ABPropertyUnsupportedBySourceError: number;

export declare const kABOrganizationProperty: string;

export declare const kABPhoneiPhoneLabel: string;

export declare const kABFirstNamePhoneticProperty: string;

export declare const kABParentLabel: string;

export declare const kABModificationDateProperty: string;

export declare const kABEmailMobileMeLabel: string;

export declare const kABInstantMessageServiceAIM: string;

export declare const kABNoteProperty: string;

export declare const kABAIMHomeLabel: string;

export declare const kABAIMWorkLabel: string;

export declare const kABAddressCountryCodeKey: string;

export declare const kABInstantMessageServiceQQ: string;

export declare const kABInstantMessageUsernameKey: string;

export declare const kABOtherDateComponentsProperty: string;

export declare const kABMotherLabel: string;

export declare const ABPeoplePickerNameSelectionDidChangeNotification: string;

export declare const kABAddressCountryKey: string;

export declare const kABSisterLabel: string;

export declare const kABPhoneMobileLabel: string;

export declare const kABMSNHomeLabel: string;

export declare const kABMiddleNamePhoneticProperty: string;

export declare const kABOtherDatesProperty: string;

export declare const ABPeoplePickerValueSelectionDidChangeNotification: string;

export declare const kABAddressWorkLabel: string;

export declare const kABPhoneWorkFAXLabel: string;

export declare const kABHomePageProperty: string;

export declare const kABSocialProfileServiceYelp: string;

export declare const kABBirthdayProperty: string;

export declare const kABSocialProfileServiceTencentWeibo: string;

export declare const kABManagerLabel: string;

export declare const kABPickerMultipleValueSelection: number;

export declare const kABCalendarURIsProperty: string;

export declare const kABJabberInstantProperty: string;

export declare const kABInsertedRecords: string;

export declare const kABEmailWorkLabel: string;

export declare const kABMobileMeLabel: string;

export declare const ABMultiValueIdentifiersErrorKey: string;

export declare const kABEmailProperty: string;

export declare const kEventABPeoplePickerDisplayedPropertyChanged: number;

export declare const kABInstantMessageServiceSkype: string;

export declare const _ABSearchComparison: {
  Equal: 0,
  NotEqual: 1,
  LessThan: 2,
  LessThanOrEqual: 3,
  GreaterThan: 4,
  GreaterThanOrEqual: 5,
  EqualCaseInsensitive: 6,
  ContainsSubString: 7,
  ContainsSubStringCaseInsensitive: 8,
  PrefixMatch: 9,
  PrefixMatchCaseInsensitive: 10,
  BitsInBitFieldMatch: 11,
  DoesNotContainSubString: 12,
  DoesNotContainSubStringCaseInsensitive: 13,
  NotEqualCaseInsensitive: 14,
  SuffixMatch: 15,
  SuffixMatchCaseInsensitive: 16,
  WithinIntervalAroundToday: 17,
  WithinIntervalAroundTodayYearless: 18,
  NotWithinIntervalAroundToday: 19,
  NotWithinIntervalAroundTodayYearless: 20,
  WithinIntervalFromToday: 21,
  WithinIntervalFromTodayYearless: 22,
  NotWithinIntervalFromToday: 23,
  NotWithinIntervalFromTodayYearless: 24,
};

export declare const ABPeoplePickerSelectionBehavior: {
  No: 0,
  Single: 1,
  Multiple: 2,
};

export declare const _ABSearchConjunction: {
  And: 0,
  Or: 1,
};

export declare const _ABPropertyType: {
  ErrorIn: 0,
  String: 1,
  Integer: 2,
  Real: 3,
  Date: 4,
  Array: 5,
  Dictionary: 6,
  Data: 7,
  DateComponents: 8,
  MultiString: 257,
  MultiInteger: 258,
  MultiReal: 259,
  MultiDate: 260,
  MultiArray: 261,
  MultiDictionary: 262,
  MultiData: 263,
  MultiDateComponents: 264,
};

export declare class OpaqueABPicker {
  constructor(init?: OpaqueABPicker);
}

export declare class ABActionCallbacks {
  constructor(init?: ABActionCallbacks);
  version: number;
  property: () => interop.Pointer | null;
  title: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer | null;
  enabled: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  selected: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
}

export declare class __ABMultiValue {
  constructor(init?: __ABMultiValue);
}

export declare class __ABAddressBookRef {
  constructor(init?: __ABAddressBookRef);
}

export declare class __ABSearchElementRef {
  constructor(init?: __ABSearchElementRef);
}

export declare class __ABGroup {
  constructor(init?: __ABGroup);
}

export declare class __ABPerson {
  constructor(init?: __ABPerson);
}

export declare function ABLocalizedPropertyOrLabel(propertyOrLabel: string): string;

export declare function ABGetSharedAddressBook(): interop.Object;

export declare function ABCopyArrayOfMatchingRecords(addressBook: interop.Object, search: interop.Object): interop.Object;

export declare function ABSave(addressBook: interop.Object): boolean;

export declare function ABHasUnsavedChanges(addressBook: interop.Object): boolean;

export declare function ABGetMe(addressBook: interop.Object): interop.Object;

export declare function ABSetMe(addressBook: interop.Object, moi: interop.Object): void;

export declare function ABCopyRecordTypeFromUniqueId(addressBook: interop.Object, uniqueId: interop.Object): interop.Object;

export declare function ABAddPropertiesAndTypes(addressBook: interop.Object, recordType: interop.Object, propertiesAndTypes: interop.Object): number;

export declare function ABRemoveProperties(addressBook: interop.Object, recordType: interop.Object, properties: interop.Object): number;

export declare function ABCopyArrayOfPropertiesForRecordType(addressBook: interop.Object, recordType: interop.Object): interop.Object;

export declare function ABTypeOfProperty(addressBook: interop.Object, recordType: interop.Object, property: interop.Object): number;

export declare function ABCopyRecordForUniqueId(addressBook: interop.Object, uniqueId: interop.Object): interop.Object;

export declare function ABAddRecord(addressBook: interop.Object, record: interop.Object): boolean;

export declare function ABRemoveRecord(addressBook: interop.Object, record: interop.Object): boolean;

export declare function ABCopyArrayOfAllPeople(addressBook: interop.Object): interop.Object;

export declare function ABCopyArrayOfAllGroups(addressBook: interop.Object): interop.Object;

export declare function ABRecordCreateCopy(record: interop.Object): interop.Object;

export declare function ABRecordCopyRecordType(record: interop.Object): interop.Object;

export declare function ABRecordCopyValue(record: interop.Object, property: interop.Object): interop.Object;

export declare function ABRecordSetValue(record: interop.Object, property: interop.Object, value: interop.Object): boolean;

export declare function ABRecordRemoveValue(record: interop.Object, property: interop.Object): boolean;

export declare function ABRecordIsReadOnly(record: interop.Object): boolean;

export declare function ABRecordCopyUniqueId(record: interop.Object): interop.Object;

export declare function ABPersonCreate(): interop.Object;

export declare function ABPersonCreateWithVCardRepresentation(vCard: interop.Object): interop.Object;

export declare function ABPersonCopyVCardRepresentation(person: interop.Object): interop.Object;

export declare function ABPersonCopyParentGroups(person: interop.Object): interop.Object;

export declare function ABPersonCreateSearchElement(property: interop.Object, label: interop.Object, key: interop.Object, value: interop.Object, comparison: number): interop.Object;

export declare function ABGroupCreate(): interop.Object;

export declare function ABGroupCopyArrayOfAllMembers(group: interop.Object): interop.Object;

export declare function ABGroupAddMember(group: interop.Object, personToAdd: interop.Object): boolean;

export declare function ABGroupRemoveMember(group: interop.Object, personToRemove: interop.Object): boolean;

export declare function ABGroupCopyArrayOfAllSubgroups(group: interop.Object): interop.Object;

export declare function ABGroupAddGroup(group: interop.Object, groupToAdd: interop.Object): boolean;

export declare function ABGroupRemoveGroup(group: interop.Object, groupToRemove: interop.Object): boolean;

export declare function ABGroupCopyParentGroups(group: interop.Object): interop.Object;

export declare function ABGroupSetDistributionIdentifier(group: interop.Object, person: interop.Object, property: interop.Object, identifier: interop.Object): boolean;

export declare function ABGroupCopyDistributionIdentifier(group: interop.Object, person: interop.Object, property: interop.Object): interop.Object;

export declare function ABGroupCreateSearchElement(property: interop.Object, label: interop.Object, key: interop.Object, value: interop.Object, comparison: number): interop.Object;

export declare function ABSearchElementCreateWithConjunction(conjunction: number, childrenSearchElement: interop.Object): interop.Object;

export declare function ABSearchElementMatchesRecord(searchElement: interop.Object, record: interop.Object): boolean;

export declare function ABMultiValueCreate(): interop.Object;

export declare function ABMultiValueCount(multiValue: interop.Object): number;

export declare function ABMultiValueCopyValueAtIndex(multiValue: interop.Object, index: number): interop.Object;

export declare function ABMultiValueCopyLabelAtIndex(multiValue: interop.Object, index: number): interop.Object;

export declare function ABMultiValueCopyPrimaryIdentifier(multiValue: interop.Object): interop.Object;

export declare function ABMultiValueIndexForIdentifier(multiValue: interop.Object, identifier: interop.Object): number;

export declare function ABMultiValueCopyIdentifierAtIndex(multiValue: interop.Object, index: number): interop.Object;

export declare function ABMultiValuePropertyType(multiValue: interop.Object): number;

export declare function ABMultiValueCreateCopy(multiValue: interop.Object): interop.Object;

export declare function ABMultiValueCreateMutable(): interop.Object;

export declare function ABMultiValueAdd(multiValue: interop.Object, value: interop.Object, label: interop.Object, outIdentifier: interop.PointerConvertible): boolean;

export declare function ABMultiValueInsert(multiValue: interop.Object, value: interop.Object, label: interop.Object, index: number, outIdentifier: interop.PointerConvertible): boolean;

export declare function ABMultiValueRemove(multiValue: interop.Object, index: number): boolean;

export declare function ABMultiValueReplaceValue(multiValue: interop.Object, value: interop.Object, index: number): boolean;

export declare function ABMultiValueReplaceLabel(multiValue: interop.Object, label: interop.Object, index: number): boolean;

export declare function ABMultiValueSetPrimaryIdentifier(multiValue: interop.Object, identifier: interop.Object): boolean;

export declare function ABMultiValueCreateMutableCopy(multiValue: interop.Object): interop.Object;

export declare function ABCopyLocalizedPropertyOrLabel(labelOrProperty: interop.Object): interop.Object;

export declare function ABCreateFormattedAddressFromDictionary(addressBook: interop.Object, address: interop.Object): interop.Object;

export declare function ABCopyDefaultCountryCode(addressBook: interop.Object): interop.Object;

export declare function ABPersonSetImageData(person: interop.Object, imageData: interop.Object): boolean;

export declare function ABPersonCopyImageData(person: interop.Object): interop.Object;

export declare function ABBeginLoadingImageDataForClient(person: interop.Object, callback: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void, refcon: interop.PointerConvertible): number;

export declare function ABCancelLoadingImageDataForTag(tag: number): void;

export declare function ABPickerCreate(): interop.Object;

export declare function ABPickerSetFrame(inPicker: interop.Object, inFrame: interop.PointerConvertible): void;

export declare function ABPickerGetFrame(inPicker: interop.Object, outFrame: interop.PointerConvertible): void;

export declare function ABPickerSetVisibility(inPicker: interop.Object, visible: boolean): void;

export declare function ABPickerIsVisible(inPicker: interop.Object): boolean;

export declare function ABPickerGetAttributes(inPicker: interop.Object): number;

export declare function ABPickerChangeAttributes(inPicker: interop.Object, inAttributesToSet: number, inAttributesToClear: number): void;

export declare function ABPickerAddProperty(inPicker: interop.Object, inProperty: interop.Object): void;

export declare function ABPickerRemoveProperty(inPicker: interop.Object, inProperty: interop.Object): void;

export declare function ABPickerCopyProperties(inPicker: interop.Object): interop.Object;

export declare function ABPickerSetColumnTitle(inPicker: interop.Object, inTitle: interop.Object, inProperty: interop.Object): void;

export declare function ABPickerCopyColumnTitle(inPicker: interop.Object, inProperty: interop.Object): interop.Object;

export declare function ABPickerSetDisplayedProperty(inPicker: interop.Object, inProperty: interop.Object): void;

export declare function ABPickerCopyDisplayedProperty(inPicker: interop.Object): interop.Object;

export declare function ABPickerCopySelectedGroups(inPicker: interop.Object): interop.Object;

export declare function ABPickerCopySelectedRecords(inPicker: interop.Object): interop.Object;

export declare function ABPickerCopySelectedIdentifiers(inPicker: interop.Object, inPerson: interop.Object): interop.Object;

export declare function ABPickerCopySelectedValues(inPicker: interop.Object): interop.Object;

export declare function ABPickerSelectGroup(inPicker: interop.Object, inGroup: interop.Object, inExtendSelection: boolean): void;

export declare function ABPickerSelectRecord(inPicker: interop.Object, inRecord: interop.Object, inExtendSelection: boolean): void;

export declare function ABPickerSelectIdentifier(inPicker: interop.Object, inPerson: interop.Object, inIdentifier: interop.Object, inExtendSelection: boolean): void;

export declare function ABPickerDeselectGroup(inPicker: interop.Object, inGroup: interop.Object): void;

export declare function ABPickerDeselectRecord(inPicker: interop.Object, inRecord: interop.Object): void;

export declare function ABPickerDeselectIdentifier(inPicker: interop.Object, inPerson: interop.Object, inIdentifier: interop.Object): void;

export declare function ABPickerDeselectAll(inPicker: interop.Object): void;

export declare function ABPickerSetDelegate(inPicker: interop.Object, inDelegate: interop.PointerConvertible): void;

export declare function ABPickerGetDelegate(inPicker: interop.Object): interop.Pointer;

export declare function ABPickerClearSearchField(inPicker: interop.Object): void;

export declare function ABPickerEditInAddressBook(inPicker: interop.Object): void;

export declare function ABPickerSelectInAddressBook(inPicker: interop.Object): void;

export declare interface ABImageClient extends NSObjectProtocol {
  consumeImageDataForTag(data: NSData, tag: number): void;
}

export declare class ABImageClient extends NativeObject implements ABImageClient {
}

export declare interface ABPersonPickerDelegate extends NSObjectProtocol {
  personPickerDidChoosePersonPropertyIdentifier(picker: ABPersonPicker, person: ABPerson, property: string, identifier: string): void;

  personPickerDidClose?(picker: ABPersonPicker): void;
}

export declare class ABPersonPickerDelegate extends NativeObject implements ABPersonPickerDelegate {
}

export declare class ABPersonPicker extends NSObject {
  get properties(): NSArray;
  set properties(value: NSArray<interop.Object> | Array<interop.Object>);

  delegate: ABPersonPickerDelegate;

  showRelativeToRectOfViewPreferredEdge(positioningRect: CGRect, positioningView: NSView, preferredEdge: interop.Enum<typeof NSRectEdge>): void;

  close(): void;
}

export declare class ABPeoplePickerView extends NSView {
  accessoryView: NSView;

  valueSelectionBehavior: interop.Enum<typeof ABPeoplePickerSelectionBehavior>;

  allowsGroupSelection: boolean;

  allowsMultipleSelection: boolean;

  addProperty(property: string): void;

  removeProperty(property: string): void;

  properties(): NSArray;

  setColumnTitleForProperty(title: string, property: string): void;

  columnTitleForProperty(property: string): string;

  displayedProperty: string;

  autosaveName: string;

  readonly selectedGroups: NSArray;

  readonly selectedRecords: NSArray;

  selectedIdentifiersForPerson(person: ABPerson): NSArray;

  selectGroupByExtendingSelection(group: ABGroup, extend: boolean): void;

  selectRecordByExtendingSelection(record: ABRecord, extend: boolean): void;

  selectIdentifierForPersonByExtendingSelection(identifier: string, person: ABPerson, extend: boolean): void;

  deselectGroup(group: ABGroup): void;

  deselectRecord(record: ABRecord): void;

  deselectIdentifierForPerson(identifier: string, person: ABPerson): void;

  deselectAll(sender: interop.Object): void;

  clearSearchField(sender: interop.Object): void;

  target: interop.Object;

  groupDoubleAction: string;

  nameDoubleAction: string;

  selectedValues(): NSArray;

  editInAddressBook(sender: interop.Object): void;

  selectInAddressBook(sender: interop.Object): void;
}

export declare class ABSearchElement extends NSObject {
  static searchElementForConjunctionChildren(conjuction: number, children: NSArray<interop.Object> | Array<interop.Object>): ABSearchElement;

  matchesRecord(record: ABRecord): boolean;
}

export declare class ABMutableMultiValue extends ABMultiValue {
  addValueWithLabel(value: interop.Object, label: string): string;

  insertValueWithLabelAtIndex(value: interop.Object, label: string, index: number): string;

  removeValueAndLabelAtIndex(index: number): boolean;

  replaceValueAtIndexWithValue(index: number, value: interop.Object): boolean;

  replaceLabelAtIndexWithLabel(index: number, label: string): boolean;

  setPrimaryIdentifier(identifier: string): boolean;
}

export declare class ABAddressBook extends NSObject {
  static sharedAddressBook(): ABAddressBook;

  static addressBook(): ABAddressBook;

  recordsMatchingSearchElement(search: ABSearchElement): NSArray;

  save(): boolean;

  saveAndReturnError(error: interop.PointerConvertible): boolean;

  hasUnsavedChanges(): boolean;

  me(): ABPerson;

  setMe(moi: ABPerson): void;

  recordForUniqueId(uniqueId: string): ABRecord;

  addRecordError(record: ABRecord, error: interop.PointerConvertible): boolean;

  addRecord(record: ABRecord): boolean;

  removeRecordError(record: ABRecord, error: interop.PointerConvertible): boolean;

  removeRecord(record: ABRecord): boolean;

  people(): NSArray;

  groups(): NSArray;

  recordClassFromUniqueId(uniqueId: string): string;

  formattedAddressFromDictionary(address: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSAttributedString;

  defaultCountryCode(): string;

  defaultNameOrdering(): number;
}

export declare class ABPerson extends ABRecord {
  parentGroups(): NSArray;

  linkedPeople(): NSArray;

  static addPropertiesAndTypes(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  static removeProperties(properties: NSArray<interop.Object> | Array<interop.Object>): number;

  static properties(): NSArray;

  static typeOfProperty(property: string): number;

  static searchElementForPropertyLabelKeyValueComparison(property: string, label: string, key: string, value: interop.Object, comparison: number): ABSearchElement;

  initWithVCardRepresentation(vCardData: NSData): this;

  vCardRepresentation(): NSData;

  setImageData(data: NSData): boolean;

  imageData(): NSData;

  beginLoadingImageDataForClient(client: ABImageClient): number;

  static cancelLoadingImageDataForTag(tag: number): void;
}

export declare class ABMultiValue extends NSObject implements NSCopying, NSMutableCopying, NSFastEnumeration {
  count(): number;

  valueAtIndex(index: number): interop.Object;

  labelAtIndex(index: number): string;

  identifierAtIndex(index: number): string;

  indexForIdentifier(identifier: string): number;

  primaryIdentifier(): string;

  propertyType(): number;

  valueForIdentifier(identifier: string): interop.Object;

  labelForIdentifier(identifier: string): interop.Object;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;

  countByEnumeratingWithStateObjectsCount(state: interop.PointerConvertible, buffer: interop.PointerConvertible, len: number): number;

  readonly [Symbol.iterator]: () => Iterator<any>;

}

export declare class ABGroup extends ABRecord {
  members(): NSArray;

  addMember(person: ABPerson): boolean;

  removeMember(person: ABPerson): boolean;

  subgroups(): NSArray;

  addSubgroup(group: ABGroup): boolean;

  removeSubgroup(group: ABGroup): boolean;

  parentGroups(): NSArray;

  setDistributionIdentifierForPropertyPerson(identifier: string, property: string, person: ABPerson): boolean;

  distributionIdentifierForPropertyPerson(property: string, person: ABPerson): string;

  static addPropertiesAndTypes(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): number;

  static removeProperties(properties: NSArray<interop.Object> | Array<interop.Object>): number;

  static properties(): NSArray;

  static typeOfProperty(property: string): number;

  static searchElementForPropertyLabelKeyValueComparison(property: string, label: string, key: string, value: interop.Object, comparison: number): ABSearchElement;
}

export declare class ABPersonView extends NSView {
  editing: boolean;

  person: ABPerson;

  shouldShowLinkedPeople: boolean;
}

export declare class ABRecord extends NSObject {
  init(): this;

  initWithAddressBook(addressBook: ABAddressBook): this;

  valueForProperty(property: string): interop.Object;

  setValueForPropertyError(value: interop.Object, property: string, error: interop.PointerConvertible): boolean;

  setValueForProperty(value: interop.Object, property: string): boolean;

  removeValueForProperty(property: string): boolean;

  isReadOnly(): boolean;

  readonly uniqueId: string;

  readonly displayName: string;
}
