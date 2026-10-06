import Aztec
import Foundation
import UIKit

/// NativeScript-facing facade over AztecEditor-iOS `TextView`.
///
/// Every member reachable from JavaScript is `@objc`-visible and uses only
/// ObjC-representable types (String, Bool, NSNumber, NSArray, blocks), so the
/// NativeScript metadata generator sees the whole surface. The leaf drives
/// this view directly; block properties carry the event callbacks.
///
/// `placeholder` and sub/superscript toggles are wrapper-built: Aztec exposes
/// no native API for either. `taskList` and text alignment have no Aztec-iOS
/// equivalent at all — `applyFormat`/`isFormatActive` report them as
/// unsupported instead of faking a result.
@objcMembers
public final class XplatAztecEditorView: UIView, UITextViewDelegate {

	/// FormattingIdentifier rawValue -> leaf format name. Aztec's identifier
	/// map has no entries for `pre`, sub/superscript, task lists, or
	/// alignment; those are checked at the attribute level below or honestly
	/// reported as unsupported.
	private static let identifierFormats: [String: String] = [
		"bold": "bold",
		"italic": "italic",
		"underline": "underline",
		"strikethrough": "strikethrough",
		"code": "code",
		"blockquote": "blockquote",
		"orderedlist": "orderedList",
		"unorderedlist": "bulletList",
		"mark": "highlight",
		"p": "paragraph",
		"header1": "heading1",
		"header2": "heading2",
		"header3": "heading3",
		"header4": "heading4",
		"header5": "heading5",
		"header6": "heading6",
		"horizontalruler": "horizontalRule",
		"link": "link",
	]

	public let textView = TextView(
		defaultFont: UIFont.preferredFont(forTextStyle: .body),
		defaultMissingImage: UIImage())
	private let placeholderLabel = UILabel()

	// MARK: - JS callbacks

	public var onTextChange: (() -> Void)?
	public var onSelectionChange: ((NSNumber, NSNumber, NSArray) -> Void)?
	public var onFocus: (() -> Void)?
	public var onBlur: (() -> Void)?

	public override init(frame: CGRect) {
		super.init(frame: frame)
		textView.delegate = self
		textView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		addSubview(textView)

		placeholderLabel.textColor = .secondaryLabel
		placeholderLabel.font = textView.font
		placeholderLabel.numberOfLines = 1
		placeholderLabel.isUserInteractionEnabled = false
		addSubview(placeholderLabel)
		updatePlaceholderVisibility()
	}

	@available(*, unavailable)
	public required init?(coder: NSCoder) {
		fatalError("init(coder:) is not supported")
	}

	public override func layoutSubviews() {
		super.layoutSubviews()
		textView.frame = bounds
		let inset = textView.textContainerInset
		let padding = textView.textContainer.lineFragmentPadding
		placeholderLabel.frame = CGRect(
			x: inset.left + padding,
			y: inset.top,
			width: max(0, bounds.width - inset.left - inset.right - padding * 2),
			height: placeholderLabel.font.lineHeight)
	}

	// MARK: - Props

	public var placeholder: String? {
		get { placeholderLabel.text }
		set {
			placeholderLabel.text = newValue
			updatePlaceholderVisibility()
		}
	}

	public var editable: Bool {
		get { textView.isEditable }
		set { textView.isEditable = newValue }
	}

	private func updatePlaceholderVisibility() {
		let hasText = textView.textStorage.length > 0
		placeholderLabel.isHidden = hasText || (placeholderLabel.text ?? "").isEmpty
	}

	// MARK: - Document

	public func getHTML() -> String {
		textView.getHTML(prettify: false)
	}

	public func setHTML(_ html: String) {
		textView.setHTML(html)
		updatePlaceholderVisibility()
	}

	// MARK: - Formats

	/// Returns false for formats this engine cannot apply (`taskList`,
	/// `align*`, `link` — the link API is `linkTo`) and unknown names.
	public func applyFormat(_ format: String) -> Bool {
		let range = textView.selectedRange
		switch format {
		case "bold": textView.toggleBold(range: range)
		case "italic": textView.toggleItalic(range: range)
		case "underline": textView.toggleUnderline(range: range)
		case "strikethrough": textView.toggleStrikethrough(range: range)
		case "code": textView.toggleCode(range: range)
		case "blockquote": textView.toggleBlockquote(range: range)
		case "bulletList": textView.toggleUnorderedList(range: range)
		case "orderedList": textView.toggleOrderedList(range: range)
		case "codeBlock": textView.togglePre(range: range)
		case "paragraph": textView.toggleHeader(.none, range: range)
		case "heading1": textView.toggleHeader(.h1, range: range)
		case "heading2": textView.toggleHeader(.h2, range: range)
		case "heading3": textView.toggleHeader(.h3, range: range)
		case "heading4": textView.toggleHeader(.h4, range: range)
		case "heading5": textView.toggleHeader(.h5, range: range)
		case "heading6": textView.toggleHeader(.h6, range: range)
		case "highlight": textView.toggleMark(range: range, color: nil, resetColor: true)
		case "horizontalRule": textView.replaceWithHorizontalRuler(at: range)
		case "subscript": toggleBaselineOffset(-4, in: range)
		case "superscript": toggleBaselineOffset(4, in: range)
		default: return false
		}
		return true
	}

	public func isFormatActive(_ format: String) -> Bool {
		activeFormatSet().contains(format)
	}

	public func activeFormats() -> [String] {
		activeFormatSet().sorted()
	}

	private func activeFormatSet() -> Set<String> {
		var out = Set<String>()
		for identifier in textView.formattingIdentifiersSpanningRange(textView.selectedRange) {
			if let name = XplatAztecEditorView.identifierFormats[identifier.rawValue] {
				out.insert(name)
			}
		}
		let attributeSets = activeAttributeSets()
		if !attributeSets.isEmpty {
			if attributeSets.allSatisfy(hasPreProperty) { out.insert("codeBlock") }
			if attributeSets.allSatisfy({ baselineOffset(of: $0) > 0 }) { out.insert("superscript") }
			if attributeSets.allSatisfy({ baselineOffset(of: $0) < 0 }) { out.insert("subscript") }
		}
		return out
	}

	/// The attribute dictionaries the identifier check would consult:
	/// typing attributes on an empty document, the attributes at the caret
	/// for a collapsed selection, every run in the selection otherwise.
	private func activeAttributeSets() -> [[NSAttributedString.Key: Any]] {
		let storage = textView.textStorage
		let range = textView.selectedRange
		guard storage.length > 0 else { return [textView.typingAttributes] }
		if range.length == 0 {
			let index = min(range.location, storage.length - 1)
			return [storage.attributes(at: index, effectiveRange: nil)]
		}
		var sets: [[NSAttributedString.Key: Any]] = []
		storage.enumerateAttributes(in: range, options: []) { attributes, _, _ in
			sets.append(attributes)
		}
		return sets
	}

	private func hasPreProperty(_ attributes: [NSAttributedString.Key: Any]) -> Bool {
		guard let style = attributes[.paragraphStyle] as? ParagraphStyle else { return false }
		// HTMLPre is module-internal to Aztec — match the property by type name.
		return style.hasProperty { String(describing: Swift.type(of: $0)) == "HTMLPre" }
	}

	private func baselineOffset(of attributes: [NSAttributedString.Key: Any]) -> Int {
		(attributes[.baselineOffset] as? NSNumber)?.intValue ?? 0
	}

	/// Aztec-iOS has no public sub/superscript toggle — apply or clear
	/// `.baselineOffset` directly; the HTML converter serializes it back as
	/// `<sub>`/`<sup>`. Collapsed selections toggle the typing attributes.
	private func toggleBaselineOffset(_ offset: Int, in range: NSRange) {
		let storage = textView.textStorage
		if range.length == 0 || storage.length == 0 {
			var attributes = textView.typingAttributes
			let current = baselineOffset(of: attributes)
			attributes[.baselineOffset] = current == offset ? nil : NSNumber(value: offset)
			textView.typingAttributes = attributes
			return
		}
		guard range.location + range.length <= storage.length else { return }

		let original = storage.attributedSubstring(from: range)
		let restoredRange = NSRange(location: range.location, length: range.length)
		textView.undoManager?.registerUndo(withTarget: textView) { target in
			target.textStorage.replaceCharacters(in: restoredRange, with: original)
			target.delegate?.textViewDidChange?(target)
		}

		storage.beginEditing()
		storage.enumerateAttribute(.baselineOffset, in: range, options: []) { value, subrange, _ in
			let current = (value as? NSNumber)?.intValue ?? 0
			if current == offset {
				storage.removeAttribute(.baselineOffset, range: subrange)
			} else {
				storage.addAttribute(.baselineOffset, value: NSNumber(value: offset), range: subrange)
			}
		}
		storage.endEditing()
		textViewDidChange(textView)
	}

	// MARK: - Links

	public func linkTo(_ urlString: String, anchor: String?) -> Bool {
		guard let url = URL(string: urlString) else { return false }
		textView.setLink(url, title: anchor ?? urlString, inRange: textView.selectedRange)
		return true
	}

	public func removeLink() {
		textView.removeLink(inRange: textView.selectedRange)
	}

	// MARK: - History

	public func undo() {
		textView.undoManager?.undo()
	}

	public func redo() {
		textView.undoManager?.redo()
	}

	// MARK: - Structural commands

	/// Block split at the caret — Aztec's `insertText` runs the same
	/// paragraph/list handling as a real Enter keystroke. A non-collapsed
	/// selection is deleted first, matching the leaf contract.
	public func split() -> Bool {
		let range = textView.selectedRange
		guard range.location != NSNotFound,
			range.location + range.length <= textView.textStorage.length
		else { return false }
		if range.length > 0 {
			textView.deleteBackward()
		}
		textView.insertText("\n")
		return true
	}

	/// Merge into the previous block — Backspace at a collapsed caret that
	/// sits directly after a `\n` boundary, matching the leaf contract.
	public func join() -> Bool {
		let range = textView.selectedRange
		guard range.length == 0, range.location > 0,
			range.location <= textView.textStorage.length
		else { return false }
		let text = textView.textStorage.string as NSString
		guard text.character(at: range.location - 1) == 0x000A else { return false }
		textView.deleteBackward()
		return true
	}

	/// `increaseIndent` nests a list item under its previous sibling or
	/// deepens a blockquote; on plain blocks Aztec falls back to a `\t`
	/// insert, so indent is available whenever the view can edit.
	public func canIndent() -> Bool {
		textView.isEditable
	}

	public func indent() -> Bool {
		guard canIndent() else { return false }
		textView.increaseIndent()
		return true
	}

	/// `decreaseIndent` only acts on list/blockquote typing attributes —
	/// there is no plain-block outdent, so report availability up front.
	public func canOutdent() -> Bool {
		guard textView.isEditable else { return false }
		guard let style = textView.typingAttributes[.paragraphStyle] as? ParagraphStyle else {
			return false
		}
		// TextList/Blockquote/HTMLLi are module-internal to Aztec.
		return style.hasProperty {
			let name = String(describing: Swift.type(of: $0))
			return name == "TextList" || name == "Blockquote" || name == "HTMLLi"
		}
	}

	public func outdent() -> Bool {
		guard canOutdent() else { return false }
		textView.decreaseIndent()
		return true
	}

	// MARK: - Focus

	public func focus() {
		_ = textView.becomeFirstResponder()
	}

	public func blur() {
		_ = textView.resignFirstResponder()
	}

	public func focused() -> Bool {
		textView.isFirstResponder
	}

	// MARK: - UITextViewDelegate

	public func textViewDidChange(_ textView: UITextView) {
		updatePlaceholderVisibility()
		onTextChange?()
	}

	public func textViewDidChangeSelection(_ textView: UITextView) {
		let range = self.textView.selectedRange
		onSelectionChange?(
			NSNumber(value: range.location),
			NSNumber(value: range.location + range.length),
			activeFormats() as NSArray)
	}

	public func textViewDidBeginEditing(_ textView: UITextView) {
		onFocus?()
	}

	public func textViewDidEndEditing(_ textView: UITextView) {
		onBlur?()
	}
}
