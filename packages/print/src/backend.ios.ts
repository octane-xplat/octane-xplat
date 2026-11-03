import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
import { invoke, fileResult, printerResult } from './native-reply'

// The iOS backend drives UIKit/WebKit/PDFKit directly through the NativeScript
// ObjC bridge; no Swift facade is required. PDFKit sits outside the default
// link set, so the framework is loaded through NSBundle before first use.
declare function NSMakeRange(location: number, length: number): NSRange

declare const PDFDocument:
  | {
      alloc(): {
        initWithURL(url: NSURL): NativePDF | null
        initWithData(data: NSData): NativePDF | null
      }
    }
  | undefined

interface NativePDF {
  readonly pageCount: number
}

const pdfKit = (): typeof PDFDocument => {
  try {
    NSBundle.bundleWithPath('/System/Library/Frameworks/PDFKit.framework').load()
  } catch {
    // A missing framework resolves to an unavailable engine below.
  }
  return typeof PDFDocument === 'undefined' ? undefined : PDFDocument
}

// WebKit and PDFKit are optional link members; loading them dynamically is
// harmless when an app already links them.
const webKit = (): boolean => {
  try {
    NSBundle.bundleWithPath('/System/Library/Frameworks/WebKit.framework').load()
  } catch {
    // Unavailable frameworks resolve below.
  }
  return typeof WKWebView !== 'undefined'
}

const bridge = (): boolean =>
  webKit() && pdfKit() !== undefined && typeof UIPrintInteractionController !== 'undefined'

const LIMIT = 64 * 1024 * 1024
const applicationStateActive = 0

type Payload = Record<string, unknown>
type Reply = (payload: Payload) => void

let busy = false
let htmlTask: HtmlTask | undefined
let picker: UIPrinterPickerController | undefined
let network: NSURLSessionDataTask | undefined
const owned = new Set<string>()

const failure = (code = 'ERR_PRINT_FAILED'): Payload => ({
  ok: false,
  code,
  message:
    code === 'ERR_PRINT_CANCELLED'
      ? 'Printing was canceled'
      : 'The document could not be printed or exported',
})

function respond(value: Payload, reply: Reply) {
  htmlTask?.dispose()
  htmlTask = undefined
  picker = undefined
  network = undefined
  busy = false
  const controller = UIPrintInteractionController.sharedPrintController
  controller.printFormatter = null
  controller.printingItem = null
  controller.printPageRenderer = null
  reply(value)
}

function begin(reply: Reply): boolean {
  if (!NSThread.isMainThread) {
    respond(failure(), reply)
    return false
  }
  if (busy) {
    respond(failure('ERR_PRINT_BUSY'), reply)
    return false
  }
  busy = true
  return true
}

interface PaperLayout {
  renderer: UIPrintPageRenderer
  paper: CGRect
}

/** Native metadata omits Class.extend; keep the bridge assertion in one type. */
type Extendable<T> = {
  extend(
    members: Record<string, unknown>,
    options: { name?: string; protocols?: unknown[] },
  ): { new: () => T }
}

// paperRect/printableRect are read-only on UIPrintPageRenderer. JS subclass
// getter overrides never reach native dispatch on this runtime (probe
// evidence: KVC valueForKey returns CGRectZero and the JS body never runs),
// so the rects are written straight into the renderer's KVC storage instead.
function paperLayout(width: number, height: number, margins: Payload): PaperLayout {
  const left = Number(margins?.left ?? 0)
  const top = Number(margins?.top ?? 0)
  const right = Number(margins?.right ?? 0)
  const bottom = Number(margins?.bottom ?? 0)
  const paper = CGRectMake(0, 0, width, height)
  const renderer = UIPrintPageRenderer.new()
  renderer.setValueForKey(NSValue.valueWithCGRect(paper), 'paperRect')
  renderer.setValueForKey(
    NSValue.valueWithCGRect(CGRectMake(left, top, width - left - right, height - top - bottom)),
    'printableRect',
  )
  return { renderer, paper }
}

// WKNavigationDelegate methods deliver through NSObject.extend + ObjC
// protocols on this runtime; `class X extends NSObject` delegates never fire
// (probe evidence). Task state is handed through the per-instance owner field
// rather than receiver identity.
/** The per-instance `owner` field the delegate methods read from `this`. */
function navigationOwner(self: object): HtmlTask {
  if (!('owner' in self)) {
    throw new Error('navigation delegate missing owner')
  }
  return self.owner as HtmlTask
}

function navigationDelegate(task: HtmlTask): WKNavigationDelegate & NSObject {
  return (NSObject as unknown as Extendable<WKNavigationDelegate & NSObject>)
    .extend(
      {
        owner: task,
        webViewDidFinishNavigation(webView: WKWebView, _navigation: WKNavigation) {
          const owner = navigationOwner(this)
          // A native DOM read flushes WebKit's pending layout before its print formatter is used.
          webView.evaluateJavaScriptCompletionHandler(
            'document.body ? document.body.scrollHeight : 0',
            (_result: unknown, error: NSError | null) => owner.finish(error == null),
          )
        },
        webViewDidFailNavigationWithError() {
          navigationOwner(this).finish(false)
        },
        webViewDidFailProvisionalNavigationWithError() {
          navigationOwner(this).finish(false)
        },
        webViewWebContentProcessDidTerminate() {
          navigationOwner(this).finish(false)
        },
      },
      { name: 'XplatPrintNavigationDelegate', protocols: [WKNavigationDelegate] },
    )
    .new()
}

class HtmlTask {
  readonly web: WKWebView
  private readonly delegate: WKNavigationDelegate & NSObject
  private completion?: (success: boolean) => void
  private timer?: ReturnType<typeof setTimeout>
  constructor(width: number, height: number) {
    const configuration = WKWebViewConfiguration.new()
    configuration.defaultWebpagePreferences.allowsContentJavaScript = false
    this.web = WKWebView.alloc().initWithFrameConfiguration(
      CGRectMake(0, 0, width, height),
      configuration,
    )
    this.delegate = navigationDelegate(this)
    this.web.navigationDelegate = this.delegate
  }
  load(html: string, completion: (success: boolean) => void): void {
    this.completion = completion
    this.timer = setTimeout(() => this.finish(false), 30_000)
    this.web.loadHTMLStringBaseURL(html, null)
  }
  finish(success: boolean): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    const callback = this.completion
    this.completion = undefined
    callback?.(success)
  }
  dispose(): void {
    this.completion = undefined
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.web.stopLoading()
    this.web.navigationDelegate = null
    this.web.removeFromSuperview()
  }
}

function loadFormatter(options: Payload, completion: (formatter: UIPrintFormatter | null) => void) {
  const html = typeof options.html === 'string' ? options.html : ''
  if (options.useMarkupFormatter === true) {
    completion(UIMarkupTextPrintFormatter.alloc().initWithMarkupText(html))
    return
  }
  const task = new HtmlTask(
    typeof options.width === 'number' ? options.width : 612,
    typeof options.height === 'number' ? options.height : 792,
  )
  htmlTask = task
  task.load(html, (success) => completion(success ? task.web.viewPrintFormatter() : null))
}

function render(json: string, reply: Reply): void {
  if (!begin(reply)) {
    return
  }
  let options: Payload
  try {
    options = JSON.parse(json) ?? {}
  } catch {
    respond(failure(), reply)
    return
  }
  if ((options.textZoom ?? 100) !== 100) {
    respond(failure(), reply)
    return
  }
  loadFormatter(options, (formatter) => {
    if (!formatter) {
      respond(failure(), reply)
      return
    }
    const pdf = pdfKit()
    if (!pdf) {
      respond(failure(), reply)
      return
    }
    const width = typeof options.width === 'number' ? options.width : 612
    const height = typeof options.height === 'number' ? options.height : 792
    const layout = paperLayout(width, height, (options.margins as Payload) ?? {})
    const renderer = layout.renderer
    renderer.addPrintFormatterStartingAtPageAtIndex(formatter, 0)
    renderer.prepareForDrawingPages(NSMakeRange(0, renderer.numberOfPages))
    const pages = Math.max(1, renderer.numberOfPages)
    if (pages > 1000) {
      respond(failure(), reply)
      return
    }
    const bytes = NSMutableData.new()
    UIGraphicsBeginPDFContextToData(bytes, layout.paper, null)
    for (let index = 0; index < pages; index++) {
      UIGraphicsBeginPDFPageWithInfo(layout.paper, null)
      if (renderer.numberOfPages > 0) {
        renderer.drawPageAtIndexInRect(index, layout.paper)
      }
    }
    UIGraphicsEndPDFContext()
    const document = pdf.alloc().initWithData(bytes)
    if (!document || document.pageCount !== pages) {
      respond(failure(), reply)
      return
    }
    const url = NSFileManager.defaultManager.temporaryDirectory.URLByAppendingPathComponent(
      `xplat-print-${NSUUID.UUID().UUIDString}.pdf`,
    )
    if (!url || !bytes.writeToURLOptionsError(url, 1, undefined)) {
      try {
        if (url) {
          NSFileManager.defaultManager.removeItemAtURLError(url, undefined)
        }
      } catch {
        // Temporary leftovers are reclaimed by the OS.
      }

      respond(failure(), reply)
      return
    }
    owned.add(String(url.absoluteString))
    respond(
      {
        ok: true,
        uri: String(url.absoluteString),
        numberOfPages: document.pageCount,
        ...(options.base64 === true && {
          base64: bytes.base64EncodedStringWithOptions(0 as NSDataBase64EncodingOptions),
        }),
      },
      reply,
    )
  })
}

function fetchPDF(value: string, completion: (data: NSData | null) => void): void {
  const pdf = pdfKit()
  if (!pdf) {
    completion(null)
    return
  }
  if (value.startsWith('data:application/pdf;base64,')) {
    const encoded = value.slice('data:application/pdf;base64,'.length)
    if (encoded.length > (LIMIT * 4) / 3 + 4) {
      completion(null)
      return
    }

    const data = NSData.alloc().initWithBase64EncodedStringOptions(
      encoded,
      0 as NSDataBase64DecodingOptions,
    )

    completion(data && data.length <= LIMIT && pdf.alloc().initWithData(data) ? data : null)
    return
  }
  const url = value.startsWith('/') ? NSURL.fileURLWithPath(value) : NSURL.URLWithString(value)
  if (!url) {
    completion(null)
    return
  }
  if (url.fileURL) {
    const data = NSData.dataWithContentsOfURL(url)
    completion(data && data.length <= LIMIT && pdf.alloc().initWithData(data) ? data : null)
    return
  }
  if (String(url.scheme).toLowerCase() !== 'https') {
    completion(null)
    return
  }
  const request = NSMutableURLRequest.requestWithURL(url)
  request.timeoutInterval = 30
  network = NSURLSession.sharedSession.dataTaskWithRequestCompletionHandler(
    request,
    (data, response, error) => {
      const status = (response as NSHTTPURLResponse | null)?.statusCode ?? 0
      const valid = error == null && status === 200 && (data?.length ?? LIMIT + 1) <= LIMIT
      const finished = valid && data != null && pdf.alloc().initWithData(data) ? data : null
      NSOperationQueue.mainQueue.addOperationWithBlock(() => completion(finished))
    },
  )
  network.resume()
}

function present(json: string, presenter: UIViewController, reply: Reply): void {
  if (!begin(reply)) {
    return
  }
  let options: Payload
  try {
    options = JSON.parse(json) ?? {}
  } catch {
    respond(failure(), reply)
    return
  }
  if (
    UIApplication.sharedApplication.applicationState !== applicationStateActive ||
    presenter.viewIfLoaded?.window == null
  ) {
    respond(failure(), reply)
    return
  }
  const controller = UIPrintInteractionController.sharedPrintController
  const info = UIPrintInfo.printInfoWithDictionary(null)
  info.outputType = 0 as UIPrintInfoOutputType
  info.orientation =
    options.orientation === 'landscape'
      ? (1 as UIPrintInfoOrientation)
      : (0 as UIPrintInfoOrientation)
  info.jobName = 'Document'
  controller.printInfo = info
  const show = () => {
    const done = (
      _controller: UIPrintInteractionController,
      completed: boolean,
      error: NSError | null,
    ) =>
      respond(
        completed && error == null
          ? { ok: true }
          : failure(error != null ? 'ERR_PRINT_FAILED' : 'ERR_PRINT_CANCELLED'),
        reply,
      )
    let accepted: boolean
    const target = options.printerUrl
    if (typeof target === 'string') {
      const url = NSURL.URLWithString(target)
      accepted = url
        ? controller.printToPrinterCompletionHandler(UIPrinter.printerWithURL(url), done)
        : false
    } else {
      accepted = controller.presentFromRectInViewAnimatedCompletionHandler(
        CGRectMake(
          presenter.view.bounds.origin.x + presenter.view.bounds.size.width / 2 - 0.5,
          presenter.view.bounds.origin.y + presenter.view.bounds.size.height / 2 - 0.5,
          1,
          1,
        ),
        presenter.view,
        true,
        done,
      )
    }
    if (!accepted && busy) {
      respond(failure(), reply)
    }
  }
  if (typeof options.uri === 'string') {
    fetchPDF(options.uri, (data) => {
      if (!data) {
        respond(failure(), reply)
        return
      }
      controller.printingItem = data
      show()
    })
  } else if (options.html !== undefined) {
    loadFormatter(options, (formatter) => {
      if (!formatter) {
        respond(failure(), reply)
        return
      }
      const layout = paperLayout(
        typeof options.width === 'number' ? options.width : 612,
        typeof options.height === 'number' ? options.height : 792,
        (options.margins as Payload) ?? {},
      )
      const renderer = layout.renderer
      renderer.addPrintFormatterStartingAtPageAtIndex(formatter, 0)
      controller.printPageRenderer = renderer
      show()
    })
  } else {
    respond(failure(), reply)
  }
}

function select(presenter: UIViewController, reply: Reply): void {
  if (!begin(reply)) {
    return
  }
  if (
    UIApplication.sharedApplication.applicationState !== applicationStateActive ||
    presenter.viewIfLoaded?.window == null
  ) {
    respond(failure(), reply)
    return
  }
  const controller =
    UIPrinterPickerController.printerPickerControllerWithInitiallySelectedPrinter(null)
  picker = controller
  const accepted = controller.presentFromRectInViewAnimatedCompletionHandler(
    CGRectMake(
      presenter.view.bounds.origin.x + presenter.view.bounds.size.width / 2 - 0.5,
      presenter.view.bounds.origin.y + presenter.view.bounds.size.height / 2 - 0.5,
      1,
      1,
    ),
    presenter.view,
    true,
    (pickerController: UIPrinterPickerController, selected: boolean, error: NSError | null) => {
      if (error != null) {
        respond(failure(), reply)
        return
      }
      if (!selected) {
        respond(failure('ERR_PRINT_CANCELLED'), reply)
        return
      }
      const printer = pickerController.selectedPrinter
      if (!printer) {
        respond(failure(), reply)
        return
      }
      respond(
        { ok: true, name: String(printer.displayName), url: String(printer.URL.absoluteString) },
        reply,
      )
    },
  )
  if (!accepted && busy) {
    respond(failure(), reply)
  }
}

function remove(value: string): boolean {
  if (!owned.has(value)) {
    return true
  }
  const url = NSURL.URLWithString(value)
  if (!url) {
    return true
  }
  try {
    if (NSFileManager.defaultManager.fileExistsAtPath(String(url.path))) {
      NSFileManager.defaultManager.removeItemAtURLError(url, undefined)
    }

    owned.delete(value)
    return true
  } catch {
    return false
  }
}

function presenter(): UIViewController {
  let value = Application.ios.rootController
  while (value?.presentedViewController) {
    value = value.presentedViewController
  }
  if (!value) {
    throw new Error('A foreground iOS presenter is required')
  }
  return value
}

export const backend: PrintBackend = {
  capabilities() {
    const ready = bridge() && UIPrintInteractionController.printingAvailable
    return { print: ready, printToFile: Boolean(pdfKit()), selectPrinter: ready }
  },
  async print(options) {
    const view = presenter()
    await invoke(
      (callback) => present(JSON.stringify(options), view, callback),
      () => undefined,
    )
  },
  async file(options) {
    if (options.textZoom !== 100) {
      throw new UnavailabilityError('Print textZoom outside Android')
    }
    return invoke((callback) => render(JSON.stringify(options), callback), fileResult)
  },
  async select() {
    const view = presenter()
    return invoke((callback) => select(view, callback), printerResult)
  },
  remove(uri) {
    if (!remove(uri)) {
      throw new Error('Could not remove the PDF export')
    }
  },
}
