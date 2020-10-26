### 0.2.0

Append iframe to `html` directly, instead of body, to ensure that it appears on top of other dynamically added elements.

### 0.1.4

Protect against case where user loads script multiple times on same page.

### 0.1.3

IE z-index fix

### 0.1.1

Don't replace state (with 'PLACEHOLDER') while child window is open. This state can "leak", if the parent is reloaded while the child is open, and can cause issues on pages that expect history.state to either be null or an object.

## 0.1.0

Added `isFirstModalLoad()` check inside modal window