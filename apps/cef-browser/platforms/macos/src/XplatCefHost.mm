#import "XplatCefHost.h"

#include <atomic>
#include <dlfcn.h>
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdlib.h>
#include <string.h>

#include "include/cef_api_hash.h"
#include "include/capi/cef_app_capi.h"
#include "include/capi/cef_browser_capi.h"
#include "include/capi/cef_browser_process_handler_capi.h"
#include "include/capi/cef_client_capi.h"
#include "include/capi/cef_display_handler_capi.h"
#include "include/capi/cef_focus_handler_capi.h"
#include "include/capi/cef_life_span_handler_capi.h"
#include "include/capi/cef_load_handler_capi.h"

// ---------------------------------------------------------------------------
// Framework loading — the C API surface we need, resolved via dlsym. The
// leaf dylib cannot link "Chromium Embedded Framework.framework" through the
// xplat native pipeline (system -framework/-l names only), and CEF wants
// runtime loading on macOS anyway.
// ---------------------------------------------------------------------------

static void* g_cef = nullptr;
static decltype(&cef_api_hash) f_api_hash;
static decltype(&cef_initialize) f_initialize;
static decltype(&cef_shutdown) f_shutdown;
static decltype(&cef_do_message_loop_work) f_do_work;
static decltype(&cef_browser_host_create_browser) f_create_browser;
static decltype(&cef_string_utf8_to_utf16) f_to_utf16;
static decltype(&cef_string_utf16_to_utf8) f_to_utf8;
static decltype(&cef_string_utf16_clear) f_clear16;
static decltype(&cef_string_utf8_clear) f_clear8;

static bool ResolveCEF(void* handle) {
	struct {
		const char* name;
		void** slot;
	} symbols[] = {
		{"cef_api_hash", (void**)&f_api_hash},
		{"cef_initialize", (void**)&f_initialize},
		{"cef_shutdown", (void**)&f_shutdown},
		{"cef_do_message_loop_work", (void**)&f_do_work},
		{"cef_browser_host_create_browser", (void**)&f_create_browser},
		{"cef_string_utf8_to_utf16", (void**)&f_to_utf16},
		{"cef_string_utf16_to_utf8", (void**)&f_to_utf8},
		{"cef_string_utf16_clear", (void**)&f_clear16},
		{"cef_string_utf8_clear", (void**)&f_clear8},
	};

	for (auto& entry : symbols) {
		*entry.slot = dlsym(handle, entry.name);
		if (!*entry.slot) {
			NSLog(@"[cef-spike] dlsym %s failed: %s", entry.name, dlerror());
			return false;
		}
	}

	return true;
}

#define CEF_CB_TRACE(name)                                             \
	do {                                                               \
		if (getenv("XPLAT_CEF_CBTRACE"))                               \
			fprintf(stderr, "[cb-enter] %s\n", name);                  \
	} while (0)
#define CEF_CB_LEAVE(name)                                             \
	do {                                                               \
		if (getenv("XPLAT_CEF_CBTRACE"))                               \
			fprintf(stderr, "[cb-leave] %s\n", name);                  \
	} while (0)

static void SetCefString(cef_string_t* target, NSString* value) {
	const char* utf8 = value.UTF8String;
	f_to_utf16(utf8, strlen(utf8), (cef_string_utf16_t*)target);
}

static NSString* CefToNSString(const cef_string_t* source) {
	if (!source || !source->str || !source->length) {
		return @"";
	}

	cef_string_utf8_t out = {};
	f_to_utf8((const char16_t*)source->str, source->length, &out);
	NSString* result = out.str ? @(out.str) : @"";
	if (out.dtor && out.str) {
		out.dtor(out.str);
	}

	return result;
}

// ---------------------------------------------------------------------------
// Ref-counted C API structs. Each handler embeds `cef_base_ref_counted_t`
// first, so the base callback `self` pointer doubles as the Handler<T>*.
// A Bundle groups one browser's client + handlers and frees itself once all
// embedded handler refcounts drain.
// ---------------------------------------------------------------------------

struct Bundle;

template <typename Api>
struct Handler {
	Api api;
	std::atomic<int> refs{1};
	Bundle* owner;
};

template <typename Api>
static void h_add_ref(cef_base_ref_counted_t* self) {
	auto* h = (Handler<Api>*)self;
	h->refs.fetch_add(1, std::memory_order_relaxed);
	if (getenv("XPLAT_CEF_REFTRACE")) {
		fprintf(stderr, "[ref+] %s -> %d\n", typeid(Api).name(), h->refs.load());
	}
}

template <typename Api>
static int h_release(cef_base_ref_counted_t* self) {
	auto* h = (Handler<Api>*)self;
	int before = h->refs.fetch_sub(1, std::memory_order_acq_rel);
	if (getenv("XPLAT_CEF_REFTRACE")) {
		fprintf(stderr, "[ref-] %s %d -> %d\n", typeid(Api).name(), before, before - 1);
	}
	if (before == 1) {
		if (h->owner && h->owner->refs.fetch_sub(1, std::memory_order_acq_rel) == 1) {
			delete h->owner;
		}

		return 1;
	}

	return 0;
}

template <typename Api>
static int h_has_one(cef_base_ref_counted_t* self) {
	return ((Handler<Api>*)self)->refs.load() == 1;
}

template <typename Api>
static int h_has_any(cef_base_ref_counted_t* self) {
	return ((Handler<Api>*)self)->refs.load() >= 1;
}

template <typename Api>
static void InitHandler(Handler<Api>& handler, Bundle* owner) {
	memset(&handler.api, 0, sizeof(Api));
	handler.api.base.size = sizeof(Api);
	handler.api.base.add_ref = h_add_ref<Api>;
	handler.api.base.release = h_release<Api>;
	handler.api.base.has_one_ref = h_has_one<Api>;
	handler.api.base.has_at_least_one_ref = h_has_any<Api>;
	handler.owner = owner;
}

@interface XplatCefHost (Internal)
- (void)emitPacket:(NSDictionary*)packet;
@end

struct Bundle {
	Handler<cef_client_t> client;
	Handler<cef_life_span_handler_t> life;
	Handler<cef_display_handler_t> display;
	Handler<cef_load_handler_t> load;
	Handler<cef_focus_handler_t> focus;
	std::atomic<int> refs{5}; // client + four handlers
	XplatCefHost* host = nil;
	cef_browser_t* browser = nullptr; // CEF-owned; valid between after_created/before_close
	NSView* parent = nil;
};

// get_source visitor: one-shot, CEF-released after visit.
typedef struct {
	cef_string_visitor_t api;
	std::atomic<int> refs;
	XplatCefHost* host; // weak: XplatCefHost outlives in-flight visitors in the spike
} SourceVisitor;

static void CEF_CALLBACK source_visit(cef_string_visitor_t* self,
									  const cef_string_t* string) {
	auto* v = (SourceVisitor*)self;
	__strong id host = v->host;
	if (host && string && string->str) {
		NSString* text = CefToNSString(string);
		NSString* head =
			text.length > 200 ? [text substringToIndex:200] : text;
		[host emitPacket:@{
			@"type" : @"source",
			@"len" : @(string->length),
			@"head" : head
		}];
	}
}

// ---------------------------------------------------------------------------
// Message pump: run-loop observer + scheduled one-shot. A free-running
// NSTimer fires during nested AppKit event tracking and calls
// cef_do_message_loop_work where CEF can't tolerate it (crashes). Instead a
// kCFRunLoopBeforeWaiting observer in the default mode pumps once per loop
// iteration when the loop is about to sleep — never inside modal tracking —
// and on_schedule_message_pump_work drives immediate/delayed work on top.
// ---------------------------------------------------------------------------

static NSTimer* g_scheduled = nil;
static CFRunLoopObserverRef g_observer = nullptr;
static std::atomic<bool> g_pump_running{false};

static void PumpNow() {
	if (f_do_work) {
		f_do_work();
	}
}

static void SchedulePump(int64_t delay_ms) {
	if (delay_ms <= 0) {
		PumpNow();
		return;
	}

	[g_scheduled invalidate];
	g_scheduled = [NSTimer timerWithTimeInterval:delay_ms / 1000.0
										repeats:NO
										  block:^(NSTimer*) {
											PumpNow();
										  }];
	[[NSRunLoop mainRunLoop] addTimer:g_scheduled forMode:NSDefaultRunLoopMode];
}

static void StartPump() {
	if (g_pump_running.exchange(true)) {
		return;
	}

	CFRunLoopObserverContext context = {0, nullptr, nullptr, nullptr, nullptr};
	g_observer = CFRunLoopObserverCreate(
		kCFAllocatorDefault, kCFRunLoopBeforeWaiting, true, 0,
		[](CFRunLoopObserverRef, CFRunLoopActivity, void*) { PumpNow(); },
		&context);
	CFRunLoopAddObserver(CFRunLoopGetMain(), g_observer, kCFRunLoopDefaultMode);
}

static void StopPump() {
	g_pump_running = false;
	[g_scheduled invalidate];
	g_scheduled = nil;
	if (g_observer) {
		CFRunLoopRemoveObserver(CFRunLoopGetMain(), g_observer, kCFRunLoopDefaultMode);
		CFRelease(g_observer);
		g_observer = nullptr;
	}
}

// ---------------------------------------------------------------------------
// Process-level structs (cef_app_t + browser process handler).
// ---------------------------------------------------------------------------

struct AppState {
	cef_app_t app;
	cef_browser_process_handler_t bph;
	std::atomic<int> refs{1};
};

static AppState g_app_state;

static void app_add_ref(cef_base_ref_counted_t*) {
	g_app_state.refs.fetch_add(1, std::memory_order_relaxed);
}

static int app_release(cef_base_ref_counted_t*) {
	return g_app_state.refs.fetch_sub(1, std::memory_order_acq_rel) == 1 ? 1 : 0;
}

static int app_has_one(cef_base_ref_counted_t*) {
	return g_app_state.refs.load() == 1;
}

static int app_has_any(cef_base_ref_counted_t*) {
	return g_app_state.refs.load() >= 1;
}

static void CEF_CALLBACK on_context_initialized(cef_browser_process_handler_t*) {
	CEF_CB_TRACE("on_context_initialized");
	NSLog(@"[cef-spike] cef context initialized");
}

static void CEF_CALLBACK
on_schedule_message_pump_work(cef_browser_process_handler_t*, int64_t delay_ms) {
	CEF_CB_TRACE("on_schedule_message_pump_work");
	// Called from any CEF thread; scheduling must land on the main run loop.
	dispatch_async(dispatch_get_main_queue(), ^{
		if (g_pump_running.load()) {
			SchedulePump(delay_ms);
		}
	});
}

static cef_browser_process_handler_t* CEF_CALLBACK
get_browser_process_handler(cef_app_t*) {
	CEF_CB_TRACE("get_browser_process_handler");
	g_app_state.bph.base.add_ref(&g_app_state.bph.base);
	return &g_app_state.bph;
}

static void InitAppState() {
	cef_app_t* app = &g_app_state.app;
	app->base.size = sizeof(cef_app_t);
	app->base.add_ref = app_add_ref;
	app->base.release = app_release;
	app->base.has_one_ref = app_has_one;
	app->base.has_at_least_one_ref = app_has_any;
	app->get_browser_process_handler = get_browser_process_handler;

	cef_browser_process_handler_t* bph = &g_app_state.bph;
	bph->base.size = sizeof(cef_browser_process_handler_t);
	bph->base.add_ref = app_add_ref;
	bph->base.release = app_release;
	bph->base.has_one_ref = app_has_one;
	bph->base.has_at_least_one_ref = app_has_any;
	bph->on_context_initialized = on_context_initialized;
	bph->on_schedule_message_pump_work = on_schedule_message_pump_work;
}

// ---------------------------------------------------------------------------
// Per-browser client handlers.
// ---------------------------------------------------------------------------

static void EmitDirect(Bundle* bundle, NSDictionary* packet) {
	// Never run the JS dispatch inside a CEF callback — the bridge re-entry
	// can corrupt CEF state mid-callback. Hop to the main queue instead.
	NSDictionary* copy = [packet copy];
	__weak XplatCefHost* host = bundle->host;
	dispatch_async(dispatch_get_main_queue(), ^{
		[host emitPacket:copy];
	});
}

static NSView* BrowserView(Bundle* bundle) {
	if (!bundle->browser) {
		return nil;
	}

	cef_browser_host_t* host = bundle->browser->get_host(bundle->browser);
	if (!host || !host->get_window_handle) {
		return nil;
	}

	id candidate = (__bridge id)host->get_window_handle(host);
	return [candidate isKindOfClass:[NSView class]] ? (NSView*)candidate : nil;
}

static void CEF_CALLBACK
on_after_created(cef_life_span_handler_t* self, cef_browser_t* browser) {
	CEF_CB_TRACE("on_after_created");
	auto* h = (Handler<cef_life_span_handler_t>*)self;
	Bundle* bundle = h->owner;
	bundle->browser = browser;

	// Relay Xplat layout: make the CEF view track its parent bounds and
	// tell CEF the effective size changed (required — autoresizing alone
	// leaves CEF's internal size stale).
	NSView* view = BrowserView(bundle);
	if (view && bundle->parent) {
		view.frame = bundle->parent.bounds;
		view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
		cef_browser_host_t* host = browser->get_host(browser);
		if (host && host->was_resized) {
			host->was_resized(host);
		}
	}

	EmitDirect(bundle, @{@"type" : @"created"});
}

static int CEF_CALLBACK do_close(cef_life_span_handler_t*, cef_browser_t*) {
	CEF_CB_TRACE("do_close");
	return 0;
}

static void CEF_CALLBACK
on_before_close(cef_life_span_handler_t* self, cef_browser_t* browser) {
	CEF_CB_TRACE("on_before_close");
	auto* h = (Handler<cef_life_span_handler_t>*)self;
	Bundle* bundle = h->owner;
	if (bundle->browser == browser) {
		bundle->browser = nullptr;
	}

	EmitDirect(bundle, @{@"type" : @"closed"});
}

static int CEF_CALLBACK
on_before_popup(cef_life_span_handler_t* self,
				cef_browser_t*,
				cef_frame_t*,
				int,
				const cef_string_t* target_url,
				const cef_string_t*,
				cef_window_open_disposition_t,
				int,
				const cef_popup_features_t*,
				cef_window_info_t*,
				cef_client_t**,
				cef_browser_settings_t*,
				struct _cef_dictionary_value_t**,
				int*) {
	CEF_CB_TRACE("on_before_popup");
	auto* h = (Handler<cef_life_span_handler_t>*)self;
	EmitDirect(h->owner,
			   @{@"type" : @"popup", @"url" : CefToNSString(target_url)});
	return 1; // cancel — S0 has no tab strip
}

static void CEF_CALLBACK
on_address_change(cef_display_handler_t* self,
				  cef_browser_t*,
				  cef_frame_t* frame,
				  const cef_string_t* url) {
	CEF_CB_TRACE("on_address_change");
	auto* h = (Handler<cef_display_handler_t>*)self;
	Bundle* bundle = h->owner;
	if (frame->is_main && !frame->is_main(frame)) {
		return;
	}

	EmitDirect(bundle, @{@"type" : @"nav", @"url" : CefToNSString(url)});
}

static void CEF_CALLBACK
on_title_change(cef_display_handler_t* self,
				cef_browser_t*,
				const cef_string_t* title) {
	CEF_CB_TRACE("on_title_change");
	auto* h = (Handler<cef_display_handler_t>*)self;
	EmitDirect(h->owner, @{@"type" : @"title", @"title" : CefToNSString(title)});
}

static void CEF_CALLBACK
on_loading_state_change(cef_load_handler_t* self,
						cef_browser_t*,
						int is_loading,
						int can_go_back,
						int can_go_forward) {
	CEF_CB_TRACE("on_loading_state_change");
	auto* h = (Handler<cef_load_handler_t>*)self;
	EmitDirect(h->owner, @{
		@"type" : @"loading",
		@"isLoading" : @(is_loading != 0),
		@"canGoBack" : @(can_go_back != 0),
		@"canGoForward" : @(can_go_forward != 0),
	});
}

static void CEF_CALLBACK
on_load_error(cef_load_handler_t* self,
			  cef_browser_t*,
			  cef_frame_t*,
			  cef_errorcode_t code,
			  const cef_string_t* text,
			  const cef_string_t* url) {
	CEF_CB_TRACE("on_load_error");
	auto* h = (Handler<cef_load_handler_t>*)self;
	EmitDirect(h->owner, @{
		@"type" : @"error",
		@"code" : @((int)code),
		@"text" : CefToNSString(text),
		@"url" : CefToNSString(url),
	});
}

static int CEF_CALLBACK
on_set_focus(cef_focus_handler_t*, cef_browser_t*, cef_focus_source_t) {
	CEF_CB_TRACE("on_set_focus");
	return 0; // let CEF take focus normally
}

static void CEF_CALLBACK
on_got_focus(cef_focus_handler_t* self, cef_browser_t*) {
	CEF_CB_TRACE("on_got_focus");
	auto* h = (Handler<cef_focus_handler_t>*)self;
	EmitDirect(h->owner, @{@"type" : @"focus", @"where" : @"content"});
}

static void CEF_CALLBACK
on_take_focus(cef_focus_handler_t* self, cef_browser_t*, int next) {
	CEF_CB_TRACE("on_take_focus");
	auto* h = (Handler<cef_focus_handler_t>*)self;
	Bundle* bundle = h->owner;
	EmitDirect(bundle, @{@"type" : @"focus", @"where" : @"chrome"});
	dispatch_async(dispatch_get_main_queue(), ^{
		// Hand first-responder back to the AppKit side; the next key view in
		// the window's order (our URL field) becomes selectable.
		NSWindow* window = bundle->parent ? bundle->parent.window : nil;
		if (window) {
			[window makeFirstResponder:nil];
		}
	});
}

// CEF's getter contract mirrors CefRefPtr: the caller owns one ref on the
// returned handler and releases it when done. Add a ref before returning or
// the handler's refcount drifts negative and the bundle is freed out from
// under CEF's callbacks.
static cef_life_span_handler_t* CEF_CALLBACK
get_life_span_handler(cef_client_t* self) {
	CEF_CB_TRACE("get_life_span_handler");
	auto* h = (Handler<cef_client_t>*)self;
	cef_life_span_handler_t* out = &h->owner->life.api;
	out->base.add_ref(&out->base);
	return out;
}

static cef_display_handler_t* CEF_CALLBACK
get_display_handler(cef_client_t* self) {
	CEF_CB_TRACE("get_display_handler");
	auto* h = (Handler<cef_client_t>*)self;
	cef_display_handler_t* out = &h->owner->display.api;
	out->base.add_ref(&out->base);
	return out;
}

static cef_load_handler_t* CEF_CALLBACK
get_load_handler(cef_client_t* self) {
	CEF_CB_TRACE("get_load_handler");
	auto* h = (Handler<cef_client_t>*)self;
	cef_load_handler_t* out = &h->owner->load.api;
	out->base.add_ref(&out->base);
	return out;
}

static cef_focus_handler_t* CEF_CALLBACK
get_focus_handler(cef_client_t* self) {
	CEF_CB_TRACE("get_focus_handler");
	auto* h = (Handler<cef_client_t>*)self;
	cef_focus_handler_t* out = &h->owner->focus.api;
	out->base.add_ref(&out->base);
	return out;
}

static Bundle* NewBundle(XplatCefHost* host) {
	Bundle* bundle = new Bundle();
	bundle->host = host;
	InitHandler(bundle->client, bundle);
	InitHandler(bundle->life, bundle);
	InitHandler(bundle->display, bundle);
	InitHandler(bundle->load, bundle);
	InitHandler(bundle->focus, bundle);
	bundle->client.api.get_life_span_handler = get_life_span_handler;
	const char* handlers = getenv("XPLAT_CEF_HANDLERS");
	if (!handlers || strstr(handlers, "display")) {
		bundle->client.api.get_display_handler = get_display_handler;
	}
	if (!handlers || strstr(handlers, "load")) {
		bundle->client.api.get_load_handler = get_load_handler;
	}
	if (!handlers || strstr(handlers, "focus")) {
		bundle->client.api.get_focus_handler = get_focus_handler;
	}
	bundle->life.api.on_after_created = on_after_created;
	bundle->life.api.do_close = do_close;
	bundle->life.api.on_before_close = on_before_close;
	bundle->life.api.on_before_popup = on_before_popup;
	bundle->display.api.on_address_change = on_address_change;
	bundle->display.api.on_title_change = on_title_change;
	bundle->load.api.on_loading_state_change = on_loading_state_change;
	bundle->load.api.on_load_error = on_load_error;
	bundle->focus.api.on_set_focus = on_set_focus;
	bundle->focus.api.on_got_focus = on_got_focus;
	bundle->focus.api.on_take_focus = on_take_focus;
	return bundle;
}

// ---------------------------------------------------------------------------
// XplatCefHost
// ---------------------------------------------------------------------------

@implementation XplatCefHost {
	Bundle* _bundle;
	void (^_dispatch)(NSString*);
}

static int g_state = 0; // 0 uninitialized, 1 ready, <0 failure

+ (int)cefState {
	return g_state;
}

+ (int)initializeCefWithPaths:(NSDictionary<NSString*, NSString*>*)paths {
	if (g_state == 1) {
		return 0;
	}

	NSString* frameworks = paths[@"framework"];
	NSString* bundlePath = paths[@"bundle"];
	NSString* helperPath = paths[@"helper"];
	NSString* cachePath = paths[@"cache"];
	NSString* resourcesPath = paths[@"resources"];
	NSString* logPath = paths[@"log"];
	if (!frameworks.length || !bundlePath.length || !helperPath.length || !cachePath.length) {
		g_state = -4;
		NSLog(@"[cef-spike] initializeCefWithPaths: missing required paths %@", paths);
		return g_state;
	}

	NSString* library = [frameworks
		stringByAppendingPathComponent:@"Chromium Embedded Framework"];
	g_cef = dlopen(library.fileSystemRepresentation, RTLD_NOW | RTLD_GLOBAL);
	if (!g_cef) {
		g_state = -1;
		NSLog(@"[cef-spike] framework dlopen failed: %s", dlerror());
		return g_state;
	}

	if (!ResolveCEF(g_cef)) {
		g_state = -2;
		return g_state;
	}

	InitAppState();

	cef_settings_t settings = {};
	settings.size = sizeof(settings);
	settings.no_sandbox = getenv("XPLAT_CEF_NO_SANDBOX") ? 1 : 0;
	settings.external_message_pump = 1;
	settings.multi_threaded_message_loop = 0;
	settings.windowless_rendering_enabled = 0;
	SetCefString(&settings.framework_dir_path, frameworks);
	SetCefString(&settings.main_bundle_path, bundlePath);
	SetCefString(&settings.browser_subprocess_path, helperPath);
	SetCefString(&settings.root_cache_path, cachePath);
	if (resourcesPath.length) {
		SetCefString(&settings.resources_dir_path, resourcesPath);
		SetCefString(&settings.locales_dir_path, resourcesPath);
	}
	if (logPath.length) {
		SetCefString(&settings.log_file, logPath);
		settings.log_severity = LOGSEVERITY_INFO;
	}
	// Child processes CHECK that --lang is present; propagate it via both the
	// settings field (CEF copies it onto helper command lines) and argv.
	SetCefString(&settings.locale, @"en-US");

	char exe[PATH_MAX] = {};
	uint32_t exeSize = sizeof(exe);
	_NSGetExecutablePath(exe, &exeSize);
	char argMainBundle[PATH_MAX], argFramework[PATH_MAX], argResources[PATH_MAX],
		argSubprocess[PATH_MAX], argLocales[PATH_MAX], argCache[PATH_MAX];
	snprintf(argMainBundle, sizeof(argMainBundle), "--main-bundle-path=%s",
			 bundlePath.fileSystemRepresentation);
	snprintf(argFramework, sizeof(argFramework), "--framework-dir-path=%s",
			 frameworks.fileSystemRepresentation);
	snprintf(argResources, sizeof(argResources), "--resources-dir-path=%s",
			 resourcesPath.fileSystemRepresentation);
	snprintf(argLocales, sizeof(argLocales), "--locales-dir-path=%s",
			 resourcesPath.fileSystemRepresentation);
	snprintf(argSubprocess, sizeof(argSubprocess), "--browser-subprocess-path=%s",
			 helperPath.fileSystemRepresentation);
	snprintf(argCache, sizeof(argCache), "--root-cache-path=%s",
			 cachePath.fileSystemRepresentation);
	char argLang[64];
	snprintf(argLang, sizeof(argLang), "--lang=%s",
			 getenv("XPLAT_CEF_LANG") ? getenv("XPLAT_CEF_LANG") : "en-US");
	char* argv[16] = {exe,   argMainBundle, argFramework, argResources,
					  argLocales, argSubprocess, argCache, argLang, nullptr};
	cef_main_args_t args = {8, argv};
	if (getenv("XPLAT_CEF_SINGLE_PROCESS")) {
		argv[args.argc++] = (char*)"--single-process";
	}
	if (getenv("XPLAT_CEF_IN_PROCESS_RENDERER")) {
		argv[args.argc++] = (char*)"--in-process-renderer";
	}
	if (getenv("XPLAT_CEF_IN_PROCESS_GPU")) {
		// GPU work in the (unsandboxed) browser process — keeps windowed
		// compositing working when the sandboxed GPU helper cannot run.
		argv[args.argc++] = (char*)"--in-process-gpu";
	}
	if (getenv("XPLAT_CEF_DISABLE_GPU")) {
		argv[args.argc++] = (char*)"--disable-gpu";
	}

	// The C API version table is populated lazily — CToCpp dispatchers read
	// "invalid version -1" if cef_api_hash hasn't run before cef_initialize.
	(void)f_api_hash(CEF_API_VERSION, 0);

	if (!f_initialize(&args, &settings, &g_app_state.app, nullptr)) {
		g_state = -3;
		NSLog(@"[cef-spike] cef_initialize returned false");
		return g_state;
	}

	StartPump();
	g_state = 1;
	NSLog(@"[cef-spike] cef initialized (sandbox=%@)",
		  settings.no_sandbox ? @"off" : @"on");
	return 0;
}

+ (void)shutdownCef {
	if (g_state != 1) {
		return;
	}

	StopPump();
	f_shutdown();
	g_state = 0;
}

- (instancetype)init {
	self = [super init];
	return self;
}

- (void)emitPacket:(NSDictionary*)packet {
	if (!_dispatch) {
		return;
	}

	@try {
		NSData* data = [NSJSONSerialization dataWithJSONObject:packet options:0 error:nil];
		if (data) {
			_dispatch([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
		}
	} @catch (NSException* error) {
		NSLog(@"[cef-spike] packet emit failed: %@", error);
	}
}

- (void)injectWheelDeltaX:(int)dx deltaY:(int)dy {
	Bundle* bundle = _bundle;
	if (!bundle || !bundle->browser) {
		return;
	}
	cef_browser_host_t* host = bundle->browser->get_host(bundle->browser);
	if (!host || !host->send_mouse_wheel_event) {
		return;
	}
	NSView* view = BrowserView(bundle);
	NSRect b = view ? view.bounds : NSMakeRect(0, 0, 400, 400);
	cef_mouse_event_t ev = {(int)(b.size.width / 2), (int)(b.size.height / 2), 0};
	host->send_mouse_wheel_event(host, &ev, dx, dy);
}

- (void)requestSource {
	Bundle* bundle = _bundle;
	if (!bundle || !bundle->browser || !bundle->browser->get_main_frame) {
		return;
	}
	cef_frame_t* frame = bundle->browser->get_main_frame(bundle->browser);
	if (!frame || !frame->get_source) {
		return;
	}
	SourceVisitor* v = (SourceVisitor*)calloc(1, sizeof(SourceVisitor));
	v->refs = 1;
	v->api.base.size = sizeof(cef_string_visitor_t);
	v->api.base.add_ref = [](cef_base_ref_counted_t* self) {
		((SourceVisitor*)self)->refs++;
	};
	v->api.base.release = [](cef_base_ref_counted_t* self) {
		if (--((SourceVisitor*)self)->refs == 0) {
			free(self);
			return 1;
		}
		return 0;
	};
	v->api.base.has_one_ref = [](cef_base_ref_counted_t* self) {
		return (int)(((SourceVisitor*)self)->refs == 1);
	};
	v->api.base.has_at_least_one_ref = [](cef_base_ref_counted_t* self) {
		return (int)(((SourceVisitor*)self)->refs >= 1);
	};
	v->api.visit = source_visit;
	v->host = self;
	frame->get_source(frame, &v->api);
}

- (void)installDispatcher:(void (^)(NSString*))dispatch {
	_dispatch = [dispatch copy];
}

- (BOOL)attachTo:(NSView*)parent url:(NSString*)url {
	if (g_state != 1 || !parent) {
		return NO;
	}

	Bundle* bundle = NewBundle(self);
	bundle->parent = parent;

	// Relay parent frame changes into CEF (resize + layout moves).
	parent.postsFrameChangedNotifications = YES;
	[[NSNotificationCenter defaultCenter]
		addObserverForName:NSViewFrameDidChangeNotification
					object:parent
					 queue:[NSOperationQueue mainQueue]
				usingBlock:^(NSNotification*) {
					if (bundle->browser) {
						cef_browser_host_t* host = bundle->browser->get_host(bundle->browser);
						if (host && host->was_resized) {
							host->was_resized(host);
							NSRect f = bundle->parent.frame;
							[bundle->host emitPacket:@{
								@"type" : @"resize",
								@"w" : @(f.size.width),
								@"h" : @(f.size.height)
							}];
						}
					}
				}];

	cef_window_info_t info = {};
	info.size = sizeof(info);
	NSRect bounds = parent.bounds;
	if (bounds.size.width < 10 || bounds.size.height < 10) {
		bounds = parent.window ? parent.window.contentView.bounds : bounds;
	}
	info.bounds = {0, 0, (int)bounds.size.width, (int)bounds.size.height};
	info.parent_view = (__bridge cef_window_handle_t)parent;
	info.runtime_style = CEF_RUNTIME_STYLE_ALLOY;

	cef_string_t cef_url = {};
	SetCefString(&cef_url, url.length ? url : @"about:blank");

	cef_browser_settings_t browser_settings = {};
	browser_settings.size = sizeof(browser_settings);

	int ok = f_create_browser(
		&info, &bundle->client.api, &cef_url, &browser_settings, nullptr, nullptr);
	f_clear16((cef_string_utf16_t*)&cef_url);
	if (!ok) {
		delete bundle;
		return NO;
	}

	_bundle = bundle;
	return YES;
}

- (cef_browser_t*)browser {
	return _bundle ? _bundle->browser : nullptr;
}

- (BOOL)loadURLString:(NSString*)url {
	cef_browser_t* browser = [self browser];
	if (!browser || !url.length) {
		return NO;
	}

	cef_frame_t* frame = browser->get_main_frame(browser);
	if (!frame) {
		return NO;
	}

	cef_string_t cef_url = {};
	SetCefString(&cef_url, url);
	frame->load_url(frame, &cef_url);
	f_clear16((cef_string_utf16_t*)&cef_url);
	return YES;
}

- (void)reload {
	cef_browser_t* browser = [self browser];
	if (browser) {
		browser->reload(browser);
	}
}

- (void)goBack {
	cef_browser_t* browser = [self browser];
	if (browser) {
		browser->go_back(browser);
	}
}

- (void)goForward {
	cef_browser_t* browser = [self browser];
	if (browser) {
		browser->go_forward(browser);
	}
}

- (BOOL)canGoBack {
	cef_browser_t* browser = [self browser];
	return browser && browser->can_go_back(browser);
}

- (BOOL)canGoForward {
	cef_browser_t* browser = [self browser];
	return browser && browser->can_go_forward(browser);
}

- (void)takeFocus {
	cef_browser_t* browser = [self browser];
	if (!browser) {
		return;
	}

	NSView* view = BrowserView(_bundle);
	if (view && view.window) {
		[view.window makeFirstResponder:view];
	}

	browser->get_host(browser)->set_focus(browser->get_host(browser), 1);
}

- (void)closeBrowser {
	cef_browser_t* browser = [self browser];
	if (browser) {
		browser->get_host(browser)->close_browser(browser->get_host(browser), 0);
	}
}

- (void)dealloc {
	if (_bundle && _bundle->browser) {
		_bundle->browser->get_host(_bundle->browser)
			->close_browser(_bundle->browser->get_host(_bundle->browser), 1);
	}
}

@end

@implementation XplatCefActionTarget {
	void (^_handler)(id sender);
}

- (void)installHandler:(void (^)(id sender))handler {
	_handler = [handler copy];
}

- (void)xplatAction:(id)sender {
	if (_handler) {
		_handler(sender);
	}
}

+ (instancetype)wireControl:(NSControl*)control
					handler:(void (^)(id sender))handler {
	XplatCefActionTarget* target = [[self alloc] init];
	[target installHandler:handler];
	control.target = target;
	control.action = @selector(xplatAction:);
	return target;
}

@end
