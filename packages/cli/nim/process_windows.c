/* Windows 10+: assign ownership during creation, before any child code runs.
 * https://devblogs.microsoft.com/oldnewthing/20230209-00/?p=107812
 * The job handle is unnamed, non-inheritable and never reconstructed from PIDs.
 */
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#include <windows.h>
#include <stdlib.h>
#include <string.h>
#include <wchar.h>
#include <stdint.h>
#include "process_windows.h"
#include "windows_process_util.h"

typedef struct {
  HANDLE process, job, output, error;
} XplatProcess;

static void close_handle(HANDLE *handle) {
  if (*handle && *handle != INVALID_HANDLE_VALUE) CloseHandle(*handle);
  *handle = NULL;
}


void *xplat_windows_spawn(const char *executable, const char *command_line,
  const char *cwd, const char *const *environment, size_t count,
  unsigned long *pid, unsigned long *error) {
  XplatProcess *result = (XplatProcess *)calloc(1, sizeof(XplatProcess));
  wchar_t *exe = NULL, *line = NULL, *directory = NULL, *block = NULL;
  HANDLE output_write = NULL, error_write = NULL, input = NULL;
  HANDLE inherited[3];
  SECURITY_ATTRIBUTES security = { sizeof(SECURITY_ATTRIBUTES), NULL, TRUE };
  JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits;
  STARTUPINFOEXW startup;
  PROCESS_INFORMATION process;
  SIZE_T attribute_size = 0;
  int attributes_initialized = 0, succeeded = 0;
  DWORD failure = ERROR_NOT_ENOUGH_MEMORY;
  memset(&startup, 0, sizeof(startup)); memset(&process, 0, sizeof(process));
  memset(&limits, 0, sizeof(limits));
  *error = 0; *pid = 0;
  if (!result) goto done;
  exe = wide(executable); line = wide(command_line); directory = wide(cwd);
  block = environment_block(environment, count);
  if (!exe || !line || !directory || !block) { failure = GetLastError(); goto done; }
  if (wcslen(line) >= 32767) { failure = ERROR_FILENAME_EXCED_RANGE; goto done; }
  if (!executable_image(exe,&failure)) goto done;
  result->job = CreateJobObjectW(NULL, NULL);
  if (!result->job) goto failed;
  limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
  if (!SetInformationJobObject(result->job, JobObjectExtendedLimitInformation, &limits, sizeof(limits))) goto failed;
  if (!CreatePipe(&result->output, &output_write, &security, 0)) goto failed;
  if (!SetHandleInformation(result->output, HANDLE_FLAG_INHERIT, 0)) goto failed;
  if (!CreatePipe(&result->error, &error_write, &security, 0)) goto failed;
  if (!SetHandleInformation(result->error, HANDLE_FLAG_INHERIT, 0)) goto failed;
  input = CreateFileW(L"NUL", GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
    &security, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
  if (input == INVALID_HANDLE_VALUE) goto failed;
  inherited[0] = input; inherited[1] = output_write; inherited[2] = error_write;
  InitializeProcThreadAttributeList(NULL, 2, 0, &attribute_size);
  startup.lpAttributeList = (LPPROC_THREAD_ATTRIBUTE_LIST)malloc(attribute_size);
  if (!startup.lpAttributeList) { failure = ERROR_NOT_ENOUGH_MEMORY; goto done; }
  if (!InitializeProcThreadAttributeList(startup.lpAttributeList, 2, 0, &attribute_size)) goto failed;
  attributes_initialized = 1;
  if (!UpdateProcThreadAttribute(startup.lpAttributeList, 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST,
      inherited, sizeof(inherited), NULL, NULL)) goto failed;
  if (!UpdateProcThreadAttribute(startup.lpAttributeList, 0, PROC_THREAD_ATTRIBUTE_JOB_LIST,
      &result->job, sizeof(result->job), NULL, NULL)) goto failed;
  startup.StartupInfo.cb = sizeof(startup);
  startup.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
  startup.StartupInfo.hStdInput = input;
  startup.StartupInfo.hStdOutput = output_write;
  startup.StartupInfo.hStdError = error_write;
  if (!CreateProcessW(exe, line, NULL, NULL, TRUE,
      CREATE_SUSPENDED | CREATE_NO_WINDOW | CREATE_UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO_PRESENT,
      block, directory, &startup.StartupInfo, &process)) goto failed;
  result->process = process.hProcess;
  if (ResumeThread(process.hThread) == (DWORD)-1) goto failed;
  *pid = process.dwProcessId;
  succeeded = 1;
  goto done;
failed:
  failure = GetLastError();
done:
  close_handle(&process.hThread);
  close_handle(&output_write); close_handle(&error_write); close_handle(&input);
  if (attributes_initialized) DeleteProcThreadAttributeList(startup.lpAttributeList);
  free(startup.lpAttributeList);
  free(exe); free(line); free(directory); free(block);
  if (!succeeded) {
    *error = failure;
    xplat_windows_release(result);
    return NULL;
  }
  return result;
}

int xplat_windows_read(void *process, int stream, char *buffer,
  unsigned long capacity, unsigned long *count, unsigned long *error) {
  XplatProcess *child = (XplatProcess *)process;
  HANDLE *pipe = stream ? &child->error : &child->output;
  DWORD available = 0;
  *count = 0; *error = 0;
  if (!*pipe) return 1;
  if (!PeekNamedPipe(*pipe, NULL, 0, NULL, &available, NULL)) goto failed;
  if (!available) return 0;
  if (available > capacity) available = capacity;
  if (!ReadFile(*pipe, buffer, available, count, NULL)) goto failed;
  return 0;
failed:
  *error = GetLastError();
  close_handle(pipe);
  if (*error == ERROR_BROKEN_PIPE || *error == ERROR_PIPE_NOT_CONNECTED) { *error = 0; return 1; }
  return -1;
}

int xplat_windows_poll(void *process, unsigned long *code,
  unsigned long *active, unsigned long *error) {
  XplatProcess *child = (XplatProcess *)process;
  JOBOBJECT_BASIC_ACCOUNTING_INFORMATION info;
  DWORD waited;
  *error = 0; *active = 0; *code = 0;
  if (!QueryInformationJobObject(child->job, JobObjectBasicAccountingInformation, &info, sizeof(info), NULL)) goto failed;
  *active = info.ActiveProcesses;
  waited = WaitForSingleObject(child->process, 0);
  if (waited == WAIT_TIMEOUT) return 0;
  if (waited != WAIT_OBJECT_0 || !GetExitCodeProcess(child->process, code)) goto failed;
  return 1;
failed:
  *error = GetLastError(); return -1;
}

int xplat_windows_stop(void *process, unsigned long *error) {
  XplatProcess *child = (XplatProcess *)process;
  *error = 0;
  if (TerminateJobObject(child->job, 1)) return 1;
  *error = GetLastError(); return 0;
}

void xplat_windows_release(void *process) {
  XplatProcess *child = (XplatProcess *)process;
  if (!child) return;
  /* KILL_ON_JOB_CLOSE also covers abrupt owner death. Ordinary completion waits
   * for ActiveProcesses==0 before calling this function. */
  if (child->job) TerminateJobObject(child->job, 1);
  if (child->process) WaitForSingleObject(child->process, INFINITE);
  close_handle(&child->job); close_handle(&child->process);
  close_handle(&child->output); close_handle(&child->error);
  free(child);
}

static volatile LONG interrupted;
static BOOL WINAPI control_event(DWORD event) {
  if (event == CTRL_C_EVENT || event == CTRL_BREAK_EVENT) {
    InterlockedExchange(&interrupted, 2); return TRUE;
  }
  return FALSE;
}
int xplat_windows_install_signals(void) { return SetConsoleCtrlHandler(control_event, TRUE) ? 1 : 0; }
int xplat_windows_interrupted(void) { return (int)InterlockedCompareExchange(&interrupted, 0, 0); }
