/* macOS file events. Foreign threads queue owned bytes; they never enter Nim. */
#include <CoreServices/CoreServices.h>
#include <dispatch/dispatch.h>
#include <pthread.h>
#include <stdlib.h>
#include <string.h>

enum { XPLAT_EVENT_LIMIT = 4096 };
typedef struct {
  FSEventStreamRef stream;
  dispatch_queue_t queue;
  pthread_mutex_t mutex;
  char *paths[XPLAT_EVENT_LIMIT];
  size_t head, count;
  int overflow, started;
} XplatFileEvents;

static void receive_events(ConstFSEventStreamRef stream, void *context,
                          size_t count, void *paths,
                          const FSEventStreamEventFlags flags[],
                          const FSEventStreamEventId ids[]) {
  (void)stream; (void)ids;
  XplatFileEvents *owner = context;
  char **names = paths;
  pthread_mutex_lock(&owner->mutex);
  for (size_t i = 0; i < count; i++) {
    if (flags[i] & (kFSEventStreamEventFlagMustScanSubDirs |
                    kFSEventStreamEventFlagUserDropped |
                    kFSEventStreamEventFlagKernelDropped)) owner->overflow = 1;
    if (owner->count == XPLAT_EVENT_LIMIT) { owner->overflow = 1; break; }
    char *copy = strdup(names[i]);
    if (!copy) { owner->overflow = 1; break; }
    owner->paths[(owner->head + owner->count) % XPLAT_EVENT_LIMIT] = copy;
    owner->count++;
  }
  pthread_mutex_unlock(&owner->mutex);
}

static void drained(void *context) { (void)context; }

void xplat_file_events_close(void *handle) {
  XplatFileEvents *owner = handle;
  if (!owner) return;
  if (owner->stream) {
    if (owner->started) FSEventStreamStop(owner->stream);
    FSEventStreamInvalidate(owner->stream);
    /* Wait until no callback can still reference the C owner. */
    dispatch_sync_f(owner->queue, NULL, drained);
    FSEventStreamRelease(owner->stream);
  }
  if (owner->queue) dispatch_release(owner->queue);
  for (size_t i = 0; i < owner->count; i++)
    free(owner->paths[(owner->head + i) % XPLAT_EVENT_LIMIT]);
  pthread_mutex_destroy(&owner->mutex);
  free(owner);
}

void *xplat_file_events_open(const char *const *paths, size_t count) {
  XplatFileEvents *owner = calloc(1, sizeof(*owner));
  if (!owner) return NULL;
  if (pthread_mutex_init(&owner->mutex, NULL) != 0) { free(owner); return NULL; }
  CFMutableArrayRef roots = CFArrayCreateMutable(NULL, 0, &kCFTypeArrayCallBacks);
  if (!roots) { xplat_file_events_close(owner); return NULL; }
  for (size_t i = 0; i < count; i++) {
    CFStringRef path = CFStringCreateWithBytes(NULL, (const UInt8 *)paths[i],
      strlen(paths[i]), kCFStringEncodingUTF8, false);
    if (!path) { CFRelease(roots); xplat_file_events_close(owner); return NULL; }
    CFArrayAppendValue(roots, path);
    CFRelease(path);
  }
  owner->queue = dispatch_queue_create("org.octane-xplat.cli.file-events", DISPATCH_QUEUE_SERIAL);
  if (!owner->queue) { CFRelease(roots); xplat_file_events_close(owner); return NULL; }
  FSEventStreamContext context = {0, owner, NULL, NULL, NULL};
  owner->stream = FSEventStreamCreate(NULL, receive_events, &context, roots,
    kFSEventStreamEventIdSinceNow, 0.02,
    kFSEventStreamCreateFlagFileEvents | kFSEventStreamCreateFlagWatchRoot |
    kFSEventStreamCreateFlagNoDefer);
  CFRelease(roots);
  if (!owner->stream) { xplat_file_events_close(owner); return NULL; }
  FSEventStreamSetDispatchQueue(owner->stream, owner->queue);
  if (!FSEventStreamStart(owner->stream)) { xplat_file_events_close(owner); return NULL; }
  owner->started = 1;
  return owner;
}

char *xplat_file_events_next(void *handle, int *scan) {
  XplatFileEvents *owner = handle;
  char *path = NULL;
  pthread_mutex_lock(&owner->mutex);
  *scan = owner->overflow;
  owner->overflow = 0;
  if (owner->count) {
    path = owner->paths[owner->head];
    owner->head = (owner->head + 1) % XPLAT_EVENT_LIMIT;
    owner->count--;
  }
  pthread_mutex_unlock(&owner->mutex);
  return path;
}
void xplat_file_events_free(char *path) { free(path); }
