// Borrowed from NativeScript/NativeScript PR #11089: packages/core/utils/mainthread-helper.macos.ts
export function dispatchToMainThread(func) {
    NSOperationQueue.mainQueue.addOperationWithBlock(func);
}
export function isMainThread() {
    return NSThread.isMainThread;
}
export function dispatchToUIThread(func) {
    const runloop = CFRunLoopGetMain();
    if (runloop && func) {
        CFRunLoopPerformBlock(runloop, kCFRunLoopDefaultMode, func);
        CFRunLoopWakeUp(runloop);
    }
    else if (func) {
        func();
    }
}
