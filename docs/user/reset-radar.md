# Reset Radar

The Radar fork has a read-only Reset Radar control in the thread's top bar beside Add action. Open it to enable the feature or use Settings → Integrations → Reset Radar. It defaults off and saves its configuration on this device.

Start the independent Reset Radar service on this computer, then enter its local URL, such as `http://127.0.0.1:3100`. The service's own README explains its launch and database options. Closing T3 does not stop that service. Connecting to a remote T3 environment does not move the Radar service to that host.

This first version displays synthetic examples only. Automatic resets, banked benefits, and uncertain reports remain separate. Unknown timing has no countdown, and estimates that pass without confirmation show Awaiting confirmation. Source evidence and fixture freshness appear separately from unavailable account usage. Saved fixtures become stale instead of pretending a live source was checked.

No live source monitoring, phone notification, reset redemption, or agent execution is available. If Radar disconnects or returns an incompatible API, the control reports the failure and the rest of T3 remains usable. Turn the feature off to stop its API requests.
