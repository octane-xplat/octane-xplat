#ifndef XPLAT_CURL_SHIM_H
#define XPLAT_CURL_SHIM_H
#include <stddef.h>
#include <stdint.h>
/* The symbol text is read-only; char* matches Nim's cstring callback type. */
typedef void *(*XplatCurlLookup)(void *, char *);
typedef size_t (*XplatCurlWrite)(char *, size_t, size_t, void *);
void *xplat_curl_open(void *library, XplatCurlLookup lookup, char **error);
void xplat_curl_close(void *api);
const char *xplat_curl_version(void *api);
int xplat_curl_async_dns(void *api);
int xplat_curl_threadsafe(void *api);
void xplat_curl_free(char *memory);
void *xplat_curl_request(void *api, const char *url, const char *method,
  const char *const *headers, size_t header_count, const char *body, size_t body_length,
  int has_body, long timeout_ms, const char *ca_file, const char *proxy,
  XplatCurlWrite write_body, XplatCurlWrite write_header, void *user, char **error);
void xplat_curl_remove(void *api, void *request);
int xplat_curl_perform(void *api);
void *xplat_curl_next(void *api, int *result);
const char *xplat_curl_error(void *request);
int xplat_curl_is_timeout(int result);
#endif
