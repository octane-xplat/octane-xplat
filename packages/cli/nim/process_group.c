#include "process_group.h"
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>

int xplat_exit_observed(int pid) {
  siginfo_t info;
  memset(&info, 0, sizeof(info));
  int status;
  do {
    status = waitid(P_PID, (id_t)pid, &info, WEXITED | WNOHANG | WNOWAIT);
  } while (status < 0 && errno == EINTR);
  if (status < 0) return -1;
  return info.si_pid == pid;
}
