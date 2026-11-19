using System;
using System.Collections.Concurrent;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AppLifecycle;
using Windows.ApplicationModel.Activation;

namespace OctaneXplat.Desktop
{
    public static class DesktopSingleInstance
    {
        private const string InstanceKey = "OctaneXplat.Desktop.Primary";
        private static readonly ConcurrentQueue<string> launches = new();
        private static AppInstance primary;
        private static bool redirected;

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)]
        private static extern IntPtr CommandLineToArgvW(string commandLine, out int count);

        [DllImport("kernel32.dll", ExactSpelling = true)]
        private static extern IntPtr LocalFree(IntPtr memory);

        public static string IsSupported() => "yes";

        public static string Acquire()
        {
            if (primary != null) return "primary";
            if (redirected) return "redirected";

            var dispatcher = DispatcherQueue.GetForCurrentThread();
            if (dispatcher == null)
                throw new InvalidOperationException("Claim the desktop instance from the Windows startup thread");

            var current = AppInstance.GetCurrent();
            current.Activated += OnActivated;
            try
            {
                var owner = AppInstance.FindOrRegisterForKey(InstanceKey);
                if (owner.IsCurrent)
                {
                    primary = current;
                    return "primary";
                }

                var activation = current.GetActivatedEventArgs();
                if (activation?.Kind != ExtendedActivationKind.Launch)
                    throw new InvalidOperationException("This Windows bridge can only redirect Launch activations");

                // Use an MTA worker for the redirect so the activation operation does not
                // need a continuation on the second process's startup thread.
                Task.Run(async () => await owner.RedirectActivationToAsync(activation)).GetAwaiter().GetResult();
                redirected = true;
                if (!dispatcher.TryEnqueue(() => Application.Current.Exit()))
                    throw new InvalidOperationException("Windows could not exit the redirected process");
                return "redirected";
            }
            finally
            {
                if (primary == null) current.Activated -= OnActivated;
            }
        }

        private static void OnActivated(object sender, AppActivationArguments activation)
        {
            // AppLifecycle invokes this callback off the JavaScript/UI thread.
            if (activation.Kind == ExtendedActivationKind.Launch && activation.Data is ILaunchActivatedEventArgs launch)
                launches.Enqueue(JsonSerializer.Serialize(ParseArguments(launch.Arguments)));
        }

        public static string Poll() => launches.TryDequeue(out var launch) ? launch : "null";

        private static string[] ParseArguments(string arguments)
        {
            if (string.IsNullOrEmpty(arguments)) return Array.Empty<string>();

            // SDK-synthesized activations include the process command line.
            // Native Launch activations can contain only the arguments.
            var parsed = CommandLineToArgvW("app.exe " + arguments, out var count);
            if (parsed == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
            try
            {
                var first = 1;
                if (count > 1 && StringComparer.OrdinalIgnoreCase.Equals(Environment.ProcessPath,
                    Marshal.PtrToStringUni(Marshal.ReadIntPtr(parsed, IntPtr.Size))))
                    first++;

                var values = new string[count - first];
                for (var index = first; index < count; index++)
                    values[index - first] = Marshal.PtrToStringUni(Marshal.ReadIntPtr(parsed, index * IntPtr.Size));
                return values;
            }
            finally
            {
                LocalFree(parsed);
            }
        }
    }
}
