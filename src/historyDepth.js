/*
	The purpose of this module is track how "deep" the modal window is in it's own history.

	We need to do this so we can unwind that history before the modal closes.
*/

function key() {
	return window.name+'openModalHistoryDepth';
}
function getSessionDepth() {
	return parseInt(sessionStorage[key()]);
}
function setSessionDepth(value) {
	sessionStorage[key()] = value;
}
function setHistoryDepth(value) {
	const s = history.state || {};
	s[key()] = value;
	history.replaceState(s, '', location.href);
}

export function initialize() {
	/*
		On popstate, restore session depth from history depth
	*/
	addEventListener('popstate', function(e) {
		setSessionDepth(e.state[key()]);
	});

	/*
		Patch pushState so that it always increments history depth and session depth.

		This requires that anyone who uses pushState() in the modal child will only ever push an object as state data, so that we can add a property to that data.
	*/
	const _pushState = history.pushState.bind(history);
	window.pushState = function(data, title, url) {
		const newDepth = getSessionDepth() + 1;
		setSessionDepth(newDepth);

		// TODO: verify that data is an object
		// If data is a string, this assignment won't throw any errors, but the property will not readable on history.state
		data[key()] = newDepth;
		_pushState(data, title, url);
	}

	const s = history.state || {};
	if (key() in s) {
		// this page was loaded from history
		setSessionDepth(s[key()]);
	}
	else {
		// This must be a "new" page -> increment session depth, set history depth
		const newDepth = (function() {
			if (!(key() in sessionStorage)) return 0;
			return getSessionDepth() + 1;
		})();
		setSessionDepth(newDepth);
		setHistoryDepth(newDepth);
	}
}

export function unwind() {
	const toUnwind = getSessionDepth();
	if (toUnwind == 0) return
	history.go(-1 * toUnwind);
}