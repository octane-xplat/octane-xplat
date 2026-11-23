// .macos variant of @nativescript/core/http/http-request-internal/index.ios.js (spike).
// Same NSURLSession implementation (NSURLSession exists on macOS); iOS-only
// pieces swapped: UIDevice -> NSProcessInfo, the iOS-18.4 simulator config
// workaround dropped, UIImage.tns_decodeImageWithDataCompletion -> NSImage.
import * as types from '@nativescript/core/utils/types';
import * as domainDebugger from '@nativescript/core/debugger';
import { HttpResponseEncoding } from '@nativescript/core/http/http-interfaces';
import { addHeader } from '@nativescript/core/http/http-request-internal/http-request-internal-common';
export { addHeader } from '@nativescript/core/http/http-request-internal/http-request-internal-common';
const osVersion = NSProcessInfo.processInfo.operatingSystemVersionString;
const GET = 'GET';
const USER_AGENT_HEADER = 'User-Agent';
const USER_AGENT = `Mozilla/5.0 (Macintosh; ${osVersion}) AppleWebKit/605.1.15 (KHTML, like Gecko)`;
const sessionConfig = NSURLSessionConfiguration.defaultSessionConfiguration;
const queue = NSOperationQueue.mainQueue;
var NSURLSessionTaskDelegateImpl = (function (_super) {
    __extends(NSURLSessionTaskDelegateImpl, _super);
    function NSURLSessionTaskDelegateImpl() {
        return (_super !== null && _super.apply(this, arguments)) || this;
    }
    NSURLSessionTaskDelegateImpl.prototype.URLSessionTaskWillPerformHTTPRedirectionNewRequestCompletionHandler = function (session, task, response, request, completionHandler) {
        completionHandler(null);
    };
    NSURLSessionTaskDelegateImpl.ObjCProtocols = [NSURLSessionTaskDelegate];
    return NSURLSessionTaskDelegateImpl;
})(NSObject);
const sessionTaskDelegateInstance = NSURLSessionTaskDelegateImpl.new();
let defaultSession;
function ensureDefaultSession() {
    if (!defaultSession) {
        defaultSession = NSURLSession.sessionWithConfigurationDelegateDelegateQueue(sessionConfig, null, queue);
    }
}
let sessionNotFollowingRedirects;
function ensureSessionNotFollowingRedirects() {
    if (!sessionNotFollowingRedirects) {
        sessionNotFollowingRedirects = NSURLSession.sessionWithConfigurationDelegateDelegateQueue(sessionConfig, sessionTaskDelegateInstance, queue);
    }
}
export function requestInternal(options, contentHandler) {
    return new Promise((resolve, reject) => {
        if (!options.url) {
            reject(new Error('Request url was empty.'));
            return;
        }
        try {
            const network = domainDebugger.getNetwork();
            const debugRequest = network && network.create();
            const urlRequest = NSMutableURLRequest.requestWithURL(NSURL.URLWithString(options.url));
            urlRequest.HTTPMethod = types.isDefined(options.method) ? options.method : GET;
            urlRequest.setValueForHTTPHeaderField(USER_AGENT, USER_AGENT_HEADER);
            if (options.headers) {
                for (const header in options.headers) {
                    urlRequest.setValueForHTTPHeaderField(options.headers[header] + '', header);
                }
            }
            if (types.isString(options.content) || options.content instanceof FormData) {
                urlRequest.HTTPBody = NSString.stringWithString(options.content.toString()).dataUsingEncoding(4);
            }
            else if (options.content instanceof ArrayBuffer) {
                const buffer = options.content;
                urlRequest.HTTPBody = NSData.dataWithData(buffer);
            }
            if (types.isNumber(options.timeout)) {
                urlRequest.timeoutInterval = options.timeout / 1000;
            }
            let session;
            if (types.isBoolean(options.dontFollowRedirects) && options.dontFollowRedirects) {
                ensureSessionNotFollowingRedirects();
                session = sessionNotFollowingRedirects;
            }
            else {
                ensureDefaultSession();
                session = defaultSession;
            }
            let timestamp = -1;
            const dataTask = session.dataTaskWithRequestCompletionHandler(urlRequest, function (data, response, error) {
                if (error) {
                    reject(new Error(error.localizedDescription));
                }
                else {
                    const headers = {};
                    if (response && response.allHeaderFields) {
                        const headerFields = response.allHeaderFields;
                        headerFields.enumerateKeysAndObjectsUsingBlock((key, value, stop) => {
                            addHeader(headers, key, value);
                        });
                    }
                    if (debugRequest) {
                        debugRequest.mimeType = response.MIMEType;
                        debugRequest.data = data;
                        const debugResponse = {
                            url: options.url,
                            status: response.statusCode,
                            statusText: NSHTTPURLResponse.localizedStringForStatusCode(response.statusCode),
                            headers: headers,
                            mimeType: response.MIMEType,
                            fromDiskCache: false,
                            timing: {
                                requestTime: timestamp,
                                proxyStart: -1,
                                proxyEnd: -1,
                                dnsStart: -1,
                                dnsEnd: -1,
                                connectStart: -1,
                                connectEnd: -1,
                                sslStart: -1,
                                sslEnd: -1,
                                serviceWorkerFetchStart: -1,
                                serviceWorkerFetchReady: -1,
                                serviceWorkerFetchEnd: -1,
                                receiveHeadersEnd: -1,
                            },
                            headersSize: headers?.length ?? -1,
                        };
                        debugRequest.responseReceived(debugResponse);
                        debugRequest.loadingFinished();
                    }
                    const content = {
                        raw: data,
                        requestURL: options.url,
                        toNativeImage: () => {
                            return new Promise((resolveImage, rejectImage) => {
                                const image = NSImage.alloc().initWithData(data);
                                if (image) {
                                    resolveImage(image);
                                }
                                else {
                                    rejectImage(new Error('Response content may not be converted to an Image'));
                                }
                            });
                        },
                        toNativeString: (encoding) => NSDataToString(data, encoding),
                    };
                    if (contentHandler != null && types.isObject(contentHandler) && !Array.isArray(contentHandler)) {
                        Object.assign(content, contentHandler);
                    }
                    resolve({
                        content: content,
                        statusCode: response.statusCode,
                        headers: headers,
                    });
                }
            });
            if (options.url && debugRequest) {
                timestamp = Date.now() / 1000;
                const request = {
                    url: options.url,
                    method: 'GET',
                    headers: options.headers,
                    timestamp,
                    headersSize: options?.headers?.length ?? -1,
                };
                debugRequest.requestWillBeSent(request);
            }
            dataTask.resume();
        }
        catch (ex) {
            reject(ex);
        }
    });
}
function NSDataToString(data, encoding) {
    let code = NSUTF8StringEncoding;
    if (encoding === HttpResponseEncoding.GBK) {
        code = 1586; /* CFStringEncodings.kCFStringEncodingGB_18030_2000 */
    }
    let encodedString = NSString.alloc().initWithDataEncoding(data, code);
    if (!encodedString) {
        code = NSISOLatin1StringEncoding;
        encodedString = NSString.alloc().initWithDataEncoding(data, code);
    }
    return encodedString.toString();
}
