using OctaneXplat.DesktopWebView;

public static class Program
{
	static string? Option(string[] args, string name)
	{
		for (var i = 0; i < args.Length - 1; i++)
		{
			if (args[i] == name) return args[i + 1];
		}
		return null;
	}

	[STAThread]
	public static int Main(string[] args)
	{
		var appId = Option(args, "--app-id") ?? "org.octane.xplat.webview";
		var productName = Option(args, "--name") ?? "Octane xplat";
		var url = Option(args, "--url");
		var bundle = Option(args, "--bundle");
		var selfTest = args.Contains("--self-test");
		var selfTestScript = Option(args, "--self-test-script")
			?? Path.Combine(AppContext.BaseDirectory, "bridge-selftest.linux.js");
		var initialUrl = args.Where((value, index) =>
			value.Contains("://", StringComparison.Ordinal) &&
			!value.StartsWith("--", StringComparison.Ordinal) &&
			(index == 0 || args[index - 1] != "--url")).FirstOrDefault();

		using var bridge = new HostBridge(appId, productName, url, bundle, selfTest, selfTestScript);
		if (!bridge.TryClaimPrimaryInstance(initialUrl))
		{
			return 0;
		}

		ApplicationConfiguration.Initialize();
		Application.Run(new HostWindow(bridge));
		return bridge.ExitCode;
	}
}
