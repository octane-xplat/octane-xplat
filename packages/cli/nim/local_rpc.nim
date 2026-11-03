## Platform boundary for the shared bounded one-request RPC contract.
when defined(windows):
  import ./rpc_windows
  export rpc_windows
else:
  import ./unix_rpc
  export unix_rpc
