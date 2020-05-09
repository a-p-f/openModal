// Import for side-effects
// These modules add global functions to window
// Wouldn't work any other way -> some globals need to be declared for parent-child communication
import './modalParent.js';
import './modalChild.js';

/*
	Several of our modules need to use per-window persistent data storage.
	Some browsers share history.state and sessionStorage between parent window and same-origin iframes.
	We ensure each window has a unique name, and use that as a key for accessing per-window data.
*/
window.name = window.name || 'openModalWindow'+Date.now();

/*
	IE throws error if you try to access history.state from the first history entry of a given tab/window.
	This prevents that (and is easier than guarding all of our accesses to history.state)
*/
const state = (function() {
	try {
		return history.state
	}
	catch(e) {
		return null
	}
})();
history.replaceState(state, '', location.href);
