var assertions = 0;
function check(value, message) {
	if (!value) throw Error(message);
	assertions++;
}
function pump(seconds) {
	NSRunLoop.currentRunLoop.runUntilDate(NSDate.dateWithTimeIntervalSinceNow(seconds));
}
NSApplication.sharedApplication;
var bridge = XplatLottieFeasibility.new();
var json = JSON.stringify({v:'5.7.0',fr:30,ip:0,op:30,w:100,h:100,nm:'fixture',ddd:0,assets:[],layers:[
	{ddd:0,ind:1,ty:1,nm:'solid',sr:1,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:1,k:[
		{t:0,s:[0,50,0],e:[100,50,0],o:{x:0.33,y:0.33},i:{x:0.67,y:0.67}},
		{t:30,s:[100,50,0]}]},a:{a:0,k:[0,0,0]},s:{a:0,k:[100,100,100]}},
	 sw:20,sh:20,sc:'#ff0000',ip:0,op:30,st:0,bm:0}
]});
check(bridge.loadJSON(json) == null, 'parse failed');
check(bridge.durationMs === 1000, 'duration must be milliseconds');
var hiddenWindow = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
	{origin:{x:0,y:0},size:{width:200,height:100}}, 0, NSBackingStoreType.Buffered, false);
var hostView = hiddenWindow.contentView;
var view = bridge.view;
hostView.addSubview(view);
view.frame = hostView.bounds;
view.layoutSubtreeIfNeeded();
check(view instanceof NSView, 'AppKit view not exposed');
check(view.isFlipped, 'expected flipped view');
check(view.layer != null, 'missing real CALayer');
check(view.window === hiddenWindow && !hiddenWindow.visible, 'hidden window attachment failed');
check(view.frame.size.width === 200, 'frame not applied');
bridge.seek(0.4);
check(Math.abs(bridge.progress - 0.4) < 0.02, 'seek failed');
bridge.speed = 2;
check(bridge.speed === 2, 'speed failed');
var completions = [];
bridge.onCompletion = function(done) { completions.push(done); };
bridge.play();
pump(0.12);
check(bridge.playing, 'not playing');
check(bridge.progress > 0.4 && bridge.progress < 1, 'no real intermediate progress');
bridge.pause();
var paused = bridge.progress;
pump(0.1);
check(!bridge.playing && Math.abs(bridge.progress - paused) < 0.02, 'pause failed');
check(bridge.finished === 0, 'pause falsely completed');
bridge.play();
pump(0.7);
check(bridge.finished === 1 && !bridge.playing, 'finite completion failed');
check(completions.indexOf(true) >= 0, 'Swift block callback did not reach JS');
bridge.stop();
check(bridge.progress === 0, 'stop did not reset');
bridge.looping = true;
bridge.play();
pump(1.2);
check(bridge.playing && bridge.finished === 1, 'loop ended or falsely completed');
bridge.dispose();
check(bridge.view == null && view.superview == null && !bridge.playing, 'dispose failed');
check(bridge.loadJSON('{bad') != null, 'malformed JSON silently succeeded');
hiddenWindow.close();
console.log('LOTTIE_APPKIT_FEASIBILITY_OK assertions=' + assertions);
// The five-argument CLI host owns NSApplication.run after this entry returns.
setTimeout(function() { NSApplication.sharedApplication.terminate(null); }, 25);
