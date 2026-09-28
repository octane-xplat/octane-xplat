#include <CoreFoundation/CoreFoundation.h>
#import <AppKit/AppKit.h>
#include <dlfcn.h>
#include <errno.h>
#include <fcntl.h>
#include <js.h>
#include <limits.h>
#include <mach-o/dyld.h>
#include <mach/mach.h>
#include <mach/mach_time.h>
#include <napi.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#include <unistd.h>
#include <uv.h>

typedef napi_value (*register_module_fn)(napi_env, napi_value);

typedef struct host_timer {
  int32_t id;
  js_env_t *env;
  js_ref_t *callback;
  CFRunLoopTimerRef timer;
  bool repeat;
  bool running;
  struct host_timer *next;
} host_timer;

static host_timer *host_timers;
static int32_t next_timer_id = 1;

static void print_value(js_env_t *env, js_value_t *value) {
  js_value_t *string = NULL;
  if (js_coerce_to_string(env, value, &string) != 0) return;
  char buffer[2048];
  size_t length = 0;
  if (js_get_value_string_utf8(env, string, (utf8_t *)buffer, sizeof buffer, &length) == 0)
    fprintf(stderr, "%s\n", buffer);
}

static int check(js_env_t *env, int status, const char *step) {
  if (status == 0) return 0;
  fprintf(stderr, "%s failed: %d\n", step, status);
  js_value_t *exception = NULL;
  if (js_get_and_clear_last_exception(env, &exception) == 0 && exception) {
    print_value(env, exception);
    js_value_t *stack = NULL;
    if (js_get_named_property(env, exception, "stack", &stack) == 0 && stack)
      print_value(env, stack);
  }
  return -1;
}

static js_value_t *host_log(js_env_t *env, js_callback_info_t *info) {
  size_t argc = 8;
  js_value_t *argv[8];
  if (js_get_callback_info(env, info, &argc, argv, NULL, NULL) != 0) return NULL;
  for (size_t i = 0; i < argc; i++) {
    if (i) fputc(' ', stderr);
    js_value_t *string = NULL;
    size_t length = 0;
    if (js_coerce_to_string(env, argv[i], &string) == 0 &&
        js_get_value_string_utf8(env, string, NULL, 0, &length) == 0 && length < SIZE_MAX) {
      char *buffer = malloc(length + 1);
      if (buffer && js_get_value_string_utf8(env, string, (utf8_t *)buffer, length + 1, NULL) == 0) {
        buffer[length] = 0;
        fputs(buffer, stderr);
      } else fputs("[unprintable]", stderr);
      free(buffer);
    } else fputs("[unprintable]", stderr);
  }
  fputc('\n', stderr);
  return NULL;
}

static void release_timer(host_timer *timer) {
  host_timer **link = &host_timers;
  while (*link && *link != timer) link = &(*link)->next;
  if (*link) *link = timer->next;
  if (timer->timer) {
    CFRunLoopTimerInvalidate(timer->timer);
    CFRelease(timer->timer);
  }
  if (timer->callback) js_delete_reference(timer->env, timer->callback);
  free(timer);
}

static void on_timer(CFRunLoopTimerRef timer_ref, void *context) {
  host_timer *timer = context;
  if (!timer->callback) return;
  timer->running = true;
  js_value_t *callback = NULL;
  js_value_t *global = NULL;
  if (js_get_reference_value(timer->env, timer->callback, &callback) == 0 && callback &&
      js_get_global(timer->env, &global) == 0)
    check(timer->env, js_call_function_with_checkpoint(timer->env, global, callback, 0, NULL, NULL), "timer callback");
  timer->running = false;
  if (!timer->repeat || !timer->callback || !CFRunLoopTimerIsValid(timer_ref)) release_timer(timer);
}

static js_value_t *host_timer_start(js_env_t *env, js_callback_info_t *info) {
  size_t argc = 2;
  js_value_t *args[2] = {NULL, NULL};
  void *data = NULL;
  if (js_get_callback_info(env, info, &argc, args, NULL, &data) != 0 || argc < 1) return NULL;
  bool is_function = false;
  if (js_is_function(env, args[0], &is_function) != 0 || !is_function) {
    js_throw_error(env, "ERR_INVALID_ARG_TYPE", "Timer callback must be a function");
    return NULL;
  }
  double delay = 0;
  if (argc > 1 && js_get_value_double(env, args[1], &delay) != 0) return NULL;
  host_timer *timer = calloc(1, sizeof *timer);
  if (!timer) {js_throw_error(env, "ERR_OUT_OF_MEMORY", "Could not allocate timer"); return NULL;}
  timer->id = next_timer_id++;
  timer->env = env;
  timer->repeat = data != NULL;
  if (js_create_reference(env, args[0], 1, &timer->callback) != 0) {free(timer); return NULL;}
  double seconds = delay > 0 ? delay / 1000.0 : 0.001;
  CFRunLoopTimerContext context = {0, timer, NULL, NULL, NULL};
  timer->timer = CFRunLoopTimerCreate(NULL, CFAbsoluteTimeGetCurrent() + seconds,
                                      timer->repeat ? seconds : 0, 0, 0, on_timer, &context);
  if (!timer->timer) {release_timer(timer); js_throw_error(env, "ERR_OUT_OF_MEMORY", "Could not create timer"); return NULL;}
  timer->next = host_timers;
  host_timers = timer;
  CFRunLoopAddTimer(CFRunLoopGetMain(), timer->timer, kCFRunLoopCommonModes);
  js_value_t *id = NULL;
  js_create_int32(env, timer->id, &id);
  return id;
}

static js_value_t *host_timer_clear(js_env_t *env, js_callback_info_t *info) {
  size_t argc = 1;
  js_value_t *arg = NULL;
  if (js_get_callback_info(env, info, &argc, &arg, NULL, NULL) != 0 || argc < 1) return NULL;
  int32_t id;
  if (js_get_value_int32(env, arg, &id) != 0) return NULL;
  for (host_timer *timer = host_timers; timer; timer = timer->next) {
    if (timer->id != id) continue;
    CFRunLoopTimerInvalidate(timer->timer);
    if (timer->running) {
      if (timer->callback) js_delete_reference(env, timer->callback);
      timer->callback = NULL;
    } else release_timer(timer);
    break;
  }
  return NULL;
}

static js_value_t *host_stop(js_env_t *env, js_callback_info_t *info) {
  (void)env;
  (void)info;
  [NSApp stop:nil];
  [NSApp postEvent:[NSEvent otherEventWithType:NSEventTypeApplicationDefined
                                    location:NSZeroPoint modifierFlags:0 timestamp:0
                                windowNumber:0 context:nil subtype:0 data1:0 data2:0]
           atStart:YES];
  CFRunLoopWakeUp(CFRunLoopGetMain());
  return NULL;
}

static js_value_t *host_env(js_env_t *env, js_callback_info_t *info) {
  size_t argc = 1;
  js_value_t *arg = NULL;
  if (js_get_callback_info(env, info, &argc, &arg, NULL, NULL) != 0 || argc != 1) return NULL;
  char key[256];
  size_t length = 0;
  if (js_get_value_string_utf8(env, arg, (utf8_t *)key, sizeof key, &length) != 0) return NULL;
  const char *value = getenv(key);
  js_value_t *result = NULL;
  if (value) js_create_string_utf8(env, (const utf8_t *)value, strlen(value), &result);
  else js_get_undefined(env, &result);
  return result;
}

static js_value_t *host_cwd(js_env_t *env, js_callback_info_t *info) {
  (void)info;
  char cwd[PATH_MAX];
  if (!getcwd(cwd, sizeof cwd)) return NULL;
  js_value_t *result = NULL;
  js_create_string_utf8(env, (const utf8_t *)cwd, strlen(cwd), &result);
  return result;
}

static js_value_t *host_metrics(js_env_t *env, js_callback_info_t *info) {
  (void)info;
  mach_task_basic_info_data_t task;
  mach_msg_type_number_t count = MACH_TASK_BASIC_INFO_COUNT;
  struct rusage usage;
  if (task_info(mach_task_self(), MACH_TASK_BASIC_INFO, (task_info_t)&task, &count) != KERN_SUCCESS ||
      getrusage(RUSAGE_SELF, &usage) != 0) {
    js_throw_error(env, "ERR_HOST_METRICS", "Could not read host process metrics");
    return NULL;
  }
  double cpu_ms = (double)usage.ru_utime.tv_sec * 1000 + (double)usage.ru_utime.tv_usec / 1000 +
                  (double)usage.ru_stime.tv_sec * 1000 + (double)usage.ru_stime.tv_usec / 1000;
  js_value_t *result = NULL;
  js_value_t *rss = NULL;
  js_value_t *cpu = NULL;
  if (js_create_object(env, &result) != 0 ||
      js_create_double(env, (double)task.resident_size, &rss) != 0 ||
      js_create_double(env, cpu_ms, &cpu) != 0 ||
      js_set_named_property(env, result, "rssBytes", rss) != 0 ||
      js_set_named_property(env, result, "cpuMs", cpu) != 0) return NULL;
  return result;
}

static js_value_t *host_now(js_env_t *env, js_callback_info_t *info) {
  (void)info;
  static mach_timebase_info_data_t timebase;
  if (!timebase.denom && mach_timebase_info(&timebase) != KERN_SUCCESS) return NULL;
  double millis = (double)mach_absolute_time() * timebase.numer / timebase.denom / 1000000.0;
  js_value_t *result = NULL;
  js_create_double(env, millis, &result);
  return result;
}

static int run_file(js_env_t *env, const char *path, int cjs, js_value_t **module_exports) {
  FILE *file = fopen(path, "rb");
  if (!file) { perror(path); return -1; }
  if (fseek(file, 0, SEEK_END) != 0) {perror(path); fclose(file); return -1;}
  long size = ftell(file);
  if (size < 0) {perror(path); fclose(file); return -1;}
  rewind(file);
  const char *prefix = cjs ? "(function(exports, require, module, __filename, __dirname) {\n" : "";
  const char *suffix = cjs ? "\n})" : "";
  size_t prefix_length = strlen(prefix);
  size_t suffix_length = strlen(suffix);
  size_t source_length = prefix_length + (size_t)size + suffix_length;
  char *source = malloc(source_length + 1);
  if (!source) {fprintf(stderr, "Could not allocate script: %s\n", path); fclose(file); return -1;}
  memcpy(source, prefix, prefix_length);
  if (fread(source + prefix_length, 1, (size_t)size, file) != (size_t)size) {
    perror(path);
    fclose(file);
    free(source);
    return -1;
  }
  fclose(file);
  memcpy(source + prefix_length + size, suffix, suffix_length);
  source[source_length] = 0;
  js_value_t *script = NULL;
  js_value_t *result = NULL;
  int status = check(env, js_create_string_utf8(env, (const utf8_t *)source, source_length, &script), "source") ||
               check(env, js_run_script(env, path, strlen(path), 0, script, &result), "run script");
  free(source);
  if (status) return -1;
  if (cjs) {
    js_value_t *global = NULL;
    js_value_t *require = NULL;
    js_value_t *exports = NULL;
    js_value_t *module = NULL;
    js_value_t *filename = NULL;
    js_value_t *dirname = NULL;
    if (check(env, js_get_global(env, &global), "CJS global") ||
        check(env, js_get_named_property(env, global, "require", &require), "CJS require") ||
        check(env, js_create_object(env, &exports), "CJS exports") ||
        check(env, js_create_object(env, &module), "CJS module") ||
        check(env, js_set_named_property(env, module, "exports", exports), "CJS module.exports") ||
        check(env, js_create_string_utf8(env, (const utf8_t *)path, strlen(path), &filename), "CJS filename") ||
        check(env, js_create_string_utf8(env, (const utf8_t *)path,
            strrchr(path, '/') ? (size_t)(strrchr(path, '/') - path) : 0, &dirname), "CJS dirname")) return -1;
    js_value_t *args[] = { exports, require, module, filename, dirname };
    if (check(env, js_call_function(env, global, result, 5, args, &result), "CJS entry")) return -1;
    if (module_exports && check(env, js_get_named_property(env, module, "exports", module_exports), "CJS exports")) return -1;
  }
  if (!cjs) {fprintf(stderr, "script result: "); print_value(env, result);}
  return 0;
}

static js_value_t *host_run_file(js_env_t *env, js_callback_info_t *info) {
  size_t argc = 1;
  js_value_t *arg = NULL;
  if (js_get_callback_info(env, info, &argc, &arg, NULL, NULL) != 0 || argc != 1) return NULL;
  char path[PATH_MAX];
  size_t length = 0;
  if (js_get_value_string_utf8(env, arg, (utf8_t *)path, sizeof path, &length) != 0 || length >= sizeof path) {
    js_throw_error(env, "ERR_INVALID_ARG_TYPE", "Expected a macOS dev bundle path");
    return NULL;
  }
  js_value_t *exports = NULL;
  if (run_file(env, path, 1, &exports)) {
    js_throw_error(env, "ERR_DEV_BUNDLE", "Could not evaluate the macOS dev bundle");
    return NULL;
  }
  return exports;
}

typedef struct host_input {
  js_env_t *env;
  char line[4096];
  size_t length;
} host_input;

static void on_input(CFRunLoopTimerRef timer, void *context) {
  host_input *input = context;
  char bytes[1024];
  ssize_t count;
  while ((count = read(STDIN_FILENO, bytes, sizeof bytes)) > 0) {
    for (ssize_t index = 0; index < count; index++) {
      if (bytes[index] == '\n') {
        input->line[input->length] = 0;
        js_value_t *global = NULL;
        js_value_t *callback = NULL;
        js_value_t *line = NULL;
        if (js_get_global(input->env, &global) == 0 &&
            js_get_named_property(input->env, global, "__xplatOnInput", &callback) == 0 &&
            js_create_string_utf8(input->env, (const utf8_t *)input->line, input->length, &line) == 0) {
          js_value_t *args[] = {line};
          check(input->env, js_call_function_with_checkpoint(input->env, global, callback, 1, args, NULL), "dev input");
        }
        input->length = 0;
      } else if (input->length + 1 < sizeof input->line) input->line[input->length++] = bytes[index];
      else input->length = 0;
    }
  }
  if (count == 0 || (count < 0 && errno != EAGAIN && errno != EWOULDBLOCK))
    CFRunLoopTimerInvalidate(timer);
}

int main(int argc, char **argv) {
  if (argc != 1 && (argc < 3 || argc > 5)) {
    fprintf(stderr, "usage: xplat-macos-host [<framework binary> <script> [metadata.nsmd] [bootstrap.js]]\n");
    return 2;
  }

  char framework_path[PATH_MAX];
  char script_path[PATH_MAX];
  char metadata_path[PATH_MAX];
  char shim_path[PATH_MAX];
  const char *framework = argc > 1 ? argv[1] : framework_path;
  const char *script = argc > 1 ? argv[2] : script_path;
  const char *metadata = argc > 3 ? argv[3] : metadata_path;
  const char *shim = argc > 4 ? argv[4] : shim_path;
  bool packaged = argc == 1;
  if (packaged) {
    char executable[PATH_MAX];
    uint32_t size = sizeof executable;
    if (_NSGetExecutablePath(executable, &size) != 0) return 2;
    char *last_slash = strrchr(executable, '/');
    if (!last_slash) return 2;
    *last_slash = 0;
    if (snprintf(framework_path, sizeof framework_path, "%s/../Frameworks/NativeScript.framework/Versions/A/NativeScript", executable) >= sizeof framework_path ||
        snprintf(script_path, sizeof script_path, "%s/../Resources/app/main.cjs", executable) >= sizeof script_path ||
        snprintf(metadata_path, sizeof metadata_path, "%s/../Resources/metadata.macos.arm64.nsmd", executable) >= sizeof metadata_path ||
        snprintf(shim_path, sizeof shim_path, "%s/../Resources/host-shim.js", executable) >= sizeof shim_path) return 2;
    setenv("OCTANE_MACOS_EXTERNAL_RUNLOOP", "1", 1);
    setenv("NODE_ENV", "production", 1);
  }

  uv_loop_t loop;
  if (uv_loop_init(&loop) != 0) return 2;
  js_platform_t *platform = NULL;
  js_env_t *env = NULL;
  js_handle_scope_t *scope = NULL;
  if (js_create_platform(&loop, NULL, &platform) != 0 ||
      js_create_env(&loop, platform, NULL, &env) != 0 ||
      js_open_handle_scope(env, &scope) != 0) {
    fprintf(stderr, "libjs setup failed\n");
    return 2;
  }

  void *library = dlopen(framework, RTLD_NOW | RTLD_GLOBAL);
  if (!library) {
    fprintf(stderr, "dlopen: %s\n", dlerror());
    return 1;
  }
  register_module_fn register_module =
      (register_module_fn)dlsym(library, "napi_register_module_v1");
  if (!register_module) {
    fprintf(stderr, "missing napi_register_module_v1\n");
    return 1;
  }

  js_value_t *exports = NULL;
  js_value_t *global = NULL;
  js_value_t *init = NULL;
  if (check(env, js_create_object(env, &exports), "exports") ||
      check(env, js_get_global(env, &global), "global")) return 1;
  exports = (js_value_t *)register_module((napi_env)env, (napi_value)exports);
  if (!exports) return check(env, -1, "module register"), 1;
  if (check(env, js_get_named_property(env, exports, "init", &init), "init lookup")) return 1;
  if (argc >= 4 || packaged) {
    js_value_t *metadata_value = NULL;
    if (check(env, js_create_string_utf8(env, (const utf8_t *)metadata, strlen(metadata), &metadata_value), "metadata path") ||
        check(env, js_call_function(env, exports, init, 1, &metadata_value, NULL), "init call")) return 1;
  } else if (check(env, js_call_function(env, exports, init, 0, NULL, NULL), "init call")) return 1;
  fprintf(stderr, "NativeScript init completed\n");
  js_value_t *objc = NULL;
  js_get_named_property(env, global, "objc", &objc);
  fprintf(stderr, "objc global: ");
  print_value(env, objc);

  if (argc == 5 || packaged) {
    js_value_t *log = NULL;
    js_value_t *timer = NULL;
    js_value_t *interval = NULL;
    js_value_t *clear = NULL;
    js_value_t *stop = NULL;
    js_value_t *env_get = NULL;
    js_value_t *cwd_get = NULL;
    js_value_t *run_dev_file = NULL;
    js_value_t *metrics_get = NULL;
    js_value_t *now_get = NULL;
    if (check(env, js_create_function(env, "hostLog", 7, host_log, NULL, &log), "host log") ||
        check(env, js_set_named_property(env, global, "__hostLog", log), "host log global") ||
        check(env, js_create_function(env, "setTimeout", 10, host_timer_start, NULL, &timer), "setTimeout") ||
        check(env, js_create_function(env, "setInterval", 11, host_timer_start, (void *)1, &interval), "setInterval") ||
        check(env, js_create_function(env, "clearTimer", 10, host_timer_clear, NULL, &clear), "clearTimer") ||
        check(env, js_create_function(env, "stopHost", 8, host_stop, NULL, &stop), "stopHost") ||
        check(env, js_create_function(env, "hostEnv", 7, host_env, NULL, &env_get), "hostEnv") ||
        check(env, js_create_function(env, "hostCwd", 7, host_cwd, NULL, &cwd_get), "hostCwd") ||
        check(env, js_create_function(env, "hostNow", 7, host_now, NULL, &now_get), "hostNow") ||
        check(env, js_set_named_property(env, global, "__setTimeout", timer), "setTimeout global") ||
        check(env, js_set_named_property(env, global, "__setInterval", interval), "setInterval global") ||
        check(env, js_set_named_property(env, global, "__clearTimer", clear), "clearTimer global") ||
        check(env, js_set_named_property(env, global, "__xplatStopHost", stop), "stopHost global") ||
        check(env, js_set_named_property(env, global, "__hostEnv", env_get), "hostEnv global") ||
        check(env, js_set_named_property(env, global, "__hostCwd", cwd_get), "hostCwd global") ||
        check(env, js_set_named_property(env, global, "__hostNow", now_get), "hostNow global")) return 1;
    if (getenv("OCTANE_MACOS_DEV_BUNDLE") &&
        (check(env, js_create_function(env, "hostRunFile", 11, host_run_file, NULL, &run_dev_file), "hostRunFile") ||
         check(env, js_set_named_property(env, global, "__hostRunFile", run_dev_file), "hostRunFile global") ||
         check(env, js_create_function(env, "hostMetrics", 11, host_metrics, NULL, &metrics_get), "hostMetrics") ||
         check(env, js_set_named_property(env, global, "__hostMetrics", metrics_get), "hostMetrics global"))) return 1;
    if (check(env, js_set_named_property(env, global, "__nativeExports", exports), "exports global")) return 1;
    if (run_file(env, shim, 0, NULL)) return 1;
  }
  if (run_file(env, script, argc == 5 || packaged, NULL)) return 1;
  host_input input = { .env = env };
  CFRunLoopTimerRef input_timer = NULL;
  if (getenv("OCTANE_MACOS_DEV_BUNDLE")) {
    int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
    if (flags < 0 || fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK) < 0) return 1;
    CFRunLoopTimerContext context = {0, &input, NULL, NULL, NULL};
    input_timer = CFRunLoopTimerCreate(NULL, CFAbsoluteTimeGetCurrent() + 0.05, 0.05, 0, 0, on_input, &context);
    if (!input_timer) return 1;
    CFRunLoopAddTimer(CFRunLoopGetMain(), input_timer, kCFRunLoopCommonModes);
  }
  if (argc == 5 || packaged) [NSApp run];
  else CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1.0, false);
  fprintf(stderr, "host run loop returned\n");
  if (input_timer) {CFRunLoopTimerInvalidate(input_timer); CFRelease(input_timer);}
  while (host_timers) release_timer(host_timers);
  js_close_handle_scope(env, scope);
  js_destroy_env(env);
  js_destroy_platform(platform);
  uv_loop_close(&loop);
  return 0;
}
