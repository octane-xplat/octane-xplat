#ifndef XPLAT_ORT_SHIM_H
#define XPLAT_ORT_SHIM_H
#include <stddef.h>
#include <stdint.h>

/* Small, synchronous ABI over the pinned ONNX Runtime C function table.
 * The caller owns the loaded library and all input bytes. Output data remains
 * borrowed until xplat_ort_release_output; errors use xplat_ort_free_error. */
const char *xplat_ort_version(const void *base);
void *xplat_ort_open(const void *base, const void *model, size_t model_bytes, int optimization, char **error);
void xplat_ort_close(void *context);
int xplat_ort_run(void *context, const int64_t *ids, const int64_t *mask,
                  const int64_t *types, size_t length, void **output,
                  float **data, size_t *count, char **error);
void xplat_ort_release_output(void *context, void *output);
void xplat_ort_free_error(char *error);
#endif
