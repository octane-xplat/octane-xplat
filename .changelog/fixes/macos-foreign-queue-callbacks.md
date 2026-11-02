### macOS apps now receive async AppKit callbacks that never arrived

On macOS, JavaScript callbacks that AppKit invokes from background queues were silently never delivered — `NSURLSession` completion handlers never ran, and `NSOperationQueue` or `dispatch_async` blocks could leave a serial queue permanently stuck. The host now pumps the JavaScript runtime's event loop from the main run loop, so these callbacks reach your code on the main thread.

```js
const task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(url, (data, response, error) => {
	// Now fires — previously the request completed but this block never ran
	console.log(response.statusCode)
})
task.resume()
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)
