/*
	Challenge: in some browsers, history state and sessionStorage are shared between parent window and iframe, assuming they are same-origin.

	We need per-modal history storage, and per-modal session storage.

	We ensure each window has a unique name (which persists between page loads), and use that as unique key.
*/

if (!window.name && window.parent != window) {
	window.name = 'openModal'+Date.now();
}