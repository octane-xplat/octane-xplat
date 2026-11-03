#ifndef XPLAT_PIPE_WINDOWS_H
#define XPLAT_PIPE_WINDOWS_H
#include <stddef.h>
#include <stdint.h>
int xplat_pipe_name(const char *path);
void *xplat_pipe_listen(const char *path, uint32_t *error);
/* accept: 0 pending, 1 connected, -1 failed. Exactly one owned handle returns. */
int xplat_pipe_accept(void *server, void **pipe, uint32_t *error);
int xplat_pipe_server_close(void *server);
void *xplat_pipe_connect(const char *path, uint32_t *error);
void *xplat_pipe_handle(void *pipe);
/* read: 0 pending, 1 bytes, 2 EOF, -1 failed. write: 0 pending, 1 bytes, -1 failed. */
int xplat_pipe_read(void *pipe, void *buffer, uint32_t capacity, uint32_t *count, uint32_t *error);
int xplat_pipe_write(void *pipe, const void *buffer, size_t length, uint32_t *count, uint32_t *error);
/* Request cancellation, poll completion, then free. 0 pending, 1 fully released. */
int xplat_pipe_close(void *pipe);
#endif
