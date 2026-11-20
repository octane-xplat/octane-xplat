using System;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Threading;

namespace OctaneXplat.Desktop
{
    public static class DesktopTrash
    {
        private static readonly ConcurrentDictionary<string, TrashRequest> requests = new();

        private sealed class TrashRequest
        {
            public volatile string Result = "pending";
        }

        public static string IsSupported() => "yes";

        public static string Start(string path)
        {
            var id = Guid.NewGuid().ToString("N");
            var request = new TrashRequest();
            requests[id] = request;
            var worker = new Thread(() =>
            {
                try
                {
                    request.Result = Recycle(path) ? "recycled" : "failed";
                }
                catch
                {
                    request.Result = "failed";
                }
            }) { IsBackground = true };

            try
            {
                worker.SetApartmentState(ApartmentState.STA);
                worker.Start();
            }
            catch
            {
                requests.TryRemove(id, out _);
                throw;
            }
            return id;
        }

        public static string Poll(string id)
        {
            if (!requests.TryGetValue(id, out var request)) return "failed";
            var result = request.Result;
            if (result != "pending") requests.TryRemove(id, out _);
            return result;
        }

        private static bool Recycle(string path)
        {
            const uint silent = 0x0004;
            const uint noErrorUi = 0x0400;
            const uint warnBeforePermanentDeletion = 0x4000;
            const uint recycleOnDelete = 0x00080000;
            const uint earlyFailure = 0x00100000;

            var clsid = new Guid("3AD05575-8857-4850-9277-11B85BDB8E09");
            var shellItemId = new Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE");
            var operation = (IFileOperation)Activator.CreateInstance(Type.GetTypeFromCLSID(clsid));
            try
            {
                Marshal.ThrowExceptionForHR(SHCreateItemFromParsingName(path, IntPtr.Zero, ref shellItemId, out var item));
                try
                {
                    var sink = new RecycleSink();
                    operation.SetOperationFlags(silent | noErrorUi | warnBeforePermanentDeletion | recycleOnDelete | earlyFailure);
                    operation.DeleteItem(item, sink);
                    operation.PerformOperations();
                    operation.GetAnyOperationsAborted(out var aborted);
                    return !aborted && sink.Recycled;
                }
                finally
                {
                    Marshal.Release(item);
                }
            }
            finally
            {
                Marshal.ReleaseComObject(operation);
            }
        }

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int SHCreateItemFromParsingName(
            string path, IntPtr bindContext, ref Guid interfaceId, out IntPtr item);

        [ComImport, Guid("947AAB5F-0A5C-4C13-B4D6-4BF7836FC9F8")]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IFileOperation
        {
            void Advise(IntPtr sink, out uint cookie);
            void Unadvise(uint cookie);
            void SetOperationFlags(uint flags);
            void SetProgressMessage(IntPtr message);
            void SetProgressDialog(IntPtr dialog);
            void SetProperties(IntPtr properties);
            void SetOwnerWindow(IntPtr owner);
            void ApplyPropertiesToItem(IntPtr item);
            void ApplyPropertiesToItems(IntPtr items);
            void RenameItem(IntPtr item, IntPtr name, IntPtr sink);
            void RenameItems(IntPtr items, IntPtr name);
            void MoveItem(IntPtr item, IntPtr destination, IntPtr name, IntPtr sink);
            void MoveItems(IntPtr items, IntPtr destination);
            void CopyItem(IntPtr item, IntPtr destination, IntPtr name, IntPtr sink);
            void CopyItems(IntPtr items, IntPtr destination);
            void DeleteItem(IntPtr item, [MarshalAs(UnmanagedType.Interface)] IFileOperationProgressSink sink);
            void DeleteItems(IntPtr items);
            void NewItem(IntPtr destination, uint attributes, IntPtr name, IntPtr template, IntPtr sink);
            void PerformOperations();
            void GetAnyOperationsAborted([MarshalAs(UnmanagedType.Bool)] out bool aborted);
        }

        [ComVisible(true), Guid("04B0F1A7-9490-44BC-96E1-4296A31252E2")]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IFileOperationProgressSink
        {
            [PreserveSig] int StartOperations();
            [PreserveSig] int FinishOperations(int result);
            [PreserveSig] int PreRenameItem(uint flags, IntPtr item, IntPtr name);
            [PreserveSig] int PostRenameItem(uint flags, IntPtr item, IntPtr name, int result, IntPtr created);
            [PreserveSig] int PreMoveItem(uint flags, IntPtr item, IntPtr destination, IntPtr name);
            [PreserveSig] int PostMoveItem(uint flags, IntPtr item, IntPtr destination, IntPtr name, int result, IntPtr created);
            [PreserveSig] int PreCopyItem(uint flags, IntPtr item, IntPtr destination, IntPtr name);
            [PreserveSig] int PostCopyItem(uint flags, IntPtr item, IntPtr destination, IntPtr name, int result, IntPtr created);
            [PreserveSig] int PreDeleteItem(uint flags, IntPtr item);
            [PreserveSig] int PostDeleteItem(uint flags, IntPtr item, int result, IntPtr created);
            [PreserveSig] int PreNewItem(uint flags, IntPtr destination, IntPtr name);
            [PreserveSig] int PostNewItem(uint flags, IntPtr destination, IntPtr name, IntPtr template, uint attributes, int result, IntPtr created);
            [PreserveSig] int UpdateProgress(uint total, uint done);
            [PreserveSig] int ResetTimer();
            [PreserveSig] int PauseTimer();
            [PreserveSig] int ResumeTimer();
        }

        [ComVisible(true), ClassInterface(ClassInterfaceType.None)]
        public sealed class RecycleSink : IFileOperationProgressSink
        {
            internal bool Recycled { get; private set; }

            public int PreDeleteItem(uint flags, IntPtr item)
            {
                const uint recycling = 0x0080; // TSF_DELETE_RECYCLE_IF_POSSIBLE
                const int abort = unchecked((int)0x80004004);
                // The Shell omits this flag when the destination cannot recycle the item.
                return (flags & recycling) != 0 ? 0 : abort;
            }

            public int PostDeleteItem(uint flags, IntPtr item, int result, IntPtr created)
            {
                Recycled = result >= 0 && created != IntPtr.Zero;
                return 0;
            }

            public int StartOperations() => 0;
            public int FinishOperations(int result) => 0;
            public int PreRenameItem(uint flags, IntPtr item, IntPtr name) => 0;
            public int PostRenameItem(uint flags, IntPtr item, IntPtr name, int result, IntPtr created) => 0;
            public int PreMoveItem(uint flags, IntPtr item, IntPtr destination, IntPtr name) => 0;
            public int PostMoveItem(uint flags, IntPtr item, IntPtr destination, IntPtr name, int result, IntPtr created) => 0;
            public int PreCopyItem(uint flags, IntPtr item, IntPtr destination, IntPtr name) => 0;
            public int PostCopyItem(uint flags, IntPtr item, IntPtr destination, IntPtr name, int result, IntPtr created) => 0;
            public int PreNewItem(uint flags, IntPtr destination, IntPtr name) => 0;
            public int PostNewItem(uint flags, IntPtr destination, IntPtr name, IntPtr template, uint attributes, int result, IntPtr created) => 0;
            public int UpdateProgress(uint total, uint done) => 0;
            public int ResetTimer() => 0;
            public int PauseTimer() => 0;
            public int ResumeTimer() => 0;
        }
    }
}
