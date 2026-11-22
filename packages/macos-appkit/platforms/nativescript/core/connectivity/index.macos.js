// macOS Core provider: Connectivity — thin SCNetworkReachability
// implementation. The upstream ios module cannot be reused: its
// `_createReachability()` sockaddr path (`new interop.Reference(sockaddr, …)`)
// crashes the macOS bridge's C-struct marshaling (SIGABRT, stoi). Only
// CreateWithName + GetFlags are used here — both verified on this bridge.
export var connectionType;
(function (connectionType) {
    connectionType[connectionType["none"] = 0] = "none";
    connectionType[connectionType["wifi"] = 1] = "wifi";
    connectionType[connectionType["mobile"] = 2] = "mobile";
    connectionType[connectionType["ethernet"] = 3] = "ethernet";
    connectionType[connectionType["bluetooth"] = 4] = "bluetooth";
    connectionType[connectionType["vpn"] = 5] = "vpn";
})(connectionType || (connectionType = {}));
const REACHABLE = 2; // kSCNetworkReachabilityFlagsReachable
function _flags() {
    const reachability = SCNetworkReachabilityCreateWithName(null, 'captive.apple.com');
    if (!reachability)
        {return null;}
    const ref = new interop.Reference();
    if (!SCNetworkReachabilityGetFlags(reachability, ref))
        {return null;}
    return Number(ref.value);
}
export function getConnectionType() {
    const flags = _flags();
    if (flags == null)
        {return connectionType.none;}
    // macOS has no WWAN — reachable means wifi-or-ethernet; report wifi.
    return flags & REACHABLE ? connectionType.wifi : connectionType.none;
}
let _monitorRef = null;
let _callback = null;
const _fnRef = new interop.FunctionReference((_target, flags) => {
    if (_callback) {
        const reachable = (Number(flags) & REACHABLE) !== 0;
        _callback(reachable ? connectionType.wifi : connectionType.none);
    }
});
export function startMonitoring(connectionTypeChangedCallback) {
    if (_monitorRef || typeof SCNetworkReachabilitySetCallback !== 'function') {
        return;
    }
    _monitorRef = SCNetworkReachabilityCreateWithName(null, 'captive.apple.com');
    if (!_monitorRef) {
        return;
    }
    _callback = connectionTypeChangedCallback;
    try {
        SCNetworkReachabilitySetCallback(_monitorRef, _fnRef, null);
        if (typeof SCNetworkReachabilityScheduleWithRunLoop === 'function' && typeof CFRunLoopGetCurrent === 'function' && typeof kCFRunLoopDefaultMode !== 'undefined') {
            SCNetworkReachabilityScheduleWithRunLoop(_monitorRef, CFRunLoopGetCurrent(), kCFRunLoopDefaultMode);
        }
    }
    catch (_e) {
        // Monitoring degrades to a poll-less snapshot; the initial callback below
        // still reports the current type.
    }
    _callback(getConnectionType());
}
export function stopMonitoring() {
    if (_monitorRef) {
        try {
            if (typeof SCNetworkReachabilityUnscheduleFromRunLoop === 'function' && typeof CFRunLoopGetCurrent === 'function' && typeof kCFRunLoopDefaultMode !== 'undefined') {
                SCNetworkReachabilityUnscheduleFromRunLoop(_monitorRef, CFRunLoopGetCurrent(), kCFRunLoopDefaultMode);
            }
        }
        catch (_e) { }
        _monitorRef = null;
        _callback = null;
    }
}
