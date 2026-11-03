#ifndef XPLAT_PROCESS_SNAPSHOT_H
#define XPLAT_PROCESS_SNAPSHOT_H
#include <stddef.h>
#include <stdint.h>
typedef struct {
  int pid, parent;
  uint64_t started_us;
  char *executable, *cwd;
} XplatObservedProcess;
/* Same-user, same-cwd Node/Bun/app processes only. Arguments and environment are not read. */
int xplat_observe_processes(const char *root, XplatObservedProcess **rows, size_t *count);
void xplat_free_observations(XplatObservedProcess *rows, size_t count);
int xplat_same_observed_process(int pid, uint64_t started_us);
#endif
