#include <CoreFoundation/CoreFoundation.h>
#include <dlfcn.h>
#include <js.h>
#include <napi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <uv.h>

typedef napi_value (*register_module_fn)(napi_env, napi_value);
typedef void (*native_init_fn)(void *, const char *, const void *);

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
  if (js_get_and_clear_last_exception(env, &exception) == 0 && exception)
    print_value(env, exception);
  return -1;
}

int main(int argc, char **argv) {
  if (argc != 3 && argc != 4) {
    fprintf(stderr, "usage: minimal-host <framework binary> <script> [metadata.nsmd]\n");
    return 2;
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

  void *library = dlopen(argv[1], RTLD_NOW | RTLD_GLOBAL);
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
  if (argc == 4) {
    native_init_fn native_init = (native_init_fn)dlsym(library, "nativescript_init");
    if (!native_init) { fprintf(stderr, "missing nativescript_init\n"); return 1; }
    native_init(env, argv[3], NULL);
  } else if (check(env, js_call_function(env, exports, init, 0, NULL, NULL), "init call")) return 1;
  fprintf(stderr, "NativeScript init completed\n");
  js_value_t *objc = NULL;
  js_get_named_property(env, global, "objc", &objc);
  fprintf(stderr, "objc global: ");
  print_value(env, objc);

  FILE *file = fopen(argv[2], "rb");
  if (!file) { perror("script"); return 1; }
  fseek(file, 0, SEEK_END);
  long size = ftell(file);
  rewind(file);
  char *source = malloc((size_t)size + 1);
  if (fread(source, 1, (size_t)size, file) != (size_t)size) return 1;
  fclose(file);
  source[size] = 0;
  js_value_t *script = NULL;
  js_value_t *result = NULL;
  if (check(env, js_create_string_utf8(env, (const utf8_t *)source, (size_t)size, &script), "source") ||
      check(env, js_run_script(env, argv[2], strlen(argv[2]), 0, script, &result), "run script"))
    return 1;
  fprintf(stderr, "script result: ");
  print_value(env, result);
  CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1.0, false);
  js_close_handle_scope(env, scope);
  js_destroy_env(env);
  js_destroy_platform(platform);
  uv_loop_close(&loop);
  return 0;
}
