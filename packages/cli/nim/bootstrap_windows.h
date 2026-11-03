#ifndef XPLAT_BOOTSTRAP_WINDOWS_H
#define XPLAT_BOOTSTRAP_WINDOWS_H
#include <stddef.h>
#include <stdint.h>
void *xplat_bootstrap_spawn(const char *executable,const char *line,const char *cwd,
  const char *log,const char *const *environment,size_t count,uint32_t *pid,uint32_t *error);
int xplat_bootstrap_poll(void *launch,uint32_t *code,uint32_t *active,uint32_t *error);
int xplat_bootstrap_stop(void *launch,uint32_t *error);
void xplat_bootstrap_release(void *launch);
int xplat_bootstrap_adopt(uint64_t value,uint32_t *error);
int xplat_bootstrap_alive(uint32_t pid);
#endif
