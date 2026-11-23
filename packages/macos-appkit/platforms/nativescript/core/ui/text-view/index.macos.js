// macOS Core provider: TextView for AppKit — an NSScrollView
// wrapping an NSTextView (the AppKit editable multi-line shape, matching
// iOS's self-scrolling UITextView), ported from ui/text-view/index.ios.js.
// Differences: `hint` is a non-private overlay label shown while the field
// is empty (NSTextView has no placeholderString); border/padding inset
// plumbing and Writing Tools props are not ported (iOS-only surface).
import { textProperty } from '@nativescript/core/ui/text-base';
import { TextViewBase } from '@nativescript/core/ui/text-view/text-view-common';
import { editableProperty, hintProperty, maxLengthProperty, autocorrectProperty } from '@nativescript/core/ui/editable-text-base';
import { View, CSSType, isEnabledProperty } from '@nativescript/core/ui/core/view';
import { layout } from '@nativescript/core/utils';
import { registerGestureClass } from '../../../../../src/gestures';
export * from '@nativescript/core/ui/text-view/text-view-common';

function sizeEditor(editor, width, minHeight = 0) {
    editor.setFrameSize(NSMakeSize(Math.max(width, 1), Math.max(editor.frame.size.height, 1)));
    editor.sizeToFit();
    return NSMakeSize(editor.frame.size.width, Math.max(minHeight, editor.frame.size.height));
}

class CoreTextScrollView extends NSScrollView {
    // Mason measures foreign views through AppKit. Report the editor's size,
    // so the current viewport height doesn't become the next intrinsic size.
    get intrinsicContentSize() {
        const editor = this.documentView;
        if (!editor) {
            return NSMakeSize(0, 0);
        }
        const previous = editor.frame.size;
        const width = this.contentView.bounds.size.width || previous.width || 320;
        try {
            return sizeEditor(editor, width);
        } finally {
            editor.setFrameSize(previous);
        }
    }
}
registerGestureClass(CoreTextScrollView);

class NSTextViewDelegateImpl extends NSObject {
    static ObjCProtocols = [NSTextViewDelegate];
    _owner;
    static initWithOwner(owner) {
        const impl = NSTextViewDelegateImpl.new();
        impl._owner = owner;
        return impl;
    }
    textDidChange(notification) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            owner.textViewDidChange(notification.object);
        }
    }
    textDidBeginEditing(notification) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            owner.textViewDidBeginEditing(notification.object);
        }
    }
    textDidEndEditing(notification) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            owner.textViewDidEndEditing(notification.object);
        }
    }
    textViewShouldChangeTextInRangeReplacementString(textView, range, replacementString) {
        const owner = this._owner ? this._owner.deref() : null;
        if (owner) {
            return owner.textViewShouldChangeTextInRangeReplacementString(textView, range, String(replacementString));
        }
        return true;
    }
    textViewDoCommandBySelector(textView, selector) {
        const owner = this._owner?.deref();
        if (
            !owner?.isEnabled || !owner.editable ||
            String(selector) !== 'insertNewline:' ||
            !['done', 'send'].includes(owner.returnKeyType)
        ) {
            return false;
        }
        const marked = textView.hasMarkedText;
        if (typeof marked === 'function' ? marked.call(textView) : marked) {
            return false;
        }
        owner.notify({ eventName: TextViewBase.returnPressEvent, object: owner });
        return true;
    }
}
registerGestureClass(NSTextViewDelegateImpl);
export class TextView extends TextViewBase {
    nativeViewProtected; // NSScrollView
    _delegate;
    _hintLabel;
    _isEditing = false;
    get nativeTextViewProtected() {
        return this.nativeViewProtected ? this.nativeViewProtected.documentView : null;
    }
    createNativeView() {
        const scrollView = CoreTextScrollView.alloc().init();
        const textView = NSTextView.alloc().init();
        textView.verticallyResizable = true;
        if (!textView.font) {
            textView.font = NSFont.systemFontOfSize(12);
        }
        scrollView.documentView = textView;
        scrollView.hasVerticalScroller = true;
        scrollView.drawsBackground = false;
        return scrollView;
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = NSTextViewDelegateImpl.initWithOwner(new WeakRef(this));
        this.nativeTextViewProtected.delegate = this._delegate;
        this._refreshHintState();
    }
    disposeNativeView() {
        if (this.nativeTextViewProtected) {
            this.nativeTextViewProtected.delegate = null;
        }
        this._delegate = null;
        if (this._hintLabel) {
            this._hintLabel.removeFromSuperview();
            this._hintLabel = null;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    focus() {
        const editor = this.nativeTextViewProtected;
        if (!this.isEnabled || !editor?.window?.makeFirstResponder(editor)) {
            return false;
        }
        this.textViewDidBeginEditing(editor);
        return true;
    }
    textViewDidBeginEditing(_textView) {
        if (this._isEditing) {
            return;
        }
        this._isEditing = true;
        this._refreshHintState();
        this.notify({ eventName: TextViewBase.focusEvent, object: this });
    }
    textViewDidEndEditing(textView) {
        if (!this._isEditing) {
            return;
        }
        this._isEditing = false;
        if (this.updateTextTrigger === 'focusLost') {
            textProperty.nativeValueChange(this, String(textView.string));
        }
        this._refreshHintState();
        this.notify({ eventName: TextViewBase.blurEvent, object: this });
    }
    textViewDidChange(textView) {
        if (this.updateTextTrigger === 'textChanged') {
            textProperty.nativeValueChange(this, String(textView.string));
        }
        this._refreshHintState();
        this.requestLayout();
    }
    textViewShouldChangeTextInRangeReplacementString(textView, range, replacementString) {
        const delta = replacementString.length - range.length;
        if (delta > 0) {
            const maxLength = this.maxLength;
            if (maxLength > 0 && String(textView.string).length + delta > maxLength) {
                return false;
            }
        }
        if (replacementString === '\n' && !['done', 'send'].includes(this.returnKeyType)) {
            this.notify({ eventName: TextViewBase.returnPressEvent, object: this });
        }
        return true;
    }
    _refreshHintState() {
        const textView = this.nativeTextViewProtected;
        if (!textView) {
            return;
        }
        const hint = this.hint;
        const empty = !String(textView.string || '').length && !this._isEditing;
        const show = empty && hint !== null && hint !== undefined && hint !== '';
        if (show && !this._hintLabel) {
            const label = NSTextField.alloc().init();
            label.editable = false;
            label.bezeled = false;
            label.drawsBackground = false;
            label.textColor = NSColor.secondaryLabelColor;
            label.lineBreakMode = 4; // NSLineBreakByTruncatingTail
            this._hintLabel = label;
            this.nativeViewProtected.addSubview(label);
        }
        if (this._hintLabel) {
            this._hintLabel.hidden = !show;
            if (show) {
                this._hintLabel.stringValue = String(hint);
                // Unflipped superview: y is measured from the bottom.
                const parentH = Number(this.nativeViewProtected.bounds.size.height) || 0;
                this._hintLabel.frame = { origin: { x: 5, y: Math.max(0, parentH - 4 - 17) }, size: { width: 200, height: 17 } };
            }
        }
    }
    [textProperty.getDefault]() {
        return '';
    }
    [textProperty.setNative](value) {
        const textView = this.nativeTextViewProtected;
        if (textView) {
            textView.string = value == null ? '' : String(value);
        }
        this._refreshHintState();
        this.requestLayout();
    }
    [hintProperty.getDefault]() {
        return '';
    }
    [hintProperty.setNative](_value) {
        this._refreshHintState();
    }
    [editableProperty.getDefault]() {
        return this.nativeTextViewProtected ? this.nativeTextViewProtected.editable : true;
    }
    [editableProperty.setNative](value) {
        if (this.nativeTextViewProtected) {
            this.nativeTextViewProtected.editable = this.isEnabled && value;
        }
    }
    [isEnabledProperty.getDefault]() {
        return true;
    }
    [isEnabledProperty.setNative](enabled) {
        const editor = this.nativeTextViewProtected;
        if (editor) {
            editor.editable = enabled && this.editable;
            editor.selectable = enabled;
        }
    }
    [autocorrectProperty.setNative](value) {
        if (this.nativeTextViewProtected) {
            this.nativeTextViewProtected.automaticSpellingCorrectionEnabled = value;
        }
    }
    [maxLengthProperty.setNative](_value) {
        // enforced in textViewShouldChangeTextInRangeReplacementString
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const textView = this.nativeTextViewProtected;
        if (!textView) {
            return;
        }
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        // Measure from the layout manager's used rect at the proposed width —
        // the same contract iOS follows via UITextView sizeThatFits.
        const container = textView.textContainer;
        const inset = textView.textContainerInset;
        const proposed = widthMode === layout.UNSPECIFIED ? 1e7 : layout.toDeviceIndependentPixels(width);
        // usedRect only reports glyphs once AppKit lays them out — setFrameSize
        // + sizeToFit is the forcing path that works here (verified in the
        // widget-text-view case); restore the frame afterwards.
        const savedSize = textView.frame.size;
        let used;
        try {
            used = sizeEditor(textView, proposed);
        } finally {
            textView.setFrameSize(savedSize);
        }
        const contentW = used.width + inset.width * 2 + container.lineFragmentPadding * 2;
        const contentH = used.height + inset.height * 2;
        const nativeWidth = widthMode === layout.EXACTLY ? width : layout.round(layout.toDevicePixels(contentW));
        const nativeHeight = heightMode === layout.EXACTLY ? height : layout.round(layout.toDevicePixels(contentH));
        const widthAndState = View.resolveSizeAndState(nativeWidth, width, widthMode, 0);
        const heightAndState = View.resolveSizeAndState(nativeHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }
    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        const editor = this.nativeTextViewProtected;
        const viewport = this.nativeViewProtected?.contentView.bounds.size;
        if (!editor || !viewport?.width) {
            return;
        }
        const previousWidth = editor.frame.size.width;
        const size = sizeEditor(editor, viewport.width, viewport.height);
        editor.setFrameSize(NSMakeSize(viewport.width, size.height));
        if (previousWidth !== viewport.width) {
            this.requestLayout();
        }
    }
}
CSSType('TextView')(TextView);
