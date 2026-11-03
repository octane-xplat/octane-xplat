#include "process_snapshot.h"
#include <sys/types.h>
#include <sys/sysctl.h>
#include <sys/proc.h>
#include <libproc.h>
#include <unistd.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>

static uint64_t birth(const struct kinfo_proc *info) {
  return (uint64_t)info->kp_proc.p_starttime.tv_sec * 1000000ULL +
    (uint64_t)info->kp_proc.p_starttime.tv_usec;
}

int xplat_same_observed_process(int pid, uint64_t started_us) {
  if (pid <= 0 || !started_us) return 0;
  int mib[] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, pid};
  struct kinfo_proc info;
  size_t size = sizeof(info);
  int status;
  do { status = sysctl(mib, 4, &info, &size, NULL, 0); } while (status < 0 && errno == EINTR);
  if (status < 0) return errno == ESRCH ? 0 : -1;
  return size == sizeof(info) && info.kp_proc.p_pid == pid &&
    info.kp_eproc.e_ucred.cr_uid == geteuid() && info.kp_proc.p_stat != SZOMB && birth(&info) == started_us;
}

void xplat_free_observations(XplatObservedProcess *rows, size_t count) {
  if (!rows) return;
  for (size_t i = 0; i < count; i++) {
    free(rows[i].executable); free(rows[i].cwd);
  }
  free(rows);
}

int xplat_observe_processes(const char *root, XplatObservedProcess **rows, size_t *count) {
  *rows = NULL; *count = 0;
  int mib[] = {CTL_KERN, KERN_PROC, KERN_PROC_UID, (int)geteuid()};
  struct kinfo_proc *infos = NULL;
  size_t size = 0;
  for (int attempt = 0; attempt < 4; attempt++) {
    if (sysctl(mib, 4, NULL, &size, NULL, 0) < 0) return -1;
    if (size / sizeof(*infos) > 8192) { errno = E2BIG; return -1; }
    size += 16*sizeof(*infos);
    infos = malloc(size);
    if (!infos) return -1;
    if (sysctl(mib, 4, infos, &size, NULL, 0) == 0) break;
    int saved = errno; free(infos); infos = NULL;
    if (saved != ENOMEM) { errno = saved; return -1; }
  }
  if (!infos) { errno = EAGAIN; return -1; }
  size_t total = size / sizeof(*infos), used = 0;
  XplatObservedProcess *result = calloc(total ? total : 1, sizeof(*result));
  if (!result) { free(infos); return -1; }
  for (size_t i = 0; i < total; i++) {
    int pid = infos[i].kp_proc.p_pid;
    if (pid <= 0 || infos[i].kp_proc.p_stat == SZOMB) continue;
    struct proc_vnodepathinfo paths;
    if (proc_pidinfo(pid, PROC_PIDVNODEPATHINFO, 0, &paths, sizeof(paths)) != sizeof(paths) ||
        strcmp(paths.pvi_cdir.vip_path, root)) continue;
    char executable[PROC_PIDPATHINFO_MAXSIZE];
    if (proc_pidpath(pid, executable, sizeof(executable)) <= 0) continue;
    const char *name = strrchr(executable, '/'); name = name ? name+1 : executable;
    if (strcmp(name, "node") && strcmp(name, "bun") && !strstr(executable, ".app/Contents/MacOS/")) continue;
    XplatObservedProcess *row = &result[used];
    row->pid = pid; row->parent = infos[i].kp_eproc.e_ppid; row->started_us = birth(&infos[i]);
    row->executable = strdup(executable); row->cwd = strdup(paths.pvi_cdir.vip_path);
    if (!row->executable || !row->cwd) {
      xplat_free_observations(result, used+1); free(infos); errno = ENOMEM; return -1;
    }
    if (xplat_same_observed_process(pid, row->started_us) != 1) {
      free(row->executable); free(row->cwd); memset(row, 0, sizeof(*row));
      continue;
    }
    used++;
  }
  free(infos); *rows = result; *count = used; return 0;
}
