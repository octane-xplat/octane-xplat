import type { NSView } from './AppKit'

import type { CNContact, CNContactProperty, CNKeyDescriptor } from './Contacts'

import type { CGRect } from './CoreFoundation'

import type { NSArray } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSRectEdge } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare interface CNContactPickerDelegate extends NSObjectProtocol {
  contactPickerDidSelectContact?(picker: CNContactPicker, contact: CNContact): void;

  contactPickerDidSelectContactProperty?(picker: CNContactPicker, contactProperty: CNContactProperty): void;

  contactPickerWillClose?(picker: CNContactPicker): void;

  contactPickerDidClose?(picker: CNContactPicker): void;
}

export declare class CNContactPickerDelegate extends NativeObject implements CNContactPickerDelegate {
}

export declare class CNContactPicker extends NSObject {
  get displayedKeys(): NSArray;
  set displayedKeys(value: NSArray<interop.Object> | Array<interop.Object>);

  delegate: CNContactPickerDelegate | null;

  showRelativeToRectOfViewPreferredEdge(positioningRect: CGRect, positioningView: NSView, preferredEdge: interop.Enum<typeof NSRectEdge>): void;

  close(): void;
}

export declare class CNContactViewController extends NSViewController {
  static descriptorForRequiredKeys(): CNKeyDescriptor;

  contact: CNContact;
}
