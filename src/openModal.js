/*!
	openModal.js
	(c) Alex Fischer
	https://github.com/a-p-f/openModal
	https://github.com/a-p-f/openModal/blob/master/LICENSE
*/

// Import for side-effects
// These modules add global functions to window (and event listeners)
// Wouldn't work any other way -> some globals need to be declared for parent-child communication
import './modalParent.js';
import './modalChild.js';
import './targetModal.js';
