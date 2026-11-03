/* Private native-owner storage. Use SDK security descriptors and retained file
 * handles; chmod and path-only identity checks do not enforce Windows privacy.
 * No source/credential data crosses a shell or a managed foreign callback. */
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#include <windows.h>
#include <aclapi.h>
#include <wchar.h>
#include <stdlib.h>
#include <string.h>
#include "private_windows.h"

typedef struct PrivateSecurity {
  SECURITY_ATTRIBUTES attributes;
  SECURITY_DESCRIPTOR descriptor;
  TOKEN_USER *user;
  ACL *acl;
} PrivateSecurity;
typedef struct PathGuard {
  HANDLE *handles;
  size_t count;
} PathGuard;
typedef struct PrivateLock {
  HANDLE file;
  PathGuard ancestors;
} PrivateLock;

static int failure(uint32_t *error, DWORD code) {
  *error = code ? code : ERROR_INVALID_DATA;
  return -1;
}
static int absent(DWORD error) {
  return error == ERROR_FILE_NOT_FOUND || error == ERROR_PATH_NOT_FOUND;
}
void xplat_private_free(void *bytes) { free(bytes); }
void xplat_private_security_free(void *opaque) {
  PrivateSecurity *security = opaque;
  if (!security) return;
  free(security->user);
  free(security->acl);
  free(security);
}
void *xplat_private_security(uint32_t *error) {
  HANDLE token = NULL;
  DWORD length = 0;
  PrivateSecurity *security = calloc(1, sizeof(*security));
  if (!security) { failure(error, ERROR_NOT_ENOUGH_MEMORY); return NULL; }
  if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)) goto failed;
  GetTokenInformation(token, TokenUser, NULL, 0, &length);
  if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) goto failed;
  security->user = malloc(length);
  if (!security->user) { SetLastError(ERROR_NOT_ENOUGH_MEMORY); goto failed; }
  if (!GetTokenInformation(token, TokenUser, security->user, length, &length)) goto failed;
  CloseHandle(token); token = NULL;
  length = sizeof(ACL) + sizeof(ACCESS_ALLOWED_ACE) - sizeof(DWORD) +
    GetLengthSid(security->user->User.Sid);
  security->acl = malloc(length);
  if (!security->acl) { SetLastError(ERROR_NOT_ENOUGH_MEMORY); goto failed; }
  if (!InitializeAcl(security->acl, length, ACL_REVISION) ||
      !AddAccessAllowedAceEx(security->acl, ACL_REVISION,
        CONTAINER_INHERIT_ACE | OBJECT_INHERIT_ACE, FILE_ALL_ACCESS,
        security->user->User.Sid) ||
      !InitializeSecurityDescriptor(&security->descriptor, SECURITY_DESCRIPTOR_REVISION) ||
      !SetSecurityDescriptorOwner(&security->descriptor, security->user->User.Sid, FALSE) ||
      !SetSecurityDescriptorDacl(&security->descriptor, TRUE, security->acl, FALSE) ||
      !SetSecurityDescriptorControl(&security->descriptor, SE_DACL_PROTECTED, SE_DACL_PROTECTED)) goto failed;
  security->attributes.nLength = sizeof(SECURITY_ATTRIBUTES);
  security->attributes.lpSecurityDescriptor = &security->descriptor;
  security->attributes.bInheritHandle = FALSE;
  return security; /* attributes is the first field, also usable by SDK callers. */
failed:
  failure(error, GetLastError());
  if (token) CloseHandle(token);
  xplat_private_security_free(security);
  return NULL;
}

static int reserved(const wchar_t *name, size_t length) {
  size_t base = 0;
  while (base < length && name[base] != L'.') ++base;
  if (base == 3 && (!_wcsnicmp(name,L"CON",3) || !_wcsnicmp(name,L"PRN",3) ||
      !_wcsnicmp(name,L"AUX",3) || !_wcsnicmp(name,L"NUL",3))) return 1;
  if ((base==6 && !_wcsnicmp(name,L"CONIN$",6)) ||
      (base==7 && !_wcsnicmp(name,L"CONOUT$",7))) return 1;
  return base == 4 && ((name[3]>=L'1' && name[3]<=L'9') ||
      name[3]==0x00b9 || name[3]==0x00b2 || name[3]==0x00b3) &&
    (!_wcsnicmp(name,L"COM",3) || !_wcsnicmp(name,L"LPT",3));
}
static wchar_t *local_path(const char *input, uint32_t *error) {
  int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, input, -1, NULL, 0);
  wchar_t *path;
  size_t start, index;
  if (!length) { failure(error,GetLastError()); return NULL; }
  path = malloc((size_t)length * sizeof(wchar_t));
  if (!path) { failure(error,ERROR_NOT_ENOUGH_MEMORY); return NULL; }
  if (!MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,input,-1,path,length)) goto failed;
  for (index=0; path[index]; ++index) if (path[index] == L'/') path[index] = L'\\';
  if (length < 5 || !((path[0]>=L'A' && path[0]<=L'Z') ||
      (path[0]>=L'a' && path[0]<=L'z')) || path[1]!=L':' || path[2]!=L'\\') goto invalid;
  start = 3;
  for (index=3; ; ++index) {
    wchar_t ch = path[index];
    if (!ch || ch == L'\\') {
      size_t count = index-start;
      if (!count || path[index-1]==L'.' || path[index-1]==L' ' || reserved(path+start,count)) goto invalid;
      if (!ch) return path;
      start=index+1;
    } else if (ch < 32 || wcschr(L":*?\"<>|",ch)) goto invalid;
  }
invalid:
  SetLastError(ERROR_INVALID_NAME);
failed:
  failure(error,GetLastError()); free(path); return NULL;
}
static void unguard(PathGuard *guard) {
  while (guard->count) CloseHandle(guard->handles[--guard->count]);
  free(guard->handles); guard->handles = NULL;
}
static int directory_handle(HANDLE handle, uint32_t *error) {
  BY_HANDLE_FILE_INFORMATION info;
  if (!GetFileInformationByHandle(handle,&info)) return failure(error,GetLastError());
  if (!(info.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) ||
      (info.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT)) return failure(error,ERROR_ACCESS_DENIED);
  return 0;
}
static int ntfs_handle(HANDLE handle,uint32_t *error) {
  wchar_t filesystem[32];
  /* The shared stamp carries NTFS's 64-bit index. Do not infer local NTFS
   * from drive-letter syntax: a drive letter can designate a network share. */
  if (!GetVolumeInformationByHandleW(handle,NULL,0,NULL,NULL,NULL,filesystem,32))
    return failure(error,GetLastError());
  if (_wcsicmp(filesystem,L"NTFS")) return failure(error,ERROR_NOT_SUPPORTED);
  return 0;
}
/* Pin every ancestor without FILE_SHARE_DELETE while operating on a path. This
 * prevents a junction/rename swap between validation and the final SDK open. */
static int guard_parent(wchar_t *path, PathGuard *guard, PrivateSecurity *create, uint32_t *error) {
  size_t index, length = wcslen(path);
  memset(guard,0,sizeof(*guard));
  guard->handles = calloc(length,sizeof(HANDLE));
  if (!guard->handles) return failure(error,ERROR_NOT_ENOUGH_MEMORY);
  /* Validate/pin the volume before creating any missing directory. */
  wchar_t next=path[3];
  path[3]=0;
  if (GetDriveTypeW(path)==DRIVE_REMOTE) {
    path[3]=next; unguard(guard); return failure(error,ERROR_NOT_SUPPORTED);
  }
  HANDLE root=CreateFileW(path,FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,
    NULL,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  DWORD rootError=GetLastError();
  path[3]=next;
  if (root==INVALID_HANDLE_VALUE) { unguard(guard); return failure(error,rootError); }
  guard->handles[guard->count++]=root;
  if (directory_handle(root,error)<0 || ntfs_handle(root,error)<0) { unguard(guard); return -1; }
  for (index=3; index<length; ++index) if (path[index]==L'\\') {
    HANDLE handle;
    path[index]=0;
    handle=CreateFileW(path,FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,
      NULL,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,NULL);
    if (handle==INVALID_HANDLE_VALUE && create && absent(GetLastError())) {
      if (CreateDirectoryW(path,&create->attributes) || GetLastError()==ERROR_ALREADY_EXISTS)
        handle=CreateFileW(path,FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,
          NULL,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,NULL);
    }
    path[index]=L'\\';
    if (handle==INVALID_HANDLE_VALUE) { failure(error,GetLastError()); unguard(guard); return -1; }
    guard->handles[guard->count++]=handle;
    if (directory_handle(handle,error)<0) { unguard(guard); return -1; }
  }
  return 0;
}
static int security_handle(HANDLE handle, PrivateSecurity *security, uint32_t *error) {
  PSECURITY_DESCRIPTOR descriptor=NULL;
  PSID owner=NULL;
  PACL acl=NULL;
  ACCESS_ALLOWED_ACE *ace=NULL;
  DWORD code;
  code=GetSecurityInfo(handle,SE_FILE_OBJECT,OWNER_SECURITY_INFORMATION|DACL_SECURITY_INFORMATION,
    &owner,NULL,&acl,NULL,&descriptor);
  if (code!=ERROR_SUCCESS) return failure(error,code);
  /* Accept inherited user-only file ACLs produced by project workers too.
   * Never repair an existing permissive/foreign ACL silently. */
  if (!owner || !EqualSid(owner,security->user->User.Sid) || !acl || acl->AceCount!=1 ||
      !GetAce(acl,0,(void **)&ace) || ace->Header.AceType!=ACCESS_ALLOWED_ACE_TYPE ||
      (ace->Header.AceFlags & INHERIT_ONLY_ACE) || ace->Mask!=FILE_ALL_ACCESS ||
      !EqualSid(&ace->SidStart,security->user->User.Sid)) code=ERROR_ACCESS_DENIED;
  LocalFree(descriptor);
  if (code!=ERROR_SUCCESS) return failure(error,code);
  return 0;
}
int xplat_private_security_check(void *handle, uint32_t *error) {
  PrivateSecurity *security=xplat_private_security(error);
  if (!security) return -1;
  int result=security_handle(handle,security,error);
  xplat_private_security_free(security);
  return result;
}
static int private_handle(HANDLE handle, PrivateSecurity *security, int directory,
    XplatPrivateStamp *stamp, uint32_t *error) {
  BY_HANDLE_FILE_INFORMATION info;
  if (GetFileType(handle)!=FILE_TYPE_DISK || !GetFileInformationByHandle(handle,&info))
    return failure(error,GetLastError());
  if ((info.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) ||
      (!!(info.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != !!directory) ||
      (!directory && info.nNumberOfLinks!=1)) return failure(error,ERROR_ACCESS_DENIED);
  if (ntfs_handle(handle,error)<0) return -1;
  if (security_handle(handle,security,error)<0) return -1;
  if (stamp) {
    stamp->device=info.dwVolumeSerialNumber;
    stamp->file=((uint64_t)info.nFileIndexHigh<<32) | info.nFileIndexLow;
  }
  return 0;
}
int xplat_private_directory(const char *input, int create, uint32_t *error) {
  wchar_t *path=local_path(input,error);
  PathGuard guard={0};
  PrivateSecurity *security=NULL;
  HANDLE handle=INVALID_HANDLE_VALUE;
  int result=-1;
  if (!path) return -1;
  security=xplat_private_security(error);
  if (!security) goto done;
  if (guard_parent(path,&guard,create?security:NULL,error)<0) { if (!create && absent(*error)) result=1; goto done; }
  if (create && !CreateDirectoryW(path,&security->attributes)) {
    DWORD code=GetLastError();
    if (create==2 && code==ERROR_ALREADY_EXISTS) { result=2; goto done; }
    if (code!=ERROR_ALREADY_EXISTS) { failure(error,code); goto done; }
  }
  handle=CreateFileW(path,READ_CONTROL|FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,
    NULL,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { DWORD code=GetLastError(); result=absent(code)?1:failure(error,code); goto done; }
  result=private_handle(handle,security,1,NULL,error);
done:
  if (handle!=INVALID_HANDLE_VALUE) CloseHandle(handle);
  xplat_private_security_free(security); unguard(&guard); free(path); return result;
}
/* A file operation also pins and validates its immediate private directory. */
static int private_parent(wchar_t *path, PathGuard *guard, PrivateSecurity *security,uint32_t *error) {
  if (guard_parent(path,guard,NULL,error)<0) return -1;
  if (!guard->count) return failure(error,ERROR_INVALID_NAME);
  /* Ancestor handles were opened for attributes only. Open the final parent
   * again with READ_CONTROL; the retained first handle prevents replacement. */
  wchar_t *last=wcsrchr(path,L'\\');
  /* Preserve the root separator: bare C: is not the directory C:\. */
  wchar_t *end=(last==path+2)?path+3:last;
  wchar_t saved=*end;
  HANDLE handle;
  *end=0;
  handle=CreateFileW(path,READ_CONTROL|FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,
    NULL,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  *end=saved;
  if (handle==INVALID_HANDLE_VALUE) return failure(error,GetLastError());
  int result=private_handle(handle,security,1,NULL,error);
  CloseHandle(handle); return result;
}
int xplat_private_read(const char *input,size_t maximum,char **bytes,size_t *length,uint32_t *error) {
  wchar_t *path=local_path(input,error);
  PrivateSecurity *security=NULL;
  PathGuard guard={0};
  HANDLE handle=INVALID_HANDLE_VALUE;
  LARGE_INTEGER size;
  char *output=NULL;
  size_t used=0;
  int result=-1;
  *bytes=NULL; *length=0;
  if (!path) return -1;
  security=xplat_private_security(error); if (!security) goto done;
  if (private_parent(path,&guard,security,error)<0) { if (absent(*error)) result=1; goto done; }
  handle=CreateFileW(path,GENERIC_READ|READ_CONTROL,FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,
    NULL,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { DWORD code=GetLastError(); result=absent(code)?1:failure(error,code); goto done; }
  if (private_handle(handle,security,0,NULL,error)<0) goto done;
  if (!GetFileSizeEx(handle,&size)) { failure(error,GetLastError()); goto done; }
  if (maximum==SIZE_MAX || size.QuadPart<0 || (uint64_t)size.QuadPart>maximum) { failure(error,ERROR_FILE_TOO_LARGE); goto done; }
  output=malloc(maximum+1);
  if (!output) { failure(error,ERROR_NOT_ENOUGH_MEMORY); goto done; }
  for (;;) {
    DWORD count=0, capacity=(DWORD)((maximum+1-used)<4096 ? maximum+1-used : 4096);
    if (!ReadFile(handle,output+used,capacity,&count,NULL)) { failure(error,GetLastError()); goto done; }
    if (!count) break;
    if (count>maximum-used) { failure(error,ERROR_FILE_TOO_LARGE); goto done; }
    used+=count;
  }
  *bytes=output; *length=used; output=NULL; result=0;
done:
  free(output); if (handle!=INVALID_HANDLE_VALUE) CloseHandle(handle);
  xplat_private_security_free(security); unguard(&guard); free(path); return result;
}
static void dispose(HANDLE handle) {
  FILE_DISPOSITION_INFO info={TRUE};
  SetFileInformationByHandle(handle,FileDispositionInfo,&info,sizeof(info));
}
int xplat_private_publish(const char *input,const char *tempInput,const char *bytes,
    size_t length,XplatPrivateStamp *stamp,uint32_t *error) {
  wchar_t *path=local_path(input,error), *temporary=NULL;
  PathGuard guard={0};
  PrivateSecurity *security=NULL;
  HANDLE handle=INVALID_HANDLE_VALUE;
  FILE_RENAME_INFO *rename=NULL;
  size_t offset=0, renameBytes;
  int result=-1;
  if (!path) return -1;
  temporary=local_path(tempInput,error); if (!temporary) goto done;
  size_t parentLength=(size_t)(wcsrchr(path,L'\\')-path);
  if (wcsrchr(temporary,L'\\')-temporary!=(ptrdiff_t)parentLength ||
      _wcsnicmp(path,temporary,parentLength)) { failure(error,ERROR_INVALID_NAME); goto done; }
  security=xplat_private_security(error); if (!security) goto done;
  if (private_parent(path,&guard,security,error)<0) goto done;
  /* Replacing one of our files is expected; overwriting a foreign/broad ACL,
   * hardlink or reparse target is not a repair operation. */
  HANDLE existing=CreateFileW(path,FILE_READ_ATTRIBUTES|READ_CONTROL,
    FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,NULL,OPEN_EXISTING,
    FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (existing!=INVALID_HANDLE_VALUE) {
    int safe=private_handle(existing,security,0,NULL,error);
    CloseHandle(existing);
    if (safe<0) goto done;
  } else if (!absent(GetLastError())) { failure(error,GetLastError()); goto done; }
  handle=CreateFileW(temporary,GENERIC_WRITE|READ_CONTROL|DELETE,FILE_SHARE_READ,
    &security->attributes,CREATE_NEW,FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { failure(error,GetLastError()); goto done; }
  if (private_handle(handle,security,0,stamp,error)<0) goto done;
  while (offset<length) {
    DWORD count=0, capacity=(DWORD)((length-offset)<65536?length-offset:65536);
    if (!WriteFile(handle,bytes+offset,capacity,&count,NULL) || !count) { failure(error,GetLastError()); goto done; }
    offset+=count;
  }
  if (!FlushFileBuffers(handle)) { failure(error,GetLastError()); goto done; }
  renameBytes=sizeof(FILE_RENAME_INFO)+wcslen(path)*sizeof(wchar_t);
  if (renameBytes>MAXDWORD) { failure(error,ERROR_INVALID_NAME); goto done; }
  rename=calloc(1,renameBytes);
  if (!rename) { failure(error,ERROR_NOT_ENOUGH_MEMORY); goto done; }
  /* Legacy FileRenameInfo can fail while an ordinary reader holds the old
   * target. NTFS POSIX replacement preserves that reader's old file handle. */
  rename->Flags=FILE_RENAME_FLAG_REPLACE_IF_EXISTS|FILE_RENAME_FLAG_POSIX_SEMANTICS;
  rename->FileNameLength=(DWORD)(wcslen(path)*sizeof(wchar_t));
  memcpy(rename->FileName,path,rename->FileNameLength);
  if (!SetFileInformationByHandle(handle,FileRenameInfoEx,rename,(DWORD)renameBytes)) { failure(error,GetLastError()); goto done; }
  result=0;
done:
  if (handle!=INVALID_HANDLE_VALUE) { if (result<0) dispose(handle); CloseHandle(handle); }
  free(rename); xplat_private_security_free(security); unguard(&guard); free(path); free(temporary); return result;
}
int xplat_private_remove(const char *input,XplatPrivateStamp expected,uint32_t *error) {
  wchar_t *path=local_path(input,error);
  PrivateSecurity *security=NULL;
  PathGuard guard={0};
  HANDLE handle=INVALID_HANDLE_VALUE;
  XplatPrivateStamp stamp;
  int result=-1;
  if (!path) return -1;
  security=xplat_private_security(error); if (!security) goto done;
  if (private_parent(path,&guard,security,error)<0) { if (absent(*error)) result=1; goto done; }
  handle=CreateFileW(path,DELETE|READ_CONTROL|FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,
    NULL,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { DWORD code=GetLastError(); result=absent(code)?1:failure(error,code); goto done; }
  if (private_handle(handle,security,0,&stamp,error)<0) goto done;
  result=0;
  if (stamp.device==expected.device && stamp.file==expected.file) {
    FILE_DISPOSITION_INFO disposition={TRUE};
    if (!SetFileInformationByHandle(handle,FileDispositionInfo,&disposition,sizeof(disposition))) result=failure(error,GetLastError());
  }
done:
  if (handle!=INVALID_HANDLE_VALUE) CloseHandle(handle);
  xplat_private_security_free(security); unguard(&guard); free(path); return result;
}
void *xplat_private_append(const char *input,uint32_t *error) {
  wchar_t *path=local_path(input,error);
  PrivateSecurity *security=NULL;
  PathGuard guard={0};
  HANDLE handle=INVALID_HANDLE_VALUE;
  int success=0;
  if (!path) return NULL;
  security=xplat_private_security(error); if (!security) goto done;
  if (private_parent(path,&guard,security,error)<0) goto done;
  handle=CreateFileW(path,FILE_APPEND_DATA|FILE_READ_ATTRIBUTES|READ_CONTROL,
    FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,&security->attributes,
    OPEN_ALWAYS,FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { failure(error,GetLastError()); goto done; }
  if (private_handle(handle,security,0,NULL,error)<0) goto done;
  success=1;
done:
  if (!success && handle!=INVALID_HANDLE_VALUE) CloseHandle(handle);
  xplat_private_security_free(security); unguard(&guard); free(path);
  return success?handle:NULL;
}
void *xplat_private_lock(const char *input,uint32_t *error) {
  wchar_t *path=local_path(input,error);
  PrivateSecurity *security=NULL;
  PathGuard guard={0};
  HANDLE handle=INVALID_HANDLE_VALUE;
  OVERLAPPED overlap={0};
  PrivateLock *lock=NULL;
  if (!path) return NULL;
  security=xplat_private_security(error); if (!security) goto done;
  if (private_parent(path,&guard,security,error)<0) goto done;
  /* Omit delete sharing for the entire lifetime: another owner cannot replace
   * the locked identity with an unlocked file at the same pathname. */
  handle=CreateFileW(path,GENERIC_READ|GENERIC_WRITE|READ_CONTROL,FILE_SHARE_READ|FILE_SHARE_WRITE,
    &security->attributes,OPEN_ALWAYS,FILE_FLAG_OPEN_REPARSE_POINT,NULL);
  if (handle==INVALID_HANDLE_VALUE) { failure(error,GetLastError()); goto done; }
  if (private_handle(handle,security,0,NULL,error)<0) goto done;
  if (!LockFileEx(handle,LOCKFILE_EXCLUSIVE_LOCK|LOCKFILE_FAIL_IMMEDIATELY,0,1,0,&overlap)) {
    failure(error,GetLastError()); goto done;
  }
  lock=malloc(sizeof(*lock));
  if (!lock) { failure(error,ERROR_NOT_ENOUGH_MEMORY); goto done; }
  lock->file=handle; lock->ancestors=guard;
  memset(&guard,0,sizeof(guard));
done:
  if (!lock && handle!=INVALID_HANDLE_VALUE) CloseHandle(handle);
  xplat_private_security_free(security); unguard(&guard); free(path);
  return lock;
}
void xplat_private_unlock(void *opaque) {
  PrivateLock *lock=opaque;
  OVERLAPPED overlap={0};
  if (!lock) return;
  UnlockFileEx(lock->file,0,1,0,&overlap); CloseHandle(lock->file);
  unguard(&lock->ancestors); free(lock);
}
