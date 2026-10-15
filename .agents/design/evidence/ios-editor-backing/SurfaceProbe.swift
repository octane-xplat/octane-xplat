// Compile/link probe only. No runtime or document-fidelity assertion.
import Foundation
import UIKit
import Lexical
import EditorHistoryPlugin
import LexicalListPlugin

final class ProbeTaskNode: ElementNode {
    override class func getType() -> NodeType { NodeType(rawValue: "probeTask") }
    override func clone() -> Self { Self(key) }
    override init(_ key: NodeKey?) { super.init(key) }
    required init(from decoder: Decoder) throws { try super.init(from: decoder) }
}

@objc(XplatEditorSurfaceProbe)
public final class SurfaceProbe: NSObject {
    private let surface: LexicalView
    @objc public override init() {
        surface = LexicalView(
            editorConfig: EditorConfig(theme: Theme(), plugins: [EditorHistoryPlugin(), ListPlugin()]),
            featureFlags: FeatureFlags())
        super.init()
    }
    @objc public var view: UIView { surface }
    @objc public func snapshot() throws -> String { try surface.editor.getEditorState().toJSON() }
    @objc public func undo() { _ = surface.editor.dispatchCommand(type: .undo) }
    @objc public func exerciseTreeAPI() throws {
        try surface.editor.registerNode(nodeType: ProbeTaskNode.getType(), class: ProbeTaskNode.self)
        try surface.editor.update {
            let parent = ProbeTaskNode(nil)
            let child = ProbeTaskNode(nil)
            try parent.append([child])
            try getRoot()?.append([parent])
            _ = try child.selectStart()
        }
    }
}
