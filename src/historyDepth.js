import {safeGetState} from './utils.js';

/*
	The purpose of this module is track how "deep" the modal window is in it's own history.

	We need to do this so we can unwind that history before the modal closes.
*/

function key() {
	if (!window.name) {
		throw new Error('You cannot call this until you\'ve given this window a unique name');
	}
	return window.name+'openModalHistoryDepth';
}
function getSessionDepth() {
	return parseInt(sessionStorage[key()]);
}
function setSessionDepth(value) {
	sessionStorage[key()] = value;
}
function setHistoryDepth(value) {
	const s = safeGetState() || {};
	s[key()] = value;
	history.replaceState(s, '', location.href);
}
/*
	Return depth from history.state.
	If this window's depth has not yet been set on the current history entry, return null.
*/
export function getHistoryDepth() {
	const s = safeGetState() || {};
	if (key() in s) return s[key()];
	return null
}

/*
	Patch pushState so that it always increments history depth and session depth.
	
	This allows us to keep track of history depth, even if the document in the modal window is using pushState.

	We do require, however, that you always push a "simple object" (ie. something that serializes to a json dictionary) as the state object, so that we can attach our own data to it.

	TODO - verify that this works
*/
export function patchPushState() {
	const _pushState = history.pushState.bind(history);
	history.pushState = function(data, title, url) {
		if (!data || JSON.stringify(data)[0] != '{') {
			throw new Error('Pages inside a modal window may use history.pushState, but they must pass a "simple object" (NOT Array, String, Number, null, etc.) as the state object');
		}

		const newDepth = getSessionDepth() + 1;		
		setSessionDepth(newDepth);

		data[key()] = newDepth;
		_pushState(data, title, url);
	}

}
function isObject (a) {
    return (!!a) && (a.constructor === Object);
};


export function initialize() {
	/*
		We need per-window storage on both the history state entry and in sessionStorage.

		For same-domain iframes, these are shared between iframe and parent window (in some browsers, at least). We need a persistent, unique key to identify this window. We use window name for that key.
	*/
	window.name = window.name || 'openModalWindow'+Date.now();

	/*
		On popstate, restore session depth from history depth
	*/
	addEventListener('popstate', function(e) {
		const s = safeGetState();
		if (!s || !(key() in s)) {
			setSessionDepth(0);
			return
		}
		setSessionDepth(s[key()]);
	});

	/*
		Determine depth of current page
	*/
	const s = safeGetState() || {};
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

export function isPageZero() {
	return getSessionDepth() == 0;
}
/*
	Create a new history entry which does nothing except increment history/session depth.

	Must be called AFTER initialize().
*/
export function duplicateState() {
	history.pushState(safeGetState(), '', location.href);
}