/* A published owner survives its invoking client. One explicit inherited job
 * handle keeps the owner's job alive; the owner clears inheritance immediately.
 * Engine jobs never inherit that handle or receive breakaway permission. */
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#include <windows.h>
#include <stdio.h>
#include "windows_process_util.h"
#include "private_windows.h"
#include "bootstrap_windows.h"

typedef struct BootstrapLaunch { HANDLE process,job; } BootstrapLaunch;
static HANDLE owner_job;
static void close_handle(HANDLE *handle) {
  if (*handle && *handle!=INVALID_HANDLE_VALUE) CloseHandle(*handle);
  *handle=NULL;
}
void *xplat_bootstrap_spawn(const char *executable,const char *command_line,const char *cwd,
    const char *log_path,const char *const *environment,size_t count,uint32_t *pid,uint32_t *error) {
  BootstrapLaunch *launch=calloc(1,sizeof(*launch));
  wchar_t *exe=NULL,*line=NULL,*directory=NULL,*block=NULL;
  HANDLE log=NULL,input=NULL,output=NULL,errors=NULL,keeper=NULL;
  HANDLE inherited[4];
  const char **values=NULL;
  char job_environment[96];
  SECURITY_ATTRIBUTES security={sizeof(SECURITY_ATTRIBUTES),NULL,TRUE};
  JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits={0};
  STARTUPINFOEXW startup={0};
  PROCESS_INFORMATION process={0};
  SIZE_T attribute_size=0;
  int initialized=0,succeeded=0;
  DWORD failure=ERROR_NOT_ENOUGH_MEMORY;
  *pid=0; *error=0;
  if (!launch) goto done;
  exe=wide(executable); line=wide(command_line); directory=wide(cwd);
  if (!exe || !line || !directory) { failure=GetLastError(); goto done; }
  if (wcslen(line)>=32767) { failure=ERROR_FILENAME_EXCED_RANGE; goto done; }
  if (!executable_image(exe,&failure)) goto done;
  launch->job=CreateJobObjectW(NULL,NULL);
  if (!launch->job) goto failed;
  limits.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
  if (!SetInformationJobObject(launch->job,JobObjectExtendedLimitInformation,&limits,sizeof(limits))) goto failed;
  if (!DuplicateHandle(GetCurrentProcess(),launch->job,GetCurrentProcess(),&keeper,0,TRUE,DUPLICATE_SAME_ACCESS)) goto failed;
  _snprintf_s(job_environment,sizeof(job_environment),_TRUNCATE,
    "XPLAT_NIM_BOOTSTRAP_JOB=%llu",(unsigned long long)(uintptr_t)keeper);
  values=calloc(count+1,sizeof(char *));
  if (!values) goto done;
  if (count) memcpy(values,environment,count*sizeof(char *));
  values[count]=job_environment;
  block=environment_block(values,count+1);
  if (!block) { failure=GetLastError(); goto done; }
  log=xplat_private_append(log_path,error);
  if (!log) { failure=*error; goto done; }
  if (!DuplicateHandle(GetCurrentProcess(),log,GetCurrentProcess(),&output,0,TRUE,DUPLICATE_SAME_ACCESS) ||
      !DuplicateHandle(GetCurrentProcess(),log,GetCurrentProcess(),&errors,0,TRUE,DUPLICATE_SAME_ACCESS)) goto failed;
  input=CreateFileW(L"NUL",GENERIC_READ,FILE_SHARE_READ|FILE_SHARE_WRITE,
    &security,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,NULL);
  if (input==INVALID_HANDLE_VALUE) goto failed;
  inherited[0]=input; inherited[1]=output; inherited[2]=errors; inherited[3]=keeper;
  InitializeProcThreadAttributeList(NULL,2,0,&attribute_size);
  startup.lpAttributeList=malloc(attribute_size);
  if (!startup.lpAttributeList) goto done;
  if (!InitializeProcThreadAttributeList(startup.lpAttributeList,2,0,&attribute_size)) goto failed;
  initialized=1;
  if (!UpdateProcThreadAttribute(startup.lpAttributeList,0,PROC_THREAD_ATTRIBUTE_HANDLE_LIST,
      inherited,sizeof(inherited),NULL,NULL) ||
      !UpdateProcThreadAttribute(startup.lpAttributeList,0,PROC_THREAD_ATTRIBUTE_JOB_LIST,
      &launch->job,sizeof(launch->job),NULL,NULL)) goto failed;
  startup.StartupInfo.cb=sizeof(startup);
  startup.StartupInfo.dwFlags=STARTF_USESTDHANDLES;
  startup.StartupInfo.hStdInput=input;
  startup.StartupInfo.hStdOutput=output;
  startup.StartupInfo.hStdError=errors;
  /* JOB_LIST assigns before child code. Suspending would create an orphan
   * window: an unresumed child already retains the inherited keeper handle.
   * Breakaway is explicit and must be permitted by the invoking job policy. */
  if (!CreateProcessW(exe,line,NULL,NULL,TRUE,CREATE_NO_WINDOW|CREATE_NEW_PROCESS_GROUP|
      CREATE_BREAKAWAY_FROM_JOB|CREATE_UNICODE_ENVIRONMENT|EXTENDED_STARTUPINFO_PRESENT,
      block,directory,&startup.StartupInfo,&process)) goto failed;
  launch->process=process.hProcess;
  *pid=process.dwProcessId; succeeded=1;
  goto done;
failed:
  failure=GetLastError();
done:
  close_handle(&process.hThread);
  close_handle(&keeper); close_handle(&input); close_handle(&output); close_handle(&errors); close_handle(&log);
  if (initialized) DeleteProcThreadAttributeList(startup.lpAttributeList);
  free(startup.lpAttributeList); free(values);
  free(exe); free(line); free(directory); free(block);
  if (!succeeded) { *error=failure; xplat_bootstrap_release(launch); return NULL; }
  return launch;
}
int xplat_bootstrap_poll(void *opaque,uint32_t *code,uint32_t *active,uint32_t *error) {
  BootstrapLaunch *launch=opaque;
  JOBOBJECT_BASIC_ACCOUNTING_INFORMATION info;
  DWORD waited,exit_code;
  *active=0; *code=0; *error=0;
  if (!QueryInformationJobObject(launch->job,JobObjectBasicAccountingInformation,&info,sizeof(info),NULL)) goto failed;
  *active=info.ActiveProcesses;
  waited=WaitForSingleObject(launch->process,0);
  if (waited==WAIT_TIMEOUT) return 0;
  if (waited!=WAIT_OBJECT_0 || !GetExitCodeProcess(launch->process,&exit_code)) goto failed;
  *code=exit_code;
  return *active==0?1:0;
failed:
  *error=GetLastError(); return -1;
}
int xplat_bootstrap_stop(void *opaque,uint32_t *error) {
  if (TerminateJobObject(((BootstrapLaunch *)opaque)->job,1)) return 1;
  *error=GetLastError(); return 0;
}
void xplat_bootstrap_release(void *opaque) {
  BootstrapLaunch *launch=opaque;
  if (!launch) return;
  /* Release is handoff, not cancellation. The child's keeper remains alive. */
  close_handle(&launch->process); close_handle(&launch->job); free(launch);
}
int xplat_bootstrap_adopt(uint64_t value,uint32_t *error) {
  HANDLE job=(HANDLE)(uintptr_t)value;
  BOOL member=FALSE;
  JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits;
  if (owner_job || !job || job==INVALID_HANDLE_VALUE) { *error=ERROR_INVALID_HANDLE; return 0; }
  if (!IsProcessInJob(GetCurrentProcess(),job,&member) || !member ||
      !QueryInformationJobObject(job,JobObjectExtendedLimitInformation,&limits,sizeof(limits),NULL)) {
    *error=GetLastError(); if (!*error) *error=ERROR_ACCESS_DENIED; return 0;
  }
  if (!(limits.BasicLimitInformation.LimitFlags & JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE) ||
      (limits.BasicLimitInformation.LimitFlags & (JOB_OBJECT_LIMIT_BREAKAWAY_OK|JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK))) {
    *error=ERROR_ACCESS_DENIED; return 0;
  }
  if (!SetHandleInformation(job,HANDLE_FLAG_INHERIT,0)) { *error=GetLastError(); return 0; }
  /* Retain until process exit. Closing this last handle earlier kills self. */
  owner_job=job; return 1;
}
int xplat_bootstrap_alive(uint32_t pid) {
  HANDLE process=OpenProcess(SYNCHRONIZE,FALSE,pid);
  if (!process) return GetLastError()==ERROR_ACCESS_DENIED;
  DWORD result=WaitForSingleObject(process,0);
  CloseHandle(process); return result==WAIT_TIMEOUT;
}
