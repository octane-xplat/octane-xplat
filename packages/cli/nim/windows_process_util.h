#ifndef XPLAT_WINDOWS_PROCESS_UTIL_H
#define XPLAT_WINDOWS_PROCESS_UTIL_H
/* Shared literal argv/environment/image preparation for owned engine jobs and
 * the explicit daemon handoff. Neither path invokes an implicit shell. */
#include <windows.h>
#include <stdlib.h>
#include <string.h>
#include <wchar.h>
#include <stdint.h>
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

static int executable_image(const wchar_t *exe,DWORD *error) {
  DWORD binary_type;
  size_t length=wcslen(exe);
  while (length && (exe[length-1]==L'.' || exe[length-1]==L' ')) --length;
  if (length>=4 &&
      (CompareStringOrdinal(exe+length-4,4,L".cmd",4,TRUE)==CSTR_EQUAL ||
       CompareStringOrdinal(exe+length-4,4,L".bat",4,TRUE)==CSTR_EQUAL)) {
    *error=ERROR_BAD_EXE_FORMAT; return 0;
  }
  if (!GetBinaryTypeW(exe,&binary_type)) { *error=GetLastError(); return 0; }
  if (binary_type!=SCS_32BIT_BINARY && binary_type!=SCS_64BIT_BINARY) {
    *error=ERROR_BAD_EXE_FORMAT; return 0;
  }
  return 1;
}
#endif
