import Foundation
import AppKit
import WebKit
import PDFKit

private final class XplatPrintHTML: NSObject, WKNavigationDelegate {
    let web: WKWebView
    let window: NSWindow
    private var completion: ((Bool) -> Void)?
    private var timer: Timer?
    init(width: Double, height: Double) {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = false
        let frame = NSRect(x: 0, y: 0, width: width, height: height)
        web = WKWebView(frame: frame, configuration: configuration)
        window = NSWindow(contentRect: frame, styleMask: [.titled], backing: .buffered, defer: false)
        super.init()
        window.isReleasedWhenClosed = false
        window.contentView = web
        web.navigationDelegate = self
    }
    func load(_ html: String, completion: @escaping (Bool) -> Void) {
        self.completion = completion
        timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: false) { [weak self] _ in self?.finish(false) }
        web.loadHTMLString(html.isEmpty ? "<html><body><div style='height:1px'></div></body></html>" : html, baseURL: nil)
    }
    private func finish(_ success: Bool) {
        timer?.invalidate(); timer = nil
        let callback = completion; completion = nil
        callback?(success)
    }
    func dispose() { timer?.invalidate(); timer = nil; completion = nil; web.stopLoading(); web.navigationDelegate = nil; window.close() }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { finish(true) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(false) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(false) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { finish(false) }
}

@objc(XplatPrintEngine)
@objcMembers
public final class XplatPrintEngine: NSObject {
    private var busy = false
    private var htmlTask: XplatPrintHTML?
    private var operation: NSPrintOperation?
    private var completion: ((String) -> Void)?
    private var options: [String: Any] = [:]
    private var output: URL?
    private var owned = Set<String>()
    private var network: URLSessionDataTask?
    private var pdfDocument: PDFDocument?
    public func canPrint() -> Bool { return true }
    private func failure(_ code: String = "ERR_PRINT_FAILED") -> [String: Any] {
        return ["ok": false, "code": code, "message": code == "ERR_PRINT_CANCELLED" ? "Printing was canceled" : "The document could not be printed or exported"]
    }
    private func respond(_ value: [String: Any], _ callback: (String) -> Void) {
        let bytes = try! JSONSerialization.data(withJSONObject: value)
        callback(String(data: bytes, encoding: .utf8)!)
    }
    private func finish(_ value: [String: Any]) {
        guard let callback = completion else { return }
        completion = nil
        if value["ok"] as? Bool != true, let url = output { try? FileManager.default.removeItem(at: url) }
        let retiredTask = htmlTask, retiredOperation = operation, retiredDocument = pdfDocument
        operation = nil; pdfDocument = nil; network = nil; output = nil; options = [:]
        htmlTask = nil
        // AppKit still owns the delegate callback stack. Retire views before admitting the next job.
        DispatchQueue.main.async {
            retiredTask?.dispose()
            withExtendedLifetime(retiredOperation) {}
            withExtendedLifetime(retiredDocument) {}
            self.busy = false
            self.respond(value, callback)
        }
    }
    private func begin(_ json: String, _ callback: @escaping (String) -> Void) -> Bool {
        guard Thread.isMainThread else { respond(failure(), callback); return false }
        guard !busy else { respond(failure("ERR_PRINT_BUSY"), callback); return false }
        guard let data = json.data(using: .utf8), let decoded = try? JSONSerialization.jsonObject(with: data), let options = decoded as? [String: Any] else { respond(failure(), callback); return false }
        self.options = options; completion = callback; busy = true
        return true
    }
    private func printInfo() -> NSPrintInfo {
        let info = NSPrintInfo()
        info.jobDisposition = .spool
        info.paperSize = NSSize(width: options["width"] as? Double ?? 612, height: options["height"] as? Double ?? 792)
        let margins = options["margins"] as? [String: Double] ?? [:]
        info.topMargin = margins["top"] ?? 0; info.bottomMargin = margins["bottom"] ?? 0
        info.leftMargin = margins["left"] ?? 0; info.rightMargin = margins["right"] ?? 0
        info.isHorizontallyCentered = false; info.isVerticallyCentered = false
        return info
    }
    private func loadHTML(_ completion: @escaping (XplatPrintHTML?) -> Void) {
        let task = XplatPrintHTML(width: options["width"] as? Double ?? 612, height: options["height"] as? Double ?? 792)
        htmlTask = task
        task.load(options["html"] as? String ?? "") { success in completion(success ? task : nil) }
    }
    private func run(_ operation: NSPrintOperation, window: NSWindow, panel: Bool) {
        self.operation = operation
        operation.showsPrintPanel = panel
        operation.showsProgressPanel = false
        operation.canSpawnSeparateThread = true
        operation.runModal(for: window, delegate: self, didRun: #selector(XplatPrintEngine.printDone(_:success:context:)), contextInfo: nil)
    }
    public func render(_ json: String, completion: @escaping (String) -> Void) {
        guard begin(json, completion) else { return }
        guard options["useMarkupFormatter"] as? Bool != true, (options["textZoom"] as? Int ?? 100) == 100 else { finish(failure()); return }
        loadHTML { [weak self] task in
            guard let self = self else { return }
            guard let task = task else { self.finish(self.failure()); return }
            let destination = FileManager.default.temporaryDirectory.appendingPathComponent("xplat-print-\(UUID().uuidString).pdf")
            self.output = destination
            let info = self.printInfo()
            info.jobDisposition = .save
            info.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL] = destination
            self.run(task.web.printOperation(with: info), window: task.window, panel: false)
        }
    }
    private func pdf(_ value: String, completion: @escaping (PDFDocument?) -> Void) {
        let limit = 64 * 1024 * 1024
        if value.hasPrefix("data:application/pdf;base64,") {
            let encoded = String(value.dropFirst("data:application/pdf;base64,".count))
            guard encoded.utf8.count <= limit * 4 / 3 + 4, let data = Data(base64Encoded: encoded), data.count <= limit else { completion(nil); return }
            completion(PDFDocument(data: data)); return
        }
        let url = value.hasPrefix("/") ? URL(fileURLWithPath: value) : URL(string: value)
        guard let url = url else { completion(nil); return }
        if url.isFileURL {
            guard let values = try? url.resourceValues(forKeys: [.fileSizeKey]), let count = values.fileSize, count <= limit else { completion(nil); return }
            completion(PDFDocument(url: url)); return
        }
        guard url.scheme?.lowercased() == "https" else { completion(nil); return }
        var request = URLRequest(url: url); request.timeoutInterval = 30
        network = URLSession.shared.dataTask(with: request) { data, response, error in
            let valid = error == nil && (response as? HTTPURLResponse)?.statusCode == 200 && (data?.count ?? limit + 1) <= limit
            DispatchQueue.main.async { completion(valid && data != nil ? PDFDocument(data: data!) : nil) }
        }
        network?.resume()
    }
    public func present(_ json: String, completion: @escaping (String) -> Void) {
        guard begin(json, completion) else { return }
        guard let parent = NSApplication.shared.keyWindow ?? NSApplication.shared.mainWindow,
              options["printerUrl"] == nil, options["useMarkupFormatter"] as? Bool != true else { finish(failure()); return }
        if let uri = options["uri"] as? String {
            pdf(uri) { [weak self] document in
                guard let self = self else { return }
                guard let document = document, document.pageCount > 0,
                      let operation = document.printOperation(for: self.printInfo(), scalingMode: .pageScaleToFit, autoRotate: true) else { self.finish(self.failure()); return }
                self.pdfDocument = document
                self.run(operation, window: parent, panel: true)
            }
        } else if options["html"] != nil {
            loadHTML { [weak self] task in
                guard let self = self else { return }
                guard let task = task else { self.finish(self.failure()); return }
                self.run(task.web.printOperation(with: self.printInfo()), window: parent, panel: true)
            }
        } else { finish(failure()) }
    }
    @objc private func printDone(_ operation: NSPrintOperation, success: Bool, context: UnsafeMutableRawPointer?) {
        guard completion != nil else { return }
        guard success else { finish(failure()); return }
        guard let destination = output else { finish(["ok": true]); return }
        guard let pdf = PDFDocument(url: destination), pdf.pageCount > 0, pdf.pageCount <= 1000 else { finish(failure()); return }
        var result: [String: Any] = ["ok": true, "uri": destination.absoluteString, "numberOfPages": pdf.pageCount]
        if options["base64"] as? Bool == true {
            guard let data = try? Data(contentsOf: destination) else { finish(failure()); return }
            result["base64"] = data.base64EncodedString()
        }
        owned.insert(destination.absoluteString)
        finish(result)
    }
    public func remove(_ value: String) -> Bool {
        guard owned.contains(value), let url = URL(string: value) else { return true }
        do { if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }; owned.remove(value); return true }
        catch { return false }
    }
}
