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
