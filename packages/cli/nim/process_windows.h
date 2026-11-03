#ifndef XPLAT_PROCESS_WINDOWS_H
#define XPLAT_PROCESS_WINDOWS_H
#include <stddef.h>

/* Opaque SDK handles stay in C; callbacks never enter Nim on a foreign thread. */
void *xplat_windows_spawn(const char *executable, const char *command_line,
  const char *cwd, const char *const *environment, size_t count,
  unsigned long *pid, unsigned long *error);
int xplat_windows_read(void *process, int stream, char *buffer,
  unsigned long capacity, unsigned long *count, unsigned long *error);
int xplat_windows_poll(void *process, unsigned long *code,
  unsigned long *active, unsigned long *error);
int xplat_windows_stop(void *process, unsigned long *error);
void xplat_windows_release(void *process);
int xplat_windows_install_signals(void);
int xplat_windows_interrupted(void);
#endif
