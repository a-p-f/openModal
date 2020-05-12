/*
	Notes about history:

	When using iframes, different browsers seem to behave differently when it comes to giving access to history.state, and when/where to trigger popstate events.

	We've settled on the following general approach, which seems to work:
	- only pushState or replaceState while your window has focus
	- only expect popstate events while your window has focus
	- only attempt to read history states that were created by your window

	The parent window creates no history entries when opening a modal.
	The child window is responsible to for "unwinding" any history entries it created before it tells the parent to remove it.

	In addition, we may have employed various hacks to get around quirky/buggy behaviour in certain browsers. Such hacks will documented where they are used.
*/

/*
	TODO - add "go back 2 pages" test. Verify that the modal closes, parent ends up in correct state.
*/

// Import for side-effects
// These modules add global functions to window
// Wouldn't work any other way -> some globals need to be declared for parent-child communication
import './modalParent.js';
import './modalChild.js';