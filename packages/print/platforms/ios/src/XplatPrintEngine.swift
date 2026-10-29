import Foundation
import UIKit
import WebKit
import PDFKit

private final class XplatPaperRenderer: UIPrintPageRenderer {
    let paper: CGRect
    let content: CGRect
    init(width: Double, height: Double, margins: [String: Double]) {
        paper = CGRect(x: 0, y: 0, width: width, height: height)
        content = CGRect(x: margins["left"] ?? 0, y: margins["top"] ?? 0, width: width - (margins["left"] ?? 0) - (margins["right"] ?? 0), height: height - (margins["top"] ?? 0) - (margins["bottom"] ?? 0))
        super.init()
    }
    override var paperRect: CGRect { return paper }
    override var printableRect: CGRect { return content }
}

private final class XplatPrintHTML: NSObject, WKNavigationDelegate {
    let web: WKWebView
    private var completion: ((Bool) -> Void)?
    private var timer: Timer?
    init(width: Double, height: Double) {
        let configuration = WKWebViewConfiguration()
        if #available(iOS 14.0, *) { configuration.defaultWebpagePreferences.allowsContentJavaScript = false }
        else { configuration.preferences.javaScriptEnabled = false }
        web = WKWebView(frame: CGRect(x: 0, y: 0, width: width, height: height), configuration: configuration)
        super.init()
        web.navigationDelegate = self
    }
    func load(_ html: String, completion: @escaping (Bool) -> Void) {
        self.completion = completion
        timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: false) { [weak self] _ in self?.finish(false) }
        web.loadHTMLString(html, baseURL: nil)
    }
    func dispose() { timer?.invalidate(); timer = nil; completion = nil; web.stopLoading(); web.navigationDelegate = nil; web.removeFromSuperview() }
    private func finish(_ success: Bool) {
        timer?.invalidate(); timer = nil
        let callback = completion; completion = nil
        callback?(success)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // A native DOM read flushes WebKit's pending layout before its print formatter is used.
        webView.evaluateJavaScript("document.body ? document.body.scrollHeight : 0") { [weak self] _, error in self?.finish(error == nil) }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(false) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(false) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { finish(false) }
}

@objc(XplatPrintEngine)
@objcMembers
public final class XplatPrintEngine: NSObject {
    private var busy = false
    private var htmlTask: XplatPrintHTML?
    private var owned = Set<String>()
    private var picker: UIPrinterPickerController?
    private var network: URLSessionDataTask?

    public func canPrint() -> Bool { return UIPrintInteractionController.isPrintingAvailable }
    private func decode(_ json: String) -> [String: Any]? {
        guard let data = json.data(using: .utf8), let decoded = try? JSONSerialization.jsonObject(with: data) else { return nil }
        return decoded as? [String: Any]
    }
    private func respond(_ value: [String: Any], _ completion: (String) -> Void) {
        let bytes = try! JSONSerialization.data(withJSONObject: value)
        completion(String(data: bytes, encoding: .utf8)!)
    }
    private func finish(_ value: [String: Any], _ completion: (String) -> Void) {
        htmlTask?.dispose(); htmlTask = nil; picker = nil; network = nil; busy = false
        let controller = UIPrintInteractionController.shared
        controller.printFormatter = nil; controller.printingItem = nil; controller.printPageRenderer = nil
        respond(value, completion)
    }
    private func failure(_ code: String = "ERR_PRINT_FAILED") -> [String: Any] {
        return ["ok": false, "code": code, "message": code == "ERR_PRINT_CANCELLED" ? "Printing was canceled" : "The document could not be printed or exported"]
    }
    private func begin(_ completion: (String) -> Void) -> Bool {
        guard Thread.isMainThread else { respond(failure(), completion); return false }
        guard !busy else { respond(failure("ERR_PRINT_BUSY"), completion); return false }
        busy = true
        return true
    }
    private func formatter(_ options: [String: Any], completion: @escaping (UIPrintFormatter?) -> Void) {
        let html = options["html"] as? String ?? ""
        if options["useMarkupFormatter"] as? Bool == true { completion(UIMarkupTextPrintFormatter(markupText: html)); return }
        let task = XplatPrintHTML(width: options["width"] as? Double ?? 612, height: options["height"] as? Double ?? 792)
        htmlTask = task
        task.load(html) { success in completion(success ? task.web.viewPrintFormatter() : nil) }
    }
    public func render(_ json: String, completion: @escaping (String) -> Void) {
        guard begin(completion) else { return }
        guard let options = decode(json), (options["textZoom"] as? Int ?? 100) == 100 else { finish(failure(), completion); return }
        formatter(options) { [weak self] formatter in
            guard let self = self else { return }
            guard let formatter = formatter else { self.finish(self.failure(), completion); return }
            let renderer = XplatPaperRenderer(width: options["width"] as? Double ?? 612, height: options["height"] as? Double ?? 792, margins: options["margins"] as? [String: Double] ?? [:])
            renderer.addPrintFormatter(formatter, startingAtPageAt: 0)
            renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
            let pages = max(1, renderer.numberOfPages)
            guard pages <= 1000 else { self.finish(self.failure(), completion); return }
            let bytes = NSMutableData()
            UIGraphicsBeginPDFContextToData(bytes, renderer.paperRect, nil)
            for index in 0..<pages {
                UIGraphicsBeginPDFPageWithInfo(renderer.paperRect, nil)
                if renderer.numberOfPages > 0 { renderer.drawPage(at: index, in: renderer.paperRect) }
            }
            UIGraphicsEndPDFContext()
            let data = bytes as Data
            guard let document = PDFDocument(data: data), document.pageCount == pages else { self.finish(self.failure(), completion); return }
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("xplat-print-\(UUID().uuidString).pdf")
            do {
                try data.write(to: url, options: .atomic)
                self.owned.insert(url.absoluteString)
                var result: [String: Any] = ["ok": true, "uri": url.absoluteString, "numberOfPages": document.pageCount]
                if options["base64"] as? Bool == true { result["base64"] = data.base64EncodedString() }
                self.finish(result, completion)
            } catch { try? FileManager.default.removeItem(at: url); self.finish(self.failure(), completion) }
        }
    }
    private func pdf(_ value: String, completion: @escaping (Data?) -> Void) {
        let limit = 64 * 1024 * 1024
        if value.hasPrefix("data:application/pdf;base64,") {
            let encoded = String(value.dropFirst("data:application/pdf;base64,".count))
            guard encoded.utf8.count <= limit * 4 / 3 + 4, let data = Data(base64Encoded: encoded), data.count <= limit, PDFDocument(data: data) != nil else { completion(nil); return }
            completion(data); return
        }
        let url = value.hasPrefix("/") ? URL(fileURLWithPath: value) : URL(string: value)
        guard let url = url else { completion(nil); return }
        if url.isFileURL {
            guard let values = try? url.resourceValues(forKeys: [.fileSizeKey]), let count = values.fileSize, count <= limit,
                  let data = try? Data(contentsOf: url), PDFDocument(data: data) != nil else { completion(nil); return }
            completion(data); return
        }
        guard url.scheme?.lowercased() == "https" else { completion(nil); return }
        var request = URLRequest(url: url); request.timeoutInterval = 30
        network = URLSession.shared.dataTask(with: request) { data, response, error in
            let valid = error == nil && (response as? HTTPURLResponse)?.statusCode == 200 && (data?.count ?? limit + 1) <= limit
            DispatchQueue.main.async { completion(valid && data != nil && PDFDocument(data: data!) != nil ? data : nil) }
        }
        network?.resume()
    }
    public func present(_ json: String, presenter: UIViewController, completion: @escaping (String) -> Void) {
        guard begin(completion) else { return }
        guard let options = decode(json), UIApplication.shared.applicationState == .active, presenter.viewIfLoaded?.window != nil else { finish(failure(), completion); return }
        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .general
        info.orientation = options["orientation"] as? String == "landscape" ? .landscape : .portrait
        info.jobName = "Document"
        controller.printInfo = info
        let show: () -> Void = { [weak self] in
            guard let self = self else { return }
            let done: (UIPrintInteractionController, Bool, Error?) -> Void = { _, completed, error in self.finish(completed && error == nil ? ["ok": true] : self.failure(error != nil ? "ERR_PRINT_FAILED" : "ERR_PRINT_CANCELLED"), completion) }
            let accepted: Bool
            if let target = options["printerUrl"] as? String, let url = URL(string: target) { accepted = controller.print(to: UIPrinter(url: url), completionHandler: done) }
            else { accepted = controller.present(from: CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1), in: presenter.view, animated: true, completionHandler: done) }
            if !accepted && self.busy { self.finish(self.failure(), completion) }
        }
        if let uri = options["uri"] as? String {
            pdf(uri) { [weak self] data in
                guard let self = self else { return }
                guard let data = data else { self.finish(self.failure(), completion); return }
                controller.printingItem = data; show()
            }
        } else if options["html"] != nil {
            formatter(options) { [weak self] formatter in
                guard let self = self else { return }
                guard let formatter = formatter else { self.finish(self.failure(), completion); return }
                let renderer = XplatPaperRenderer(width: options["width"] as? Double ?? 612, height: options["height"] as? Double ?? 792, margins: options["margins"] as? [String: Double] ?? [:])
                renderer.addPrintFormatter(formatter, startingAtPageAt: 0); controller.printPageRenderer = renderer; show()
            }
        } else { finish(failure(), completion) }
    }
    public func select(_ presenter: UIViewController, completion: @escaping (String) -> Void) {
        guard begin(completion) else { return }
        guard UIApplication.shared.applicationState == .active, presenter.viewIfLoaded?.window != nil else { finish(failure(), completion); return }
        let picker = UIPrinterPickerController(initiallySelectedPrinter: nil)
        self.picker = picker
        let accepted = picker.present(from: CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1), in: presenter.view, animated: true) { [weak self] controller, selected, error in
            guard let self = self else { return }
            guard error == nil else { self.finish(self.failure(), completion); return }
            guard selected else { self.finish(self.failure("ERR_PRINT_CANCELLED"), completion); return }
            guard let printer = controller.selectedPrinter else { self.finish(self.failure(), completion); return }
            self.finish(["ok": true, "name": printer.displayName, "url": printer.url.absoluteString], completion)
        }
        if !accepted && busy { finish(failure(), completion) }
    }
    public func remove(_ value: String) -> Bool {
        guard owned.contains(value), let url = URL(string: value) else { return true }
        do { if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }; owned.remove(value); return true }
        catch { return false }
    }
}
