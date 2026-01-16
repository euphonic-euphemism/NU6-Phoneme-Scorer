Graphics runtime options and troubleshooting
========================================

This file documents how the app chooses GPU/GL behavior and provides quick commands
you can use to test or force software rendering.

Environment variables
- `NU6_GPU=off` or `NU6_FORCE_SOFTWARE=1` — Force software GL (disables hardware acceleration).
- `NU6_WAYLAND=1` — Prefer Wayland/Ozone platform (passes `--ozone-platform=wayland`).

Useful commands
- Run with software Mesa (temporary, no code changes):
```bash
LIBGL_ALWAYS_SOFTWARE=1 npm start
```
- Force the app to disable GPU via env var:
```bash
NU6_GPU=off npm start
```
- Prefer Wayland/Ozone backend (if on Wayland session):
```bash
NU6_WAYLAND=1 npm start
```

Notes and recommendations
- Default behavior: on Linux, X11 sessions will disable hardware acceleration by default
  (this avoids many driver-related GL/GTK issues). Wayland sessions will prefer Ozone/Wayland.
- For shipping a stable build across many Linux distros, keeping a software fallback or
  detecting problematic environments at runtime is advised.
- For best performance, encourage users to run on Wayland or update their GPU/Mesa drivers.

If you want a user-facing in-app toggle for GPU mode, I can add a menu item that sets
and persists a preference; say the word and I'll implement it.
