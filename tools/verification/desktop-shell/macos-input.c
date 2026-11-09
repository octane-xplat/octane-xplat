// macos-input: OS-level input and AX tree queries for the desktop-shell
// journey. Posts CGEvents at kCGHIDEventTap from a separate process, and
// walks the accessibility tree read-only for element frames/values.
//
//   xcrun clang -O2 -o macos-input macos-input.c \
//     -framework ApplicationServices -framework CoreFoundation -framework AppKit
//
// Subcommands:
//   trusted                        print trust state; exit 0 only when both
//                                  AX + post-event access are granted
//   find <pid> <axIdentifier>      DFS the app's AX tree; print JSON for the
//                                  element whose AXIdentifier matches
//   value <pid> <axIdentifier>     same walk; print only AXValue/AXTitle text
//   extras <pid>                   JSON array of AXExtrasMenuBar item frames
//   menubar <pid>                  JSON array of AXMenuBar item frames
//   menuitems <pid>                JSON array of currently open AXMenuItem
//                                  frames/titles (any open AXMenu)
//   press <pid> <axIdentifier>     AXPress the matching element (ax-action,
//                                  NOT OS input — for reporting fallbacks)
//   click <x> <y>                  left click at global top-left coords
//   key <keycode> [mods]           key press; mods = comma list cmd,shift,ctrl,alt
//   type <utf8>                    type each unicode char at the HID tap
//   front <pid>                    wait until pid is frontmost (polls; for
//                                  activation checks — uses NSWorkspace)

#import <ApplicationServices/ApplicationServices.h>
#import <CoreFoundation/CoreFoundation.h>
#import <AppKit/AppKit.h>

static NSString *cfToNS(CFStringRef s) {
  return s ? (__bridge NSString *)s : @"";
}

static CFStringRef copyAttr(AXUIElementRef el, CFStringRef name) {
  CFTypeRef v = NULL;
  if (AXUIElementCopyAttributeValue(el, name, &v) != kAXErrorSuccess || !v) return NULL;
  if (CFGetTypeID(v) != CFStringGetTypeID()) { CFRelease(v); return NULL; }
  return (CFStringRef)v;
}

static CFTypeRef copyAny(AXUIElementRef el, CFStringRef name) {
  CFTypeRef v = NULL;
  if (AXUIElementCopyAttributeValue(el, name, &v) != kAXErrorSuccess) return NULL;
  return v;
}

static CGPoint elementPosition(AXUIElementRef el) {
  CGPoint p = CGPointZero;
  CFTypeRef v = copyAny(el, kAXPositionAttribute);
  if (v) {
    if (CFGetTypeID(v) == AXValueGetTypeID() &&
        AXValueGetType((AXValueRef)v) == kAXValueTypeCGPoint)
      AXValueGetValue((AXValueRef)v, kAXValueTypeCGPoint, &p);
    CFRelease(v);
  }
  return p;
}

static CGSize elementSize(AXUIElementRef el) {
  CGSize s = CGSizeZero;
  CFTypeRef v = copyAny(el, kAXSizeAttribute);
  if (v) {
    if (CFGetTypeID(v) == AXValueGetTypeID() &&
        AXValueGetType((AXValueRef)v) == kAXValueTypeCGSize)
      AXValueGetValue((AXValueRef)v, kAXValueTypeCGSize, &s);
    CFRelease(v);
  }
  return s;
}

static NSString *jsonEscape(NSString *s) {
  return [[[[[s stringByReplacingOccurrencesOfString:@"\\" withString:@"\\\\"]
      stringByReplacingOccurrencesOfString:@"\"" withString:@"\\\""]
      stringByReplacingOccurrencesOfString:@"\n" withString:@"\\n"]
      stringByReplacingOccurrencesOfString:@"\t" withString:@"\\t"]
      stringByReplacingOccurrencesOfString:@"\r" withString:@"\\r"];
}

static NSString *elementJSON(AXUIElementRef el, const char *extraKey, NSString *extraVal) {
  CGPoint p = elementPosition(el);
  CGSize s = elementSize(el);
  NSString *role = cfToNS(copyAttr(el, kAXRoleAttribute));
  NSString *title = cfToNS(copyAttr(el, kAXTitleAttribute));
  CFTypeRef val = copyAny(el, kAXValueAttribute);
  NSString *value = @"";
  if (val) {
    CFTypeID tid = CFGetTypeID(val);
    if (tid == CFStringGetTypeID() || tid == CFNumberGetTypeID() ||
        tid == CFBooleanGetTypeID()) {
      value = [(__bridge id)val description];
    }
    CFRelease(val);
  }
  Boolean focused = false;
  CFTypeRef fv = copyAny(el, kAXFocusedAttribute);
  if (fv) {
    if (CFGetTypeID(fv) == CFBooleanGetTypeID())
      focused = CFBooleanGetValue((CFBooleanRef)fv);
    CFRelease(fv);
  }
  NSMutableString *out = [NSMutableString stringWithFormat:
    @"{\"x\":%.1f,\"y\":%.1f,\"w\":%.1f,\"h\":%.1f,\"role\":\"%@\",\"title\":\"%@\",\"value\":\"%@\",\"focused\":%s",
    p.x, p.y, s.width, s.height, jsonEscape(role), jsonEscape(title),
    jsonEscape(value), focused ? "true" : "false"];
  if (extraKey) [out appendFormat:@",\"%s\":\"%@\"", extraKey, jsonEscape(extraVal)];
  [out appendString:@"}"];
  return out;
}

// Collect all descendants (DFS) of `root` into `out`, depth-bounded.
static void collect(AXUIElementRef el, NSMutableArray *out, int depth) {
  if (!el || depth > 40) return;
  [out addObject:(__bridge id)el];
  for (NSString *attr in @[ @"AXChildren", @"AXWindows", @"AXVisibleChildren" ]) {
    CFArrayRef kids = (CFArrayRef)copyAny(el, (__bridge CFStringRef)attr);
    if (!kids) continue;
    for (CFIndex i = 0; i < CFArrayGetCount(kids); i++) {
      AXUIElementRef child = (AXUIElementRef)CFArrayGetValueAtIndex(kids, i);
      collect(child, out, depth + 1);
    }
    CFRelease(kids);
  }
}

static AXUIElementRef findByIdentifier(AXUIElementRef app, NSString *axid) {
  NSMutableArray *all = [NSMutableArray array];
  collect(app, all, 0);
  for (id item in all) {
    AXUIElementRef el = (__bridge AXUIElementRef)item;
    NSString *idv = cfToNS(copyAttr(el, (__bridge CFStringRef)@"AXIdentifier"));
    if ([idv isEqualToString:axid]) return el;
  }
  return nil;
}

static NSArray<NSString *> *childrenJSON(AXUIElementRef parent, NSString *wantedRole) {
  NSMutableArray *rows = [NSMutableArray array];
  CFArrayRef kids = (CFArrayRef)copyAny(parent, kAXChildrenAttribute);
  if (!kids) return rows;
  for (CFIndex i = 0; i < CFArrayGetCount(kids); i++) {
    AXUIElementRef child = (AXUIElementRef)CFArrayGetValueAtIndex(kids, i);
    NSString *role = cfToNS(copyAttr(child, kAXRoleAttribute));
    if (!wantedRole || [role isEqualToString:wantedRole])
      [rows addObject:elementJSON(child, NULL, nil)];
  }
  CFRelease(kids);
  return rows;
}

static int cmdTrusted(void) {
  BOOL ax = AXIsProcessTrusted();
  BOOL post = CGPreflightPostEventAccess();
  printf("ax=%s post=%s\n", ax ? "true" : "false", post ? "true" : "false");
  return (ax && post) ? 0 : 1;
}

static int cmdFind(const char *pidStr, const char *axid, int printValueOnly) {
  pid_t pid = (pid_t)atoi(pidStr);
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  NSString *target = [NSString stringWithUTF8String:axid];
  AXUIElementRef el = findByIdentifier(app, target);
  if (!el) { fprintf(stderr, "not found: %s\n", axid); return 2; }
  if (printValueOnly) {
    NSString *v = cfToNS(copyAttr(el, kAXValueAttribute));
    NSString *t = cfToNS(copyAttr(el, kAXTitleAttribute));
    printf("%s\n", [(v.length ? v : t) UTF8String]);
  } else {
    printf("%s\n", [elementJSON(el, "identifier", target) UTF8String]);
  }
  return 0;
}

static int cmdDump(const char *pidStr) {
  pid_t pid = (pid_t)atoi(pidStr);
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  NSMutableArray *all = [NSMutableArray array];
  collect(app, all, 0);
  fprintf(stderr, "dump collected %lu elements\n", (unsigned long)[all count]);
  NSUInteger i = 0;
  for (id item in all) {
    AXUIElementRef el = (__bridge AXUIElementRef)item;
    NSString *idv = cfToNS(copyAttr(el, (__bridge CFStringRef)@"AXIdentifier"));
    NSString *role = cfToNS(copyAttr(el, kAXRoleAttribute));
    NSString *title = cfToNS(copyAttr(el, kAXTitleAttribute));
    fprintf(stderr, "[%lu] role=%s id=%s\n", (unsigned long)i++,
            [role UTF8String], [idv UTF8String]);
    printf("%s\n", [[NSString stringWithFormat:
      @"{\"role\":\"%@\",\"title\":\"%@\",\"identifier\":\"%@\"}",
      jsonEscape(role), jsonEscape(title), jsonEscape(idv)] UTF8String]);
  }
  return 0;
}

static void treeWalk(AXUIElementRef el, int depth) {
  if (!el || depth > 16) return;
  NSString *role = cfToNS(copyAttr(el, kAXRoleAttribute));
  if ([role isEqualToString:@"AXMenuBar"]) return;
  NSString *sub = cfToNS(copyAttr(el, (__bridge CFStringRef)@"AXSubrole"));
  NSString *idv = cfToNS(copyAttr(el, (__bridge CFStringRef)@"AXIdentifier"));
  NSString *title = cfToNS(copyAttr(el, kAXTitleAttribute));
  NSString *desc = cfToNS(copyAttr(el, kAXDescriptionAttribute));
  NSString *value = @"";
  CFTypeRef vv = copyAny(el, kAXValueAttribute);
  if (vv) {
    CFTypeID t = CFGetTypeID(vv);
    if (t == CFStringGetTypeID() || t == CFNumberGetTypeID() || t == CFBooleanGetTypeID())
      value = [[(__bridge id)vv description] substringToIndex:
                  MIN(30, [(__bridge id)vv description].length)];
    CFRelease(vv);
  }
  CGPoint p = elementPosition(el);
  CGSize s = elementSize(el);
  printf("%*s%s sub=%s id=%s title=%s desc=%s val=%s pos=%.0f,%.0f size=%.0fx%.0f\n",
         depth * 2, "", [role UTF8String], [sub UTF8String], [idv UTF8String],
         [title UTF8String], [desc UTF8String], [value UTF8String],
         p.x, p.y, s.width, s.height);
  CFArrayRef kids = (CFArrayRef)copyAny(el, kAXChildrenAttribute);
  if (!kids) return;
  for (CFIndex i = 0; i < CFArrayGetCount(kids); i++) {
    treeWalk((AXUIElementRef)CFArrayGetValueAtIndex(kids, i), depth + 1);
  }
  CFRelease(kids);
}

static int cmdTree(const char *pidStr) {
  treeWalk(AXUIElementCreateApplication((pid_t)atoi(pidStr)), 0);
  return 0;
}

static int cmdProbe(const char *pidStr) {
  pid_t pid = (pid_t)atoi(pidStr);
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  for (NSString *attr in @[
       @"AXChildren", @"AXWindows", @"AXVisibleChildren", @"AXMenuBar",
       @"AXExtrasMenuBar", @"AXMainWindow", @"AXFocusedWindow",
       @"AXRole", @"AXTitle", @"AXFrontmost", @"AXHidden",
     ]) {
    CFTypeRef v = NULL;
    AXError err = AXUIElementCopyAttributeValue(app, (__bridge CFStringRef)attr, &v);
    long count = (v && CFGetTypeID(v) == CFArrayGetTypeID())
                     ? CFArrayGetCount((CFArrayRef)v)
                     : -1;
    printf("%s err=%d count=%ld%s\n", [attr UTF8String], (int)err, count,
           v && count < 0 ? " (non-array)" : "");
    if (v) CFRelease(v);
  }
  return 0;
}

static int cmdList(const char *pidStr, int which) {
  pid_t pid = (pid_t)atoi(pidStr);
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  NSArray<NSString *> *rows = @[];
  if (which == 0) { // extras
    CFTypeRef bar = copyAny(app, (__bridge CFStringRef)@"AXExtrasMenuBar");
    if (bar) {
      rows = childrenJSON((AXUIElementRef)bar, nil);
      CFRelease(bar);
    }
  } else if (which == 1) { // menubar
    CFTypeRef bar = copyAny(app, (__bridge CFStringRef)@"AXMenuBar");
    if (bar) {
      rows = childrenJSON((AXUIElementRef)bar, nil);
      CFRelease(bar);
    }
  } else { // menuitems: every AXMenu descendant's AXMenuItem children
    NSMutableArray *all = [NSMutableArray array];
    collect(app, all, 0);
    NSMutableArray *items = [NSMutableArray array];
    for (id item in all) {
      AXUIElementRef el = (__bridge AXUIElementRef)item;
      NSString *role = cfToNS(copyAttr(el, kAXRoleAttribute));
      if ([role isEqualToString:@"AXMenu"])
        [items addObjectsFromArray:childrenJSON(el, @"AXMenuItem")];
    }
    rows = items;
  }
  printf("[%s]\n", [[rows componentsJoinedByString:@","] UTF8String]);
  return 0;
}

static int cmdPress(const char *pidStr, const char *axid) {
  pid_t pid = (pid_t)atoi(pidStr);
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  AXUIElementRef el = findByIdentifier(app, [NSString stringWithUTF8String:axid]);
  if (!el) { fprintf(stderr, "not found: %s\n", axid); return 2; }
  AXError err = AXUIElementPerformAction(el, kAXPressAction);
  return err == kAXErrorSuccess ? 0 : 3;
}

static CGEventFlags parseMods(const char *mods) {
  CGEventFlags f = 0;
  if (!mods) return f;
  if (strstr(mods, "cmd")) f |= kCGEventFlagMaskCommand;
  if (strstr(mods, "shift")) f |= kCGEventFlagMaskShift;
  if (strstr(mods, "ctrl")) f |= kCGEventFlagMaskControl;
  if (strstr(mods, "alt")) f |= kCGEventFlagMaskAlternate;
  return f;
}

static int cmdClick(double x, double y) {
  CGPoint p = CGPointMake(x, y);
  CGEventRef down = CGEventCreateMouseEvent(NULL, kCGEventLeftMouseDown, p, kCGMouseButtonLeft);
  CGEventRef up = CGEventCreateMouseEvent(NULL, kCGEventLeftMouseUp, p, kCGMouseButtonLeft);
  CGEventPost(kCGHIDEventTap, down);
  usleep(40000);
  CGEventPost(kCGHIDEventTap, up);
  CFRelease(down); CFRelease(up);
  return 0;
}

static int cmdKey(int keycode, const char *mods) {
  CGEventFlags flags = parseMods(mods);
  CGEventRef down = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, true);
  CGEventRef up = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, false);
  CGEventSetFlags(down, flags);
  CGEventSetFlags(up, flags);
  CGEventPost(kCGHIDEventTap, down);
  usleep(30000);
  CGEventPost(kCGHIDEventTap, up);
  CFRelease(down); CFRelease(up);
  return 0;
}

static int cmdType(const char *utf8) {
  NSString *text = [NSString stringWithUTF8String:utf8];
  for (NSUInteger i = 0; i < text.length; i++) {
    unichar ch = [text characterAtIndex:i];
    CGEventRef down = CGEventCreateKeyboardEvent(NULL, 0, true);
    CGEventRef up = CGEventCreateKeyboardEvent(NULL, 0, false);
    CGEventKeyboardSetUnicodeString(down, 1, &ch);
    CGEventKeyboardSetUnicodeString(up, 1, &ch);
    CGEventPost(kCGHIDEventTap, down);
    usleep(15000);
    CGEventPost(kCGHIDEventTap, up);
    CFRelease(down); CFRelease(up);
  }
  return 0;
}

static int cmdFront(const char *pidStr) {
  pid_t pid = (pid_t)atoi(pidStr);
  for (int i = 0; i < 100; i++) {
    NSRunningApplication *front =
        [[NSWorkspace sharedWorkspace] frontmostApplication];
    if (front && front.processIdentifier == pid) { printf("frontmost=%d\n", pid); return 0; }
    usleep(100000);
  }
  fprintf(stderr, "pid %d never became frontmost\n", pid);
  return 1;
}

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc < 2) { fprintf(stderr, "usage: macos-input <cmd> ...\n"); return 64; }
    const char *cmd = argv[1];
    if (!strcmp(cmd, "trusted")) return cmdTrusted();
    if (!strcmp(cmd, "find") && argc == 4) return cmdFind(argv[2], argv[3], 0);
    if (!strcmp(cmd, "value") && argc == 4) return cmdFind(argv[2], argv[3], 1);
    if (!strcmp(cmd, "extras") && argc == 3) return cmdList(argv[2], 0);
    if (!strcmp(cmd, "menubar") && argc == 3) return cmdList(argv[2], 1);
    if (!strcmp(cmd, "dump") && argc == 3) return cmdDump(argv[2]);
    if (!strcmp(cmd, "probe") && argc == 3) return cmdProbe(argv[2]);
    if (!strcmp(cmd, "tree") && argc == 3) return cmdTree(argv[2]);
    if (!strcmp(cmd, "menuitems") && argc == 3) return cmdList(argv[2], 2);
    if (!strcmp(cmd, "press") && argc == 4) return cmdPress(argv[2], argv[3]);
    if (!strcmp(cmd, "click") && argc == 4)
      return cmdClick(atof(argv[2]), atof(argv[3]));
    if (!strcmp(cmd, "key") && argc >= 3)
      return cmdKey(atoi(argv[2]), argc > 3 ? argv[3] : NULL);
    if (!strcmp(cmd, "type") && argc == 3) return cmdType(argv[2]);
    if (!strcmp(cmd, "front") && argc == 3) return cmdFront(argv[2]);
    fprintf(stderr, "unknown/short args: %s\n", cmd);
    return 64;
  }
}
