### 0.3.1
IE bug work-around.
Fix issue where IE was preventing clicking into inputs after closing a modal with a focued input element.

## 0.3.0
Revert 0.2.0 - insert iframe at end of body, not html.

Add 'openModal-iframe' class to the iframe, in case any other scripts need to identify it.

## 0.2.0 - BROKEN IN IE - DO NOT USE

Append iframe to `html` directly, instead of body, to ensure that it appears on top of other dynamically added elements.

PROBLEM: Most things seem to work, but IE doesn't let you insert text into inputs in the iframe if it's inserted directly into html element. They can receive focus, but the cursor isn't in the correct spot, and you can't insert any characters.

### 0.1.4

Protect against case where user loads script multiple times on same page.

### 0.1.3

IE z-index fix

### 0.1.1

Don't replace state (with 'PLACEHOLDER') while child window is open. This state can "leak", if the parent is reloaded while the child is open, and can cause issues on pages that expect history.state to either be null or an object.

## 0.1.0

Added `isFirstModalLoad()` check inside modal window