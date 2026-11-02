/* Typed entry points over the system libcurl. Calling a variadic function
 * through a fixed-arity pointer is ABI-incorrect on macOS arm64. Let the SDK's
 * C declarations marshal setopt/getinfo arguments and callback pointers. */
#include "curl_shim.h"
#include <curl/curl.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  CURLcode (*global_init)(long);
  void (*global_cleanup)(void);
  CURL *(*easy_init)(void);
  void (*easy_cleanup)(CURL *);
  CURLcode (*easy_setopt)(CURL *, CURLoption, ...);
  CURLcode (*easy_getinfo)(CURL *, CURLINFO, ...);
  const char *(*easy_strerror)(CURLcode);
  CURLM *(*multi_init)(void);
  CURLMcode (*multi_cleanup)(CURLM *);
  CURLMcode (*multi_add_handle)(CURLM *, CURL *);
  CURLMcode (*multi_remove_handle)(CURLM *, CURL *);
  CURLMcode (*multi_perform)(CURLM *, int *);
  CURLMsg *(*multi_info_read)(CURLM *, int *);
  struct curl_slist *(*slist_append)(struct curl_slist *, const char *);
  void (*slist_free_all)(struct curl_slist *);
  char *(*version)(void);
  curl_version_info_data *(*version_info)(CURLversion);
  CURLM *multi;
  int initialized;
} XplatCurlApi;
typedef struct {
  CURL *easy;
  struct curl_slist *headers;
  char error[CURL_ERROR_SIZE];
} XplatCurlRequest;

static char *copy_text(const char *source) {
  size_t size = strlen(source) + 1;
  char *value = (char *)malloc(size);
  if (value != NULL) memcpy(value, source, size);
  return value;
}
void xplat_curl_free(char *memory) { free(memory); }
void xplat_curl_close(void *opaque) {
  XplatCurlApi *api = (XplatCurlApi *)opaque;
  if (api == NULL) return;
  if (api->multi != NULL) api->multi_cleanup(api->multi);
  if (api->initialized) api->global_cleanup();
  free(api);
}
void *xplat_curl_open(void *library, XplatCurlLookup lookup, char **error) {
  XplatCurlApi *api = (XplatCurlApi *)calloc(1, sizeof(XplatCurlApi));
  if (api == NULL) { *error = copy_text("Unable to allocate HTTP transport"); return NULL; }
#define LOAD(member, name) do { *(void **)(&api->member) = lookup(library, name); if (api->member == NULL) { *error = copy_text(name); goto failure; } } while (0)
  LOAD(global_init, "curl_global_init"); LOAD(global_cleanup, "curl_global_cleanup");
  LOAD(easy_init, "curl_easy_init"); LOAD(easy_cleanup, "curl_easy_cleanup");
  LOAD(easy_setopt, "curl_easy_setopt"); LOAD(easy_getinfo, "curl_easy_getinfo");
  LOAD(easy_strerror, "curl_easy_strerror"); LOAD(multi_init, "curl_multi_init");
  LOAD(multi_cleanup, "curl_multi_cleanup"); LOAD(multi_add_handle, "curl_multi_add_handle");
  LOAD(multi_remove_handle, "curl_multi_remove_handle"); LOAD(multi_perform, "curl_multi_perform");
  LOAD(multi_info_read, "curl_multi_info_read"); LOAD(slist_append, "curl_slist_append");
  LOAD(slist_free_all, "curl_slist_free_all"); LOAD(version, "curl_version");
  LOAD(version_info, "curl_version_info");
#undef LOAD
  if (api->global_init(CURL_GLOBAL_DEFAULT) != CURLE_OK) { *error = copy_text("HTTP global initialization failed"); goto failure; }
  api->initialized = 1;
  api->multi = api->multi_init();
  if (api->multi == NULL) { *error = copy_text("HTTP multi initialization failed"); goto failure; }
  return api;
failure:
  xplat_curl_close(api); return NULL;
}
const char *xplat_curl_version(void *opaque) { return ((XplatCurlApi *)opaque)->version(); }
int xplat_curl_async_dns(void *opaque) {
  curl_version_info_data *info = ((XplatCurlApi *)opaque)->version_info(CURLVERSION_FIRST);
  return info != NULL && (info->features & CURL_VERSION_ASYNCHDNS) != 0;
}
int xplat_curl_threadsafe(void *opaque) {
  curl_version_info_data *info = ((XplatCurlApi *)opaque)->version_info(CURLVERSION_FIRST);
  return info != NULL && (info->features & CURL_VERSION_THREADSAFE) != 0;
}
void xplat_curl_remove(void *opaque, void *request) {
  XplatCurlApi *api = (XplatCurlApi *)opaque;
  XplatCurlRequest *value = (XplatCurlRequest *)request;
  if (value == NULL) return;
  if (value->easy != NULL) { api->multi_remove_handle(api->multi, value->easy); api->easy_cleanup(value->easy); }
  api->slist_free_all(value->headers); free(value);
}
void *xplat_curl_request(void *opaque, const char *url, const char *method,
  const char *const *headers, size_t header_count, const char *body, size_t body_length,
  int has_body, long timeout_ms, const char *ca_file, const char *proxy,
  XplatCurlWrite write_body, XplatCurlWrite write_header, void *user, char **error) {
  XplatCurlApi *api = (XplatCurlApi *)opaque;
  XplatCurlRequest *value = (XplatCurlRequest *)calloc(1, sizeof(XplatCurlRequest));
  if (value == NULL) { *error = copy_text("Unable to allocate HTTP request"); return NULL; }
  value->easy = api->easy_init();
  if (value->easy == NULL) { *error = copy_text("HTTP initialization failed"); goto failure; }
  CURLcode result = CURLE_OK;
#define SET(option, argument) do { result = api->easy_setopt(value->easy, option, argument); if (result != CURLE_OK) { *error = copy_text(api->easy_strerror(result)); goto failure; } } while (0)
  SET(CURLOPT_ERRORBUFFER, value->error); SET(CURLOPT_URL, url);
  SET(CURLOPT_PRIVATE, value); SET(CURLOPT_NOSIGNAL, 1L);
  SET(CURLOPT_HTTP_VERSION, (long)CURL_HTTP_VERSION_1_1);
  SET(CURLOPT_FOLLOWLOCATION, 0L); SET(CURLOPT_SUPPRESS_CONNECT_HEADERS, 1L);
  SET(CURLOPT_SSL_VERIFYPEER, 1L); SET(CURLOPT_SSL_VERIFYHOST, 2L);
  SET(CURLOPT_PROXY, proxy == NULL ? "" : proxy);
  SET(CURLOPT_NOPROXY, "");
  SET(CURLOPT_WRITEFUNCTION, write_body); SET(CURLOPT_WRITEDATA, user);
  SET(CURLOPT_HEADERFUNCTION, write_header); SET(CURLOPT_HEADERDATA, user);
  SET(CURLOPT_ACCEPT_ENCODING, "gzip, deflate");
  if (timeout_ms > 0) SET(CURLOPT_TIMEOUT_MS, timeout_ms);
  if (ca_file != NULL && ca_file[0]) SET(CURLOPT_CAINFO, ca_file);
  if (has_body) { SET(CURLOPT_POSTFIELDSIZE_LARGE, (curl_off_t)body_length); SET(CURLOPT_POSTFIELDS, body); }
  else if (strcmp(method, "POST") == 0 || strcmp(method, "PUT") == 0 || strcmp(method, "PATCH") == 0) {
    SET(CURLOPT_POSTFIELDSIZE_LARGE, (curl_off_t)0); SET(CURLOPT_POSTFIELDS, "");
  }
  if (strcmp(method, "HEAD") == 0) SET(CURLOPT_NOBODY, 1L);
  SET(CURLOPT_CUSTOMREQUEST, method);
  for (size_t i = 0; i < header_count; ++i) {
    struct curl_slist *next = api->slist_append(value->headers, headers[i]);
    if (next == NULL) { *error = copy_text("Unable to allocate HTTP header"); goto failure; }
    value->headers = next;
  }
  SET(CURLOPT_HTTPHEADER, value->headers);
  if (api->multi_add_handle(api->multi, value->easy) != CURLM_OK) { *error = copy_text("Cannot schedule HTTP request"); goto failure; }
  return value;
failure:
  xplat_curl_remove(api, value); return NULL;
#undef SET
}
int xplat_curl_perform(void *opaque) {
  XplatCurlApi *api = (XplatCurlApi *)opaque;
  int running = 0;
  return (int)api->multi_perform(api->multi, &running);
}
void *xplat_curl_next(void *opaque, int *result) {
  XplatCurlApi *api = (XplatCurlApi *)opaque;
  int remaining = 0;
  CURLMsg *message;
  while ((message = api->multi_info_read(api->multi, &remaining)) != NULL) {
    if (message->msg == CURLMSG_DONE) {
      XplatCurlRequest *value = NULL;
      if (api->easy_getinfo(message->easy_handle, CURLINFO_PRIVATE, &value) != CURLE_OK) return NULL;
      *result = (int)message->data.result;
      return value;
    }
  }
  return NULL;
}
const char *xplat_curl_error(void *request) { return ((XplatCurlRequest *)request)->error; }
int xplat_curl_is_timeout(int result) { return result == CURLE_OPERATION_TIMEDOUT; }
