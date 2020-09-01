### 0.1.1

Don't replace state (with 'PLACEHOLDER') while child window is open. This state can "leak", if the parent is reloaded while the child is open, and can cause issues on pages that expect history.state to either be null or an object.

## 0.1.0

Added `isFirstModalLoad()` check inside modal window