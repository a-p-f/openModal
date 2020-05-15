/*!
	openModal.js
	(c) Alex Fischer
	https://github.com/a-p-f/openModal
	https://github.com/a-p-f/openModal/blob/master/LICENSE
*/

/*
Notes about history:

When using iframes, different browsers seem to behave differently when it comes to giving access to history.state, and when/where to trigger popstate events.

We've settled on the following general approach, which seems to work (mostly):
- only pushState or replaceState while your window has focus
- only expect popstate events while your window has focus
- only attempt to read history states that were created by your window
- don't replaceState() a state that wasn't created by your window

The parent window creates no history entries when opening a modal.
The child window is responsible to for "unwinding" any history entries it created before it tells the parent to remove it.

Even with the above basic approach, we've still had to employ a few hacks to work around broken behaviour in IE. Those are documented where ever they are used.
*/

// Import for side-effects
// These modules add global functions to window
// Wouldn't work any other way -> some globals need to be declared for parent-child communication
import './modalParent.js';
import './modalChild.js';
import './targetModal.js';
