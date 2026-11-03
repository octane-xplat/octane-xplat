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

typedef struct {
  HANDLE process, job, output, error;
} XplatProcess;

static void close_handle(HANDLE *handle) {
  if (*handle && *handle != INVALID_HANDLE_VALUE) CloseHandle(*handle);
  *handle = NULL;
}

static wchar_t *wide(const char *value) {
  int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value, -1, NULL, 0);
  wchar_t *result;
  if (!length) return NULL;
  result = (wchar_t *)calloc((size_t)length, sizeof(wchar_t));
  if (!result) { SetLastError(ERROR_NOT_ENOUGH_MEMORY); return NULL; }
  if (!MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value, -1, result, length)) {
    DWORD error = GetLastError(); free(result); SetLastError(error); return NULL;
  }
  return result;
}

static int compare_environment(const void *a, const void *b) {
  /* Windows environment names use ordinal case-insensitive comparison. */
  return CompareStringOrdinal(*(const wchar_t *const *)a, -1,
    *(const wchar_t *const *)b, -1, TRUE) - CSTR_EQUAL;
}

static wchar_t *environment_block(const char *const *values, size_t count) {
  wchar_t **items = (wchar_t **)calloc(count ? count : 1, sizeof(wchar_t *));
  wchar_t *result = NULL, *cursor;
  size_t index, length = 1;
  DWORD error = ERROR_NOT_ENOUGH_MEMORY;
  if (!items) goto done;
  for (index = 0; index < count; ++index) {
    items[index] = wide(values[index]);
    if (!items[index]) { error = GetLastError(); goto done; }
    if (wcslen(items[index]) > 32766 || length > SIZE_MAX / sizeof(wchar_t) - wcslen(items[index]) - 2) {
      error = ERROR_BAD_ENVIRONMENT; goto done;
    }
    length += wcslen(items[index]) + 1;
  }
  qsort(items, count, sizeof(wchar_t *), compare_environment);
  result = (wchar_t *)calloc(length + 1, sizeof(wchar_t));
  if (!result) goto done;
  cursor = result;
  for (index = 0; index < count; ++index) {
    size_t size = wcslen(items[index]) + 1;
    memcpy(cursor, items[index], size * sizeof(wchar_t)); cursor += size;
  }
done:
  if (items) { for (index = 0; index < count; ++index) free(items[index]); free(items); }
  if (!result) SetLastError(error);
  return result;
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
  DWORD binary_type;
  size_t executable_length;
  memset(&startup, 0, sizeof(startup)); memset(&process, 0, sizeof(process));
  memset(&limits, 0, sizeof(limits));
  *error = 0; *pid = 0;
  if (!result) goto done;
  exe = wide(executable); line = wide(command_line); directory = wide(cwd);
  block = environment_block(environment, count);
  if (!exe || !line || !directory || !block) { failure = GetLastError(); goto done; }
  if (wcslen(line) >= 32767) { failure = ERROR_FILENAME_EXCED_RANGE; goto done; }
  /* CreateProcessW can dispatch batch files through cmd even without an
   * explicit shell call. Refuse their Win32-normalized names and require an
   * actual Windows executable image before creating any process or job. */
  executable_length = wcslen(exe);
  while (executable_length && (exe[executable_length-1] == L'.' || exe[executable_length-1] == L' ')) --executable_length;
  if (executable_length >= 4 &&
      (CompareStringOrdinal(exe + executable_length - 4, 4, L".cmd", 4, TRUE) == CSTR_EQUAL ||
       CompareStringOrdinal(exe + executable_length - 4, 4, L".bat", 4, TRUE) == CSTR_EQUAL)) {
    failure = ERROR_BAD_EXE_FORMAT; goto done;
  }
  if (!GetBinaryTypeW(exe, &binary_type)) goto failed;
  if (binary_type != SCS_32BIT_BINARY && binary_type != SCS_64BIT_BINARY) {
    failure = ERROR_BAD_EXE_FORMAT; goto done;
  }
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
