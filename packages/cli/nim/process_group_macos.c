#include "process_group.h"
#include <sys/types.h>
#include <sys/sysctl.h>
#include <errno.h>
#include <stdlib.h>

int xplat_group_descendants(int leader) {
  int mib[] = {CTL_KERN, KERN_PROC, KERN_PROC_PGRP, leader};
  for (int attempt = 0; attempt < 4; attempt++) {
    size_t size = 0;
    if (sysctl(mib, 4, NULL, &size, NULL, 0) < 0) return -1;
    if (!size) return 0;
    /* Leave room for a concurrent fork between the size query and snapshot. */
    size += 16 * sizeof(struct kinfo_proc);
    struct kinfo_proc *entries = malloc(size);
    if (!entries) { errno = ENOMEM; return -1; }
    if (sysctl(mib, 4, entries, &size, NULL, 0) < 0) {
      int saved = errno;
      free(entries);
      if (saved == ENOMEM) continue;
      errno = saved;
      return -1;
    }
    int count = 0;
    for (size_t i = 0; i < size / sizeof(*entries); i++)
      if (entries[i].kp_proc.p_pid != leader) count++;
    free(entries);
    return count;
  }
  errno = ENOMEM;
  return -1;
}
