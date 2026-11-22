// macOS Core provider: EditableTextBase for AppKit. The iOS
// file is UIKit throughout (keyboard types, autocorrect traits, input
// accessory views — none of which exist on macOS); the AppKit version keeps
// the class contract and the bits TextField needs.
import { EditableTextBase as EditableTextBaseCommon } from '@nativescript/core/ui/editable-text-base/editable-text-base-common';
export * from '@nativescript/core/ui/editable-text-base/editable-text-base-common';
export class EditableTextBase extends EditableTextBaseCommon {
    get value() {
        return this.text;
    }
    set value(value) {
        this.text = value ?? '';
    }
    get placeholder() {
        return this.hint;
    }
    set placeholder(value) {
        this.hint = value ?? '';
    }
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }
    dismissSoftInput() {
        const native = this.nativeTextViewProtected;
        const window = native && native.window;
        if (window) {
            window.makeFirstResponder(null);
        }
    }
}
