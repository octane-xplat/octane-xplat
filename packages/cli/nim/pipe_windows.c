/* Local byte pipes with C-owned OVERLAPPED records/buffers. No SDK callback
 * enters Nim, and cancellation never frees memory still owned by kernel I/O.
 * https://learn.microsoft.com/en-us/windows/win32/fileio/canceling-pending-i-o-operations
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
#include "pipe_windows.h"
#include "private_windows.h"

typedef struct PipeIo { OVERLAPPED overlap; int pending; } PipeIo;
typedef struct NativePipe {
  HANDLE file;
  PipeIo connect, read, write;
  int connected, closing;
  DWORD writing;
  char input[8192], output[8192];
} NativePipe;
typedef struct PipeServer {
  wchar_t *name;
  void *security;
  NativePipe *pending;
} PipeServer;

int xplat_pipe_name(const char *path) {
  const char prefix[]="\\\\.\\pipe\\";
  size_t length=strlen(path), begin=sizeof(prefix)-1, index;
  if (length<=begin || length>begin+160 || _strnicmp(path,prefix,begin)) return 0;
  for (index=begin; index<length; ++index) {
    unsigned char ch=(unsigned char)path[index];
    if (!((ch>='a' && ch<='z') || (ch>='A' && ch<='Z') ||
        (ch>='0' && ch<='9') || ch=='-' || ch=='_' || (ch=='.' && index>begin && index<length-1))) return 0;
  }
  return 1;
}
static wchar_t *pipe_name(const char *path,uint32_t *error) {
  int length;
  wchar_t *name;
  if (!xplat_pipe_name(path)) { *error=ERROR_INVALID_NAME; return NULL; }
  length=MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,path,-1,NULL,0);
  if (!length) { *error=GetLastError(); return NULL; }
  name=calloc((size_t)length,sizeof(wchar_t));
  if (!name) { *error=ERROR_NOT_ENOUGH_MEMORY; return NULL; }
  if (!MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,path,-1,name,length)) {
    *error=GetLastError(); free(name); return NULL;
  }
  return name;
}
static void release_pipe(NativePipe *pipe) {
  if (pipe->file!=INVALID_HANDLE_VALUE) CloseHandle(pipe->file);
  if (pipe->connect.overlap.hEvent) CloseHandle(pipe->connect.overlap.hEvent);
  if (pipe->read.overlap.hEvent) CloseHandle(pipe->read.overlap.hEvent);
  if (pipe->write.overlap.hEvent) CloseHandle(pipe->write.overlap.hEvent);
  free(pipe);
}
static NativePipe *allocate_pipe(uint32_t *error) {
  NativePipe *pipe=calloc(1,sizeof(*pipe));
  if (!pipe) { *error=ERROR_NOT_ENOUGH_MEMORY; return NULL; }
  pipe->file=INVALID_HANDLE_VALUE;
  pipe->connect.overlap.hEvent=CreateEventW(NULL,TRUE,FALSE,NULL);
  pipe->read.overlap.hEvent=CreateEventW(NULL,TRUE,FALSE,NULL);
  pipe->write.overlap.hEvent=CreateEventW(NULL,TRUE,FALSE,NULL);
  if (!pipe->connect.overlap.hEvent || !pipe->read.overlap.hEvent || !pipe->write.overlap.hEvent) {
    *error=GetLastError(); release_pipe(pipe); return NULL;
  }
  return pipe;
}
static int completed(NativePipe *pipe,PipeIo *io,DWORD *count,uint32_t *error) {
  if (GetOverlappedResult(pipe->file,&io->overlap,count,FALSE)) { io->pending=0; return 1; }
  DWORD code=GetLastError();
  if (code==ERROR_IO_INCOMPLETE) return 0;
  io->pending=0; *error=code; return -1;
}
static void prepare_io(PipeIo *io) {
  HANDLE event=io->overlap.hEvent;
  memset(&io->overlap,0,sizeof(io->overlap));
  io->overlap.hEvent=event;
  ResetEvent(event);
}
static NativePipe *instance(PipeServer *server,int first,uint32_t *error) {
  NativePipe *pipe=allocate_pipe(error);
  if (!pipe) return NULL;
  pipe->file=CreateNamedPipeW(server->name,PIPE_ACCESS_DUPLEX|FILE_FLAG_OVERLAPPED|
    (first?FILE_FLAG_FIRST_PIPE_INSTANCE:0),PIPE_TYPE_BYTE|PIPE_READMODE_BYTE|PIPE_WAIT|PIPE_REJECT_REMOTE_CLIENTS,
    PIPE_UNLIMITED_INSTANCES,8192,8192,0,(SECURITY_ATTRIBUTES *)server->security);
  if (pipe->file==INVALID_HANDLE_VALUE) { *error=GetLastError(); release_pipe(pipe); return NULL; }
  if (ConnectNamedPipe(pipe->file,&pipe->connect.overlap)) {
    pipe->connect.pending=1;
  } else {
    DWORD code=GetLastError();
    if (code==ERROR_PIPE_CONNECTED) pipe->connected=1;
    else if (code==ERROR_IO_PENDING) pipe->connect.pending=1;
    else { *error=code; release_pipe(pipe); return NULL; }
  }
  return pipe;
}
void *xplat_pipe_listen(const char *path,uint32_t *error) {
  PipeServer *server=calloc(1,sizeof(*server));
  if (!server) { *error=ERROR_NOT_ENOUGH_MEMORY; return NULL; }
  server->name=pipe_name(path,error);
  if (server->name) server->security=xplat_private_security(error);
  if (server->security) server->pending=instance(server,1,error);
  if (!server->pending) {
    xplat_private_security_free(server->security); free(server->name); free(server); return NULL;
  }
  return server;
}
int xplat_pipe_accept(void *opaque,void **accepted,uint32_t *error) {
  PipeServer *server=opaque;
  NativePipe *pipe=server->pending;
  DWORD count=0;
  *accepted=NULL;
  if (!pipe->connected) {
    int result=completed(pipe,&pipe->connect,&count,error);
    if (result<=0) return result;
    pipe->connected=1;
  }
  /* Keep an instance alive across handoff. Another listener can never acquire
   * FIRST_PIPE_INSTANCE between serving one peer and creating the next. */
  NativePipe *next=instance(server,0,error);
  if (!next) return -1;
  server->pending=next; *accepted=pipe; return 1;
}
void *xplat_pipe_connect(const char *path,uint32_t *error) {
  wchar_t *name=pipe_name(path,error);
  NativePipe *pipe;
  if (!name) return NULL;
  pipe=allocate_pipe(error);
  if (!pipe) { free(name); return NULL; }
  /* Individual data rights avoid granting FILE_CREATE_PIPE_INSTANCE via
   * FILE_GENERIC_WRITE. Identification SQOS prevents server impersonation. */
  pipe->file=CreateFileW(name,FILE_READ_DATA|FILE_WRITE_DATA|FILE_READ_ATTRIBUTES|READ_CONTROL|SYNCHRONIZE,
    0,NULL,OPEN_EXISTING,FILE_FLAG_OVERLAPPED|SECURITY_SQOS_PRESENT|SECURITY_IDENTIFICATION,NULL);
  free(name);
  if (pipe->file==INVALID_HANDLE_VALUE) { *error=GetLastError(); release_pipe(pipe); return NULL; }
  pipe->connected=1; return pipe;
}
void *xplat_pipe_handle(void *opaque) { return ((NativePipe *)opaque)->file; }
int xplat_pipe_read(void *opaque,void *buffer,uint32_t capacity,uint32_t *count,uint32_t *error) {
  NativePipe *pipe=opaque;
  DWORD transferred=0;
  *count=0;
  if (pipe->closing) { *error=ERROR_OPERATION_ABORTED; return -1; }
  if (!pipe->read.pending) {
    prepare_io(&pipe->read);
    if (!ReadFile(pipe->file,pipe->input,sizeof(pipe->input),NULL,&pipe->read.overlap)) {
      DWORD code=GetLastError();
      if (code==ERROR_BROKEN_PIPE || code==ERROR_PIPE_NOT_CONNECTED) return 2;
      if (code!=ERROR_IO_PENDING) { *error=code; return -1; }
    }
    pipe->read.pending=1;
  }
  int result=completed(pipe,&pipe->read,&transferred,error);
  if (result<0 && (*error==ERROR_BROKEN_PIPE || *error==ERROR_PIPE_NOT_CONNECTED)) return 2;
  if (result<=0) return result;
  if (!transferred) return 2;
  if (transferred>capacity) { *error=ERROR_INSUFFICIENT_BUFFER; return -1; }
  memcpy(buffer,pipe->input,transferred); *count=transferred; return 1;
}
int xplat_pipe_write(void *opaque,const void *buffer,size_t length,uint32_t *count,uint32_t *error) {
  NativePipe *pipe=opaque;
  DWORD transferred=0;
  *count=0;
  if (pipe->closing) { *error=ERROR_OPERATION_ABORTED; return -1; }
  if (!pipe->write.pending) {
    pipe->writing=(DWORD)(length<sizeof(pipe->output)?length:sizeof(pipe->output));
    memcpy(pipe->output,buffer,pipe->writing);
    prepare_io(&pipe->write);
    if (!WriteFile(pipe->file,pipe->output,pipe->writing,NULL,&pipe->write.overlap) && GetLastError()!=ERROR_IO_PENDING) {
      *error=GetLastError(); return -1;
    }
    pipe->write.pending=1;
  }
  int result=completed(pipe,&pipe->write,&transferred,error);
  if (result<=0) return result;
  if (!transferred || transferred>pipe->writing) { *error=ERROR_WRITE_FAULT; return -1; }
  *count=transferred; return 1;
}
int xplat_pipe_close(void *opaque) {
  NativePipe *pipe=opaque;
  DWORD count=0;
  uint32_t error=0;
  if (!pipe) return 1;
  if (!pipe->closing) {
    pipe->closing=1;
    CancelIoEx(pipe->file,NULL);
  }
  int pending=0;
  if (pipe->connect.pending && completed(pipe,&pipe->connect,&count,&error)==0) pending=1;
  if (pipe->read.pending && completed(pipe,&pipe->read,&count,&error)==0) pending=1;
  if (pipe->write.pending && completed(pipe,&pipe->write,&count,&error)==0) pending=1;
  if (pending) return 0;
  /* No DisconnectNamedPipe/FlushFileBuffers: caller bounds the peer's response
   * consumption asynchronously. Closing here must never block on that peer. */
  release_pipe(pipe); return 1;
}
int xplat_pipe_server_close(void *opaque) {
  PipeServer *server=opaque;
  if (!server) return 1;
  if (!xplat_pipe_close(server->pending)) return 0;
  xplat_private_security_free(server->security); free(server->name); free(server); return 1;
}
