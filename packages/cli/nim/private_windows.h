#ifndef XPLAT_PRIVATE_WINDOWS_H
#define XPLAT_PRIVATE_WINDOWS_H
#include <stddef.h>
#include <stdint.h>

/* All handles are non-inheritable. Errors are Win32 codes; absence is distinct
 * from an unsafe object. UTF-8 inputs must name absolute local drive paths. */
typedef struct XplatPrivateStamp {
  uint32_t device;
  uint64_t file;
} XplatPrivateStamp;
void *xplat_private_security(uint32_t *error);
void xplat_private_security_free(void *security);
int xplat_private_directory(const char *path, int create, uint32_t *error);
int xplat_private_read(const char *path, size_t maximum, char **bytes,
  size_t *length, uint32_t *error);
void xplat_private_free(void *bytes);
int xplat_private_publish(const char *path, const char *temporary,
  const char *bytes, size_t length, XplatPrivateStamp *stamp, uint32_t *error);
int xplat_private_remove(const char *path, XplatPrivateStamp stamp, uint32_t *error);
void *xplat_private_lock(const char *path, uint32_t *error);
void xplat_private_unlock(void *lock);
#endif
