// macOS Core provider: WebView for AppKit — WKWebView with a
// WKNavigationDelegate via NSObject.extend. `src` accepts an http(s) URL,
// an HTML string, or a ~/file path (loaded through file:// + baseURL).
import { WebViewBase, srcProperty } from '@nativescript/core/ui/web-view/web-view-common';
import { File, knownFolders } from '@nativescript/core/file-system';
import { layout } from '@nativescript/core/utils';
import { Trace } from '@nativescript/core/trace';
export * from '@nativescript/core/ui/web-view/web-view-common';
const WKNavigationDelegateImpl = NSObject.extend({
    ['webView:didStartProvisionalNavigation:'](webView, _nav) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner)
            {owner._onLoadStarted(String(webView.URL));}
    },
    ['webView:didFinishNavigation:'](webView, _nav) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner)
            {owner._onLoadFinished(String(webView.URL), null);}
    },
    ['webView:didFailNavigation:withError:'](webView, _nav, error) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner)
            {owner._onLoadFinished(String(webView.URL), String(error));}
    },
    ['webView:didFailProvisionalNavigation:withError:'](webView, _nav, error) {
        const owner = this._weakOwner ? this._weakOwner.deref() : null;
        if (owner)
            {owner._onLoadFinished(String(webView.URL), String(error));}
    },
}, {
    name: 'NSCoreMacosWKNavigationDelegate',
    protocols: [WKNavigationDelegate],
    exposedMethods: {
        'webView:didStartProvisionalNavigation:': { returns: interop.types.void, params: [interop.types.id, interop.types.id] },
        'webView:didFinishNavigation:': { returns: interop.types.void, params: [interop.types.id, interop.types.id] },
        'webView:didFailNavigation:withError:': {
            returns: interop.types.void,
            params: [interop.types.id, interop.types.id, interop.types.id],
        },
        'webView:didFailProvisionalNavigation:withError:': {
            returns: interop.types.void,
            params: [interop.types.id, interop.types.id, interop.types.id],
        },
    },
});
export class WebView extends WebViewBase {
    nativeViewProtected;
    _delegate;
    createNativeView() {
        const config = WKWebViewConfiguration.alloc().init();
        return WKWebView.alloc().initWithFrameConfiguration(CGRectMake(0, 0, 0, 0), config);
    }
    initNativeView() {
        super.initNativeView();
        this._delegate = WKNavigationDelegateImpl.new();
        this._delegate._weakOwner = new WeakRef(this);
        this.nativeViewProtected.navigationDelegate = this._delegate;
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.stopLoading();
            nv.navigationDelegate = null;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    stopLoading() {
        this.nativeViewProtected?.stopLoading();
    }
    get canGoBack() {
        return !!this.nativeViewProtected?.canGoBack;
    }
    get canGoForward() {
        return !!this.nativeViewProtected?.canGoForward;
    }
    goBack() {
        this.nativeViewProtected?.goBack();
    }
    goForward() {
        this.nativeViewProtected?.goForward();
    }
    reload() {
        this.nativeViewProtected?.reload();
    }
    _loadUrl(src) {
        const nv = this.nativeViewProtected;
        nv.loadRequest(NSURLRequest.requestWithURL(NSURL.URLWithString(src)));
    }
    _loadFile(src) {
        const nv = this.nativeViewProtected;
        const path = src.startsWith('~/') ? File.path.join(knownFolders.documents().path, src.slice(2)) : src;
        const url = NSURL.fileURLWithPath(path);
        nv.loadFileURLAllowingReadAccessToURL(url, url);
    }
    _loadData(content) {
        this.nativeViewProtected?.loadHTMLStringBaseURL(content, null);
    }
    [srcProperty.setNative](src) {
        if (typeof src !== 'string' || !src)
            {return;}
        this.stopLoading();
        if (/^https?:\/\//i.test(src)) {
            this._loadUrl(src);
        }
        else if (/\.html?$/i.test(src) || src.startsWith('~/')) {
            this._loadFile(src);
        }
        else if (src.startsWith('data:')) {
            this._loadUrl(src);
        }
        else {
            this._loadData(src);
        }
        Trace.write(`WebView load: ${src.slice(0, 80)}`, 'WebView');
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        this.setMeasuredDimension(width, height);
    }
}
