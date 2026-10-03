var assertions = 0
function check(value, message) {
	if (!value) {throw Error(message)}
	assertions++
}

function pump(seconds) {
	var deadline = Date.now() + seconds * 1000
	while (Date.now() < deadline) {
		NSRunLoop.currentRunLoop.runUntilDate(NSDate.dateWithTimeIntervalSinceNow(0.01))
	}
}

function waitFor(predicate, message, seconds) {
	var deadline = Date.now() + seconds * 1000
	while (Date.now() < deadline) {
		if (predicate()) {return}
		pump(0.01)
	}

	throw Error(message)
}

var application = NSApplication.sharedApplication
var adapter = XplatLottieAdapter.new()
var errors = []
var loadedDurations = []
var ended = 0
adapter.onLoaded = function (duration) {
	loadedDurations.push(duration)
}

adapter.onEnded = function () {
	ended++
}

adapter.onError = function (message) {
	errors.push(message)
}

var hiddenWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{ origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } },
	0,
	NSBackingStoreType.Buffered,
	false,
)

var hostView = hiddenWindow.contentView
adapter.mountIn(hostView)
hostView.layoutSubtreeIfNeeded()
var view = adapter.nativeView
check(view instanceof NSView, 'native view was not exposed')
check(view.superview === hostView, 'adapter did not mount its native view in the host')
check(view.window === hiddenWindow && !hiddenWindow.visible, 'hidden window attachment failed')
check(Math.abs(view.frame.size.width - 200) < 1, 'edge constraints did not size the native view')

var json = JSON.stringify({
	v: '5.7.0',
	fr: 30,
	ip: 0,
	op: 30,
	w: 100,
	h: 100,
	nm: 'fixture',
	ddd: 0,
	assets: [],
	layers: [
		{
			ddd: 0,
			ind: 1,
			ty: 1,
			nm: 'solid',
			sr: 1,
			ks: {
				o: { a: 0, k: 100 },
				r: { a: 0, k: 0 },
				p: {
					a: 1,
					k: [
						{
							t: 0,
							s: [0, 50, 0],
							e: [100, 50, 0],
							o: { x: 0.33, y: 0.33 },
							i: { x: 0.67, y: 0.67 },
						},
						{ t: 30, s: [100, 50, 0] },
					],
				},
				a: { a: 0, k: [0, 0, 0] },
				s: { a: 0, k: [100, 100, 100] },
			},
			sw: 20,
			sh: 20,
			sc: '#ff0000',
			ip: 0,
			op: 30,
			st: 0,
			bm: 0,
		},
	],
})

adapter.loadJSON(json)
waitFor(
	function () {
		return loadedDurations.length === 1 || errors.length > 0
	},
	'inline JSON did not resolve',
	5,
)

check(errors.length === 0, 'valid JSON failed: ' + errors.join('; '))
check(loadedDurations[0] === 1000 && adapter.durationMs === 1000, 'duration is not milliseconds')
check(Math.abs(adapter.progress) < 0.02, 'new composition did not start at zero')
adapter.seekTo(0.4)
check(Math.abs(adapter.progress - 0.4) < 0.02, 'normalized seek failed')
adapter.speed = 2
check(adapter.speed === 2, 'speed was not applied')
adapter.fit = 'cover'
check(adapter.fit === 'cover', 'cover fit was not applied')
adapter.loop = false
check(!adapter.isLooping, 'finite loop mode was not applied')

adapter.play()
waitFor(
	function () {
		return adapter.isPlaying && adapter.progress > 0.45
	},
	'no real intermediate progress',
	3,
)

var pausedProgress = adapter.progress
adapter.pause()
pump(0.1)
check(
	!adapter.isPlaying && Math.abs(adapter.progress - pausedProgress) < 0.02,
	'pause did not hold the playhead',
)

check(ended === 0, 'pause was reported as an end')
adapter.play()
waitFor(
	function () {
		return ended === 1 && !adapter.isPlaying
	},
	'finite playback did not end',
	3,
)

check(ended === 1, 'finite playback did not report ended once')

adapter.loop = true
adapter.seekTo(0)
adapter.play()
pump(1.2)
check(adapter.isPlaying && ended === 1, 'looping playback stopped or reported a finite end')
adapter.pause()
adapter.stop()
check(Math.abs(adapter.progress) < 0.02, 'stop did not reset the playhead')

adapter.loadFile(process.env.LOTTIE_FIXTURE_PATH)
waitFor(
	function () {
		return loadedDurations.length === 2 || errors.length > 0
	},
	'absolute file did not resolve',
	5,
)

check(errors.length === 0 && loadedDurations[1] === 1000, 'absolute file source failed')
adapter.loadFile(NSURL.fileURLWithPath(process.env.LOTTIE_FIXTURE_PATH).absoluteString)
waitFor(
	function () {
		return loadedDurations.length === 3 || errors.length > 0
	},
	'file URL did not resolve',
	5,
)

check(errors.length === 0 && loadedDurations[2] === 1000, 'file URL source failed')
adapter.loadURL('http://127.0.0.1/animation.json')
waitFor(
	function () {
		return errors.length > 0
	},
	'unsupported HTTP URL did not report an error',
	5,
)

check(errors[0].indexOf('https://') >= 0, 'HTTP URL error did not explain the supported scheme')

errors.length = 0
adapter.loadJSON('{bad')
waitFor(
	function () {
		return errors.length > 0
	},
	'malformed JSON did not report an error',
	5,
)

check(errors[0].length > 0 && adapter.durationMs === 0, 'parse failure kept stale animation data')
adapter.dispose()
check(view.superview == null && view.window == null, 'dispose left the AppKit view attached')
check(!adapter.isPlaying && adapter.durationMs === 0, 'dispose retained playback state')

hiddenWindow.close()
console.log('LOTTIE_APPKIT_INTEGRATION_OK assertions=' + assertions)
// The five-argument CLI host owns NSApplication.run after this entry returns.
setTimeout(function () {
	application.terminate(null)
}, 25)
