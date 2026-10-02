using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Reflection;
using System.Security;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;
using Windows.Data.Xml.Dom;
using Windows.Security.Credentials;
using Windows.UI.Notifications;

namespace OctaneXplat.DesktopWebView;

sealed record WindowRequest(
	string? Url,
	JsonNode? Data,
	string Kind,
	string? Title,
	int Width,
	int Height);

sealed class Endpoint : IDisposable
{
	readonly Form window;
	readonly WebView2 view = new() { Dock = DockStyle.Fill };
	readonly HostBridge bridge;
	readonly bool primary;
	string? pendingInitialUrl;

	public Endpoint(HostBridge bridge, Form window, bool primary)
	{
		this.bridge = bridge;
		this.window = window;
		this.primary = primary;
		window.Controls.Add(view);
	}

	public Form Window => window;
	public WebView2 View => view;
	public bool IsPrimary => primary;

	public string? ConsumeInitialUrl()
	{
		var value = pendingInitialUrl;
		pendingInitialUrl = null;
		return value;
	}

	public async Task InitializeAsync(string? url, JsonNode? windowData, string? windowId)
	{
		await view.EnsureCoreWebView2Async().ConfigureAwait(true);
		var core = view.CoreWebView2;
		bridge.Register(this);
		if (bridge.BundleDirectory is not null)
		{
			core.SetVirtualHostNameToFolderMapping(
				"xplat.app",
				bridge.BundleDirectory,
				CoreWebView2HostResourceAccessKind.Allow);
		}

		pendingInitialUrl = primary ? bridge.ConsumeInitialUrl() : null;
		await core.AddScriptToExecuteOnDocumentCreatedAsync(
			TransportScript() + BootstrapScript(windowData, windowId)).ConfigureAwait(true);
		core.WebMessageReceived += (_, eventArgs) =>
		{
			try
			{
				_ = bridge.ReceiveAsync(this, eventArgs.TryGetWebMessageAsString());
			}
			catch (Exception error)
			{
				Console.Error.WriteLine($"[host] web message failed: {error.Message}");
			}
		};
		window.Activated += (_, _) => bridge.EmitAppState();
		window.Deactivate += (_, _) => bridge.EmitAppState();
		window.Resize += (_, _) => bridge.EmitWindowSize(this);
		core.NavigationCompleted += (_, eventArgs) =>
		{
			if (!eventArgs.IsSuccess) return;
			bridge.NavigationCompleted(this);
		};

		view.Source = new Uri(bridge.ResolveUrl(url), UriKind.Absolute);
	}

	async Task Deliver(string message)
	{
		if (view.CoreWebView2 is null) return;
		await view.ExecuteScriptAsync(
			$"window.__xplatHostTransport?.receive({JsonSerializer.Serialize(message)})");
	}

	public Task Reply(JsonObject packet) => Deliver(JsonSerializer.Serialize(packet));

	public Task Emit(string name, JsonNode? payload) =>
		Deliver(JsonSerializer.Serialize(new JsonObject
		{
			["type"] = "event",
			["name"] = name,
			["payload"] = payload?.DeepClone(),
		}));

	string BootstrapScript(JsonNode? windowData, string? windowId)
	{
		var snapshot = new JsonObject
		{
			["appInfo"] = bridge.AppInfo(),
			["appState"] = bridge.AppState(window),
			["windowSize"] = bridge.WindowSize(window),
			["initialUrl"] = pendingInitialUrl,
			["colorScheme"] = bridge.ColorScheme(),
		};
		var serialized = JsonSerializer.Serialize(snapshot);
		var context = windowId is null
			? string.Empty
			: $"window.__xplatWindowId={JsonSerializer.Serialize(windowId)};window.__xplatWindowData={JsonSerializer.Serialize(windowData)}";
		return $"window.__xplatHostSnapshot={serialized};window.__xplatInitialUrl=window.__xplatHostSnapshot.initialUrl;window.__xplatColorScheme=window.__xplatHostSnapshot.colorScheme;{context}";
	}

	static string TransportScript() => """
	(() => {
		const listeners = new Set();
		const pending = new Map();
		let id = 0;
		const transport = {
			receive(message) {
				const packet = JSON.parse(message);
				if (packet.type === 'reply') {
					const task = pending.get(packet.id);
					if (task) {
						pending.delete(packet.id);
						if (packet.ok) task.resolve(packet.value); else task.reject(new Error(packet.error));
					} else if (window.__xplatBridge) {
						if (packet.ok) window.__xplatBridge.resolve(packet.id, packet.value);
						else window.__xplatBridge.reject(packet.id, packet.error);
					}
					return;
				}
				for (const listener of listeners) listener(message);
			},
			listen(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		};
		const post = (message) => window.chrome.webview.postMessage(message);
		window.webkit = {
			messageHandlers: {
				xplat: { postMessage: post },
				xplatLog: { postMessage: (message) => post(JSON.stringify({ service: '__log', method: 'log', args: [message] })) }
			}
		};
		Object.defineProperty(window, '__xplatHostTransport', { value: transport, configurable: false });
		window.__xplatBridge = {
			resolve() {}, reject() {},
			emit(service, event, payload) {
				window.dispatchEvent(new CustomEvent(`xplat:${service}.${event}`, { detail: payload }));
			},
			call(service, method, args = []) {
				return new Promise((resolve, reject) => {
					const request = ++id;
					pending.set(request, { resolve, reject });
					post(JSON.stringify({ type: 'call', id: request, service, method, args }));
				});
			},
			on(service, event, listener) {
				const name = (service === 'deep-links' || service === 'deepLinks') && event === 'open'
					? 'app.deep-link'
					: `${service}.${event}`;
				return transport.listen((message) => {
					const packet = JSON.parse(message);
					if (packet.type === 'event' && packet.name === name) listener(packet.payload);
				});
			},
			capabilities() {
				return new Promise((resolve, reject) => {
					const request = ++id;
					pending.set(request, { resolve, reject });
					post(JSON.stringify({ type: 'capabilities', id: request }));
				});
			}
		};
	})();
	""";

	public void Dispose()
	{
		bridge.Unregister(this);
		view.Dispose();
	}
}

sealed class HostWindow : Form
{
	public HostWindow(HostBridge bridge)
	{
		Text = bridge.ProductName;
		ClientSize = new Size(1024, 768);
		var endpoint = new Endpoint(bridge, this, primary: true);
		Shown += async (_, _) => await endpoint.InitializeAsync(null, null, null);
	}
}

sealed class SecondaryWindow : Form
{
	readonly Endpoint endpoint;

	public SecondaryWindow(HostBridge bridge, Endpoint opener, string id, WindowRequest request)
	{
		Text = request.Title ?? bridge.ProductName;
		ClientSize = new Size(Math.Max(1, request.Width), Math.Max(1, request.Height));
		endpoint = new Endpoint(bridge, this, primary: false);
		Shown += async (_, _) => await endpoint.InitializeAsync(request.Url, request.Data, id);
		FormClosed += (_, _) =>
		{
			bridge.SecondaryClosed(id);
			endpoint.Dispose();
			_ = opener.Emit("windows.closed", id);
		};
	}
}

sealed class HostBridge : IDisposable
{
	readonly ConcurrentDictionary<Endpoint, bool> endpoints = new();
	readonly ConcurrentDictionary<string, SecondaryWindow> secondary = new();
	readonly string storageDirectory;
	readonly string storagePath;
	readonly string pipeName;
	readonly Mutex singleInstance;
	readonly CancellationTokenSource pipeCancel = new();
	SynchronizationContext? uiContext;
	string? pendingInitialUrl;
	bool colorScheme;
	Task? pipeTask;

	public HostBridge(string appId, string productName, string? baseUrl, string? bundleDirectory, bool selfTest, string? selfTestScript)
	{
		AppId = appId;
		ProductName = productName;
		BaseUrl = baseUrl;
		BundleDirectory = bundleDirectory is null ? null : Path.GetFullPath(bundleDirectory);
		SelfTest = selfTest;
		SelfTestScript = selfTestScript;
		pipeName = $"xplat-webview-{Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(appId)))[..16]}";
		singleInstance = new Mutex(true, $"Local\\{pipeName}", out _);
		storageDirectory = Path.Combine(
			Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
			AppId);
		storagePath = Path.Combine(storageDirectory, "storage.json");
		colorScheme = ReadColorScheme();
		SystemEvents.UserPreferenceChanged += (_, category) =>
		{
			if (category.Category == UserPreferenceCategory.General)
			{
				var next = ReadColorScheme();
				if (next != colorScheme)
				{
					colorScheme = next;
					EmitAll("appearance.change", ColorScheme());
				}
			}
		};
	}

	public string AppId { get; }
	public string ProductName { get; }
	public string? BaseUrl { get; }
	public string? BundleDirectory { get; }
	public bool SelfTest { get; }
	public string? SelfTestScript { get; }
	public int ExitCode { get; private set; }

	public bool TryClaimPrimaryInstance(string? url)
	{
		if (!singleInstance.WaitOne(0))
		{
			if (url is not null)
			{
				try
				{
					using var pipe = new NamedPipeClientStream(".", pipeName, PipeDirection.Out);
					pipe.Connect(2000);
					using var writer = new StreamWriter(pipe);
					writer.WriteLine(url);
				}
				catch { }
			}
			return false;
		}

		pendingInitialUrl = url;
		pipeTask = Task.Run(PipeLoopAsync);
		return true;
	}

	public void Register(Endpoint endpoint)
	{
		uiContext ??= SynchronizationContext.Current;
		endpoints[endpoint] = true;
	}

	public void Unregister(Endpoint endpoint) => endpoints.TryRemove(endpoint, out _);

	public JsonObject AppInfo()
	{
		var assembly = Assembly.GetEntryAssembly()?.GetName();
		return new JsonObject
		{
			["supported"] = true,
			["version"] = assembly?.Version?.ToString(),
			["build"] = assembly?.Version?.ToString(),
			["bundleId"] = AppId,
		};
	}

	public string AppState(Form? window = null) =>
		window is null ? (Form.ActiveForm is null ? "inactive" : "active") :
			Form.ActiveForm == window ? "active" : "inactive";

	public JsonObject WindowSize(Form window)
	{
		var size = window.ClientSize;
		return new JsonObject
		{
			["width"] = size.Width,
			["height"] = size.Height,
			["orientation"] = size.Width >= size.Height ? "landscape" : "portrait",
		};
	}

	public string ColorScheme() => colorScheme ? "light" : "dark";

	public string? ConsumeInitialUrl()
	{
		var url = pendingInitialUrl;
		pendingInitialUrl = null;
		return url;
	}

	public string ResolveUrl(string? requested)
	{
		var raw = requested ?? "/";
		if (raw.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
			raw.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
		{
			return raw;
		}

		var path = raw.StartsWith("xplat://app", StringComparison.OrdinalIgnoreCase)
			? raw["xplat://app".Length..]
			: raw;
		if (!path.StartsWith('/')) path = "/" + path;
		return BaseUrl is not null
			? BaseUrl.TrimEnd('/') + path
			: "https://xplat.app" + path;
	}

	public void EmitAppState() => EmitAll("app.state.change", AppState());
	public void EmitWindowSize(Endpoint endpoint) =>
		_ = endpoint.Emit("window.resize", WindowSize(endpoint.Window));

	public void NavigationCompleted(Endpoint endpoint)
	{
		if (!endpoint.IsPrimary || !SelfTest || SelfTestScript is null || !File.Exists(SelfTestScript)) return;
		_ = RunSelfTest(endpoint);
	}

	async Task RunSelfTest(Endpoint endpoint)
	{
		await endpoint.View.ExecuteScriptAsync(await File.ReadAllTextAsync(SelfTestScript!));
		await Task.Delay(1500);
		EmitAll("app.deep-link", "xplat://self-test/deep-link");
	}

	public void EmitAll(string name, JsonNode? payload)
	{
		void send()
		{
			foreach (var endpoint in endpoints.Keys)
			{
				_ = endpoint.Emit(name, payload);
			}
		}

		if (uiContext is not null && SynchronizationContext.Current != uiContext)
		{
			uiContext.Post(_ => send(), null);
		}
		else
		{
			send();
		}
	}

	public async Task ReceiveAsync(Endpoint endpoint, string raw)
	{
		using var document = JsonDocument.Parse(raw);
		var request = document.RootElement;
		if (request.TryGetProperty("service", out var service) && service.GetString() == "__log")
		{
			var message = request.GetProperty("args")[0].GetString() ?? string.Empty;
			Console.WriteLine($"[webview] {message}");
			if (message.StartsWith("SELFTEST_RESULT ", StringComparison.Ordinal))
			{
				var result = JsonSerializer.Deserialize<JsonObject>(message[16..]);
				ExitCode = result?["failed"]?.AsArray().Count == 0 ? 0 : 1;
				Application.Exit();
			}
			return;
		}

		var id = request.GetProperty("id").GetInt32();
		if (request.TryGetProperty("type", out var type) && type.GetString() == "capabilities")
		{
			await endpoint.Reply(new JsonObject
			{
				["type"] = "reply",
				["id"] = id,
				["ok"] = true,
				["value"] = JsonSerializer.SerializeToNode(Capabilities()),
			});
			return;
		}

		var serviceName = request.GetProperty("service").GetString() ?? string.Empty;
		var method = request.GetProperty("method").GetString() ?? string.Empty;
		var args = request.TryGetProperty("args", out var rawArgs) && rawArgs.ValueKind == JsonValueKind.Array
			? rawArgs
			: default;

		try
		{
			var value = await Dispatch(endpoint, serviceName, method, args);
			await endpoint.Reply(new JsonObject
			{
				["type"] = "reply",
				["id"] = id,
				["ok"] = true,
				["value"] = value,
			});
		}
		catch (Exception error)
		{
			await endpoint.Reply(new JsonObject
			{
				["type"] = "reply",
				["id"] = id,
				["ok"] = false,
				["error"] = error.Message,
			});
		}
	}

	static JsonObject Capabilities() => new()
	{
		["app"] = JsonSerializer.SerializeToNode(new[] { "getInfo", "getState", "getWindowSize", "consumeInitialUrl" }),
		["clipboard"] = JsonSerializer.SerializeToNode(new[] { "read", "write" }),
		["files"] = JsonSerializer.SerializeToNode(new[] { "pick", "readText", "writeText" }),
		["notifications"] = JsonSerializer.SerializeToNode(new[] { "ensure", "notify" }),
		["secureStorage"] = JsonSerializer.SerializeToNode(new[] { "get", "set", "remove" }),
		["appearance"] = JsonSerializer.SerializeToNode(new[] { "get" }),
		["windows"] = JsonSerializer.SerializeToNode(new[] { "open", "close", "setTitle" }),
		["system"] = JsonSerializer.SerializeToNode(new[] { "openUrl", "openPath", "shareContent" }),
		["storage"] = JsonSerializer.SerializeToNode(new[] { "get", "set", "remove" }),
	};

	async Task<JsonNode?> Dispatch(Endpoint endpoint, string service, string method, JsonElement args)
	{
		string? Arg(int index)
		{
			if (args.ValueKind != JsonValueKind.Array || args.GetArrayLength() <= index) return null;
			var value = args[index];
			return value.ValueKind == JsonValueKind.Null ? null : value.GetString();
		}
		JsonElement? ArgObject(int index)
		{
			if (args.ValueKind != JsonValueKind.Array || args.GetArrayLength() <= index) return null;
			var value = args[index];
			return value.ValueKind == JsonValueKind.Object ? value.Clone() : null;
		}

		switch (service)
		{
			case "app":
				return method switch
				{
					"getInfo" => AppInfo(),
					"getState" => AppState(endpoint.Window),
					"getWindowSize" => WindowSize(endpoint.Window),
					"consumeInitialUrl" => endpoint.IsPrimary ? endpoint.ConsumeInitialUrl() : null,
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "clipboard":
				return method switch
				{
					"read" => Clipboard.ContainsText() ? Clipboard.GetText() : null,
					"write" => SetClipboard(Arg(0) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "files":
				return method switch
				{
					"pick" => PickFile(endpoint.Window, Arg(0) ?? "*/*", ArgObject(1)),
					"readText" => ReadFileText(Arg(0) ?? string.Empty),
					"writeText" => WriteFileText(endpoint.Window, Arg(0) ?? "untitled.txt", Arg(1) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "notifications":
				return method switch
				{
					"ensure" => NotificationPermission(),
					"notify" => Notify(Arg(0) ?? string.Empty, Arg(1) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "secureStorage":
				return method switch
				{
					"get" => SecureGet(Arg(0) ?? string.Empty),
					"set" => SecureSet(Arg(0) ?? string.Empty, Arg(1) ?? string.Empty),
					"remove" => SecureRemove(Arg(0) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "appearance":
				if (method == "get") return ColorScheme();
				break;
			case "windows":
				return method switch
				{
					"open" => await OpenSecondary(endpoint, ArgObject(0)),
					"close" => CloseSecondary(Arg(0) ?? string.Empty),
					"setTitle" => SetSecondaryTitle(Arg(0) ?? string.Empty, Arg(1) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "system":
				return method switch
				{
					"openUrl" => OpenPath(Arg(0) ?? string.Empty),
					"openPath" => OpenPath(Arg(0) ?? string.Empty),
					"shareContent" => ShareContent(ArgObject(0)),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
			case "storage":
				return method switch
				{
					"get" => StorageGet(Arg(0) ?? string.Empty),
					"set" => StorageSet(Arg(0) ?? string.Empty, Arg(1) ?? string.Empty),
					"remove" => StorageRemove(Arg(0) ?? string.Empty),
					_ => throw new InvalidOperationException($"host has no {service}.{method}"),
				};
		}
		throw new InvalidOperationException($"host has no {service}.{method}");
	}

	static bool SetClipboard(string value)
	{
		Clipboard.SetText(value);
		return true;
	}

	static JsonObject? FileRef(string path) => new()
	{
		["name"] = Path.GetFileName(path),
		["uri"] = new Uri(path).AbsoluteUri,
	};

	static JsonNode? PickFile(IWin32Window owner, string accept, JsonElement? options)
	{
		using var dialog = new OpenFileDialog { CheckFileExists = true, Multiselect = false };
		dialog.Filter = accept == "*/*" ? "All files (*.*)|*.*" : $"Files ({accept})|{accept}";
		if (options?.TryGetProperty("startingFolder", out var folder) == true)
		{
			dialog.InitialDirectory = folder.GetString();
		}
		return dialog.ShowDialog(owner) == DialogResult.OK ? FileRef(dialog.FileName) : null;
	}

	static JsonNode? ReadFileText(string uri)
	{
		try
		{
			var path = Uri.TryCreate(uri, UriKind.Absolute, out var parsed) && parsed.IsFile
				? parsed.LocalPath
				: uri;
			return JsonValue.Create(File.ReadAllText(path));
		}
		catch
		{
			return null;
		}
	}

	static JsonNode? WriteFileText(IWin32Window owner, string name, string text)
	{
		using var dialog = new SaveFileDialog { FileName = name };
		if (dialog.ShowDialog(owner) != DialogResult.OK) return null;
		File.WriteAllText(dialog.FileName, text);
		return FileRef(dialog.FileName);
	}

	ToastNotifier CreateToastNotifier()
	{
		try { return ToastNotificationManager.CreateToastNotifier(); }
		catch { return ToastNotificationManager.CreateToastNotifier(AppId); }
	}

	string NotificationPermission()
	{
		try
		{
			_ = CreateToastNotifier();
			return "granted";
		}
		catch
		{
			return "unsupported";
		}
	}

	bool Notify(string title, string body)
	{
		try
		{
			var document = new XmlDocument();
			document.LoadXml($"""
			<toast><visual><binding template="ToastGeneric"><text>{SecurityElement.Escape(title)}</text><text>{SecurityElement.Escape(body)}</text></binding></visual></toast>
			""");
			CreateToastNotifier().Show(new ToastNotification(document));
			return true;
		}
		catch
		{
			return false;
		}
	}

	string? SecureGet(string key)
	{
		try { return new PasswordVault().Retrieve(AppId, key).Password; }
		catch { return null; }
	}

	bool SecureSet(string key, string value)
	{
		try
		{
			var vault = new PasswordVault();
			try { vault.Remove(vault.Retrieve(AppId, key)); } catch {}
			vault.Add(new PasswordCredential(AppId, key, value));
			return true;
		}
		catch { return false; }
	}

	bool SecureRemove(string key)
	{
		try
		{
			var vault = new PasswordVault();
			vault.Remove(vault.Retrieve(AppId, key));
			return true;
		}
		catch { return true; }
	}

	JsonObject ReadStorage()
	{
		try
		{
			return JsonSerializer.Deserialize<JsonObject>(File.ReadAllText(storagePath)) ?? new JsonObject();
		}
		catch { return new JsonObject(); }
	}

	void WriteStorage(JsonObject values)
	{
		Directory.CreateDirectory(storageDirectory);
		File.WriteAllText(storagePath, JsonSerializer.Serialize(values));
	}

	JsonNode? StorageGet(string key) => ReadStorage()[key]?.DeepClone();

	JsonNode? StorageSet(string key, string value)
	{
		var values = ReadStorage();
		values[key] = value;
		WriteStorage(values);
		return null;
	}

	JsonNode? StorageRemove(string key)
	{
		var values = ReadStorage();
		values.Remove(key);
		WriteStorage(values);
		return null;
	}

	async Task<JsonNode> OpenSecondary(Endpoint opener, JsonElement? options)
	{
		var id = options?.TryGetProperty("id", out var rawId) == true
			? rawId.GetString() ?? $"w{secondary.Count + 1}"
			: $"w{secondary.Count + 1}";
		var request = new WindowRequest(
			options?.TryGetProperty("url", out var url) == true ? url.GetString() : null,
			options?.TryGetProperty("data", out var data) == true ? JsonNode.Parse(data.GetRawText()) : null,
			options?.TryGetProperty("kind", out var kind) == true ? kind.GetString() ?? "regular" : "regular",
			options?.TryGetProperty("title", out var title) == true ? title.GetString() : null,
			options?.TryGetProperty("size", out var size) == true && size.TryGetProperty("width", out var width) ? width.GetInt32() : 640,
			options?.TryGetProperty("size", out var size2) == true && size2.TryGetProperty("height", out var height) ? height.GetInt32() : 480);
		if (secondary.ContainsKey(id)) throw new InvalidOperationException($"window already exists: {id}");
		var window = new SecondaryWindow(this, opener, id, request);
		secondary[id] = window;
		if (request.Kind == "dialog")
		{
			window.StartPosition = FormStartPosition.CenterParent;
			window.Show(opener.Window);
		}
		else
		{
			window.Show();
		}
		await Task.CompletedTask;
		return JsonValue.Create(id)!;
	}

	internal void SecondaryClosed(string id) => secondary.TryRemove(id, out _);

	bool CloseSecondary(string id)
	{
		if (!secondary.TryRemove(id, out var window)) return false;
		window.Close();
		return true;
	}

	bool SetSecondaryTitle(string id, string title)
	{
		if (!secondary.TryGetValue(id, out var window)) return false;
		window.Text = title;
		return true;
	}

	JsonNode ShareContent(JsonElement? input)
	{
		var text = input?.TryGetProperty("text", out var rawText) == true ? rawText.GetString() : null;
		var url = input?.TryGetProperty("url", out var rawUrl) == true ? rawUrl.GetString() : null;
		var title = input?.TryGetProperty("title", out var rawTitle) == true ? rawTitle.GetString() : null;
		var content = string.Join("\n", new[] { title, text, url }.Where(value => !string.IsNullOrEmpty(value)));
		if (content.Length == 0) return JsonValue.Create("unavailable");
		SetClipboard(content);
		return JsonValue.Create("copied");
	}

	static bool OpenPath(string target)
	{
		try
		{
			Process.Start(new ProcessStartInfo { FileName = target, UseShellExecute = true });
			return true;
		}
		catch { return false; }
	}

	static bool ReadColorScheme()
	{
		var value = Registry.GetValue(
			@"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
			"AppsUseLightTheme",
			1);
		return value is int light && light != 0;
	}

	async Task PipeLoopAsync()
	{
		while (!pipeCancel.IsCancellationRequested)
		{
			try
			{
				using var server = new NamedPipeServerStream(pipeName, PipeDirection.In, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
				await server.WaitForConnectionAsync(pipeCancel.Token);
				using var reader = new StreamReader(server);
				var url = await reader.ReadLineAsync(pipeCancel.Token);
				if (url is not null) EmitAll("app.deep-link", JsonValue.Create(url));
			}
			catch (OperationCanceledException) when (pipeCancel.IsCancellationRequested)
			{
				break;
			}
			catch (Exception error)
			{
				Console.Error.WriteLine($"[host] deep-link pipe failed: {error.Message}");
				await Task.Delay(500, pipeCancel.Token).ConfigureAwait(false);
			}
		}
	}

	public void Dispose()
	{
		pipeCancel.Cancel();
		singleInstance.Dispose();
	}
}
