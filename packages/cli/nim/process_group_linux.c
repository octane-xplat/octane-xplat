#include "process_group.h"
#include <dirent.h>
#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* The unreaped session leader reserves this group identity. Count every other
 * member, including zombies: sending a signal is not proof of OS reaping. */
int xplat_group_descendants(int leader) {
  DIR *processes = opendir("/proc");
  if (!processes) return -1;
  int count = 0, failure = 0;
  for (;;) {
    errno = 0;
    struct dirent *entry = readdir(processes);
    if (!entry) { failure = errno; break; }
    char *end;
    long pid = strtol(entry->d_name, &end, 10);
    if (!entry->d_name[0] || *end || pid <= 0 || pid > INT_MAX || pid == leader) continue;
    char path[64];
    snprintf(path, sizeof(path), "/proc/%ld/stat", pid);
    FILE *file = fopen(path, "re");
    if (!file) {
      if (errno == ENOENT || errno == ESRCH) continue;
      failure = errno; break;
    }
    char buffer[8192];
    size_t length = fread(buffer, 1, sizeof(buffer) - 1, file);
    int saved = ferror(file) ? (errno ? errno : EIO) : 0;
    fclose(file);
    if (saved == ENOENT || saved == ESRCH) continue;
    if (saved) { failure = saved; break; }
    buffer[length] = '\0';
    /* comm can contain spaces, parentheses and newlines. Its last ')' precedes
     * the numeric stat fields; whitespace tokenization of the whole file fails. */
    char *fields = strrchr(buffer, ')');
    char state;
    long parent, group;
    if (!fields || sscanf(fields + 1, " %c %ld %ld", &state, &parent, &group) != 3) {
      failure = EIO; break;
    }
    if (group == leader) count++;
  }
  closedir(processes);
  if (failure) { errno = failure; return -1; }
  return count;
}
