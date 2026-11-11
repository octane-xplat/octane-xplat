#import <ApplicationServices/ApplicationServices.h>
#import <Foundation/Foundation.h>
#include <unistd.h>

// A separate process talks to the accessibility service. Never invoke the
// renderer's ObjC accessibility method as a substitute for this route.
static AXUIElementRef findButton(AXUIElementRef node, unsigned depth, unsigned *remaining) {
  if (!depth || !*remaining) return NULL;
  --*remaining;
  CFTypeRef role = NULL, title = NULL, description = NULL;
  AXUIElementCopyAttributeValue(node, kAXRoleAttribute, &role);
  AXUIElementCopyAttributeValue(node, kAXTitleAttribute, &title);
  AXUIElementCopyAttributeValue(node, kAXDescriptionAttribute, &description);
  BOOL match = role && CFEqual(role, kAXButtonRole) &&
    ((title && CFEqual(title, CFSTR("Keep draft"))) ||
     (description && CFEqual(description, CFSTR("Keep draft"))));
  if (role) CFRelease(role);
  if (title) CFRelease(title);
  if (description) CFRelease(description);
  if (match) return (AXUIElementRef)CFRetain(node);
  CFTypeRef children = NULL;
  AXUIElementRef found = NULL;
  if (AXUIElementCopyAttributeValue(node, kAXChildrenAttribute, &children) == kAXErrorSuccess &&
      children && CFGetTypeID(children) == CFArrayGetTypeID()) {
    for (CFIndex i = 0; i < CFArrayGetCount(children) && !found; ++i)
      found = findButton((AXUIElementRef)CFArrayGetValueAtIndex(children, i), depth - 1, remaining);
  }
  if (children) CFRelease(children);
  return found;
}

int main(int argc, const char **argv) {
  @autoreleasepool {
    if (argc != 1 || getppid() <= 1) return 64;
    if (!AXIsProcessTrusted()) {
      puts("AX_SERVICE {\"trusted\":false}");
      return 77;
    }
    AXUIElementRef app = AXUIElementCreateApplication(getppid());
    AXUIElementSetMessagingTimeout(app, 3);
    unsigned remaining = 512;
    AXUIElementRef button = findButton(app, 32, &remaining);
    AXError result = button ? AXUIElementPerformAction(button, kAXPressAction) : kAXErrorNoValue;
    printf("AX_SERVICE {\"trusted\":true,\"button\":%s,\"result\":%d}\n", button ? "true" : "false", result);
    if (button) CFRelease(button);
    CFRelease(app);
    return result == kAXErrorSuccess ? 0 : 1;
  }
}
