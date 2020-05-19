let depthKey;

function isModalChild() {
	// TODO - more robust check?
	return window.parent != window;
}
function isIE() {
	return navigator.userAgent.indexOf("Trident/7.0") > -1
}
addEventListener('message', function(e) {
	if (e.source != window.parent) return
	if (e.data == 'MODAL_CLOSE_VALUE_RECEIVED') {
		// Go back to initial state before closing the modal window
		history.go(-1 * parseInt(sessionStorage[depthKey]));
	}
});
window.closeModal = function(value) {
	if (!isModalChild()) {
		throw new Error('This is not a modal window');
	}

	// Parent will let us know when it receives this message, then we'll unwind history
	// TODO - test same origin with non-serializable value, test cross-origin
	try {
		window.parent._setOpenModalCloseValue(value);
	} catch(e) {
		window.parent.postMessage({
			setModalCloseValue: value,
		}, '*');
	}
}
function tellParentToCloseUs() {
	window.parent.postMessage({
		closeModalChild: true,
	}, '*');
}
function prepareChildDocument() {
	window.parent.postMessage({
		modalChildTitled: document.title,
	}, '*');

	const target = document.querySelector('[autofocus]');
	if (target) {
		target.focus();
	}
	else {
		document.body.tabIndex = -1;
		document.body.focus();
	}
}
function didNavigateForward() {
	// current API
	try {
		return performance.getEntriesByType('navigation')[0].type == 'navigate';
	} catch(e) {
		// older API
		const n = performance.navigation;
		return n.type === n.TYPE_NAVIGATE
	}
}
/*
	Reminder - if current history state was not created in this window (ie. the "initial state"), then reading it will return null or raise error in some browsers.
*/
function historyStateIsReadableAndHasKey(key) {
	try {
		return key in history.state
	} catch(e) {
		return false
	}
}
/*
	Patch pushState so that it always increments history depth and session depth.

	This allows us to keep track of history depth, even if the document in the modal window is using pushState.

	We do require, however, that you always push a "simple object" (ie. something that serializes to a json dictionary) as the state object, so that we can attach our own data to it.

	TODO - verify that this works
*/
function patchPushState() {
	const _pushState = history.pushState.bind(history);
	history.pushState = function(data, title, url) {
		if (!data || JSON.stringify(data)[0] != '{') {
			throw new Error('Pages inside a modal window may use history.pushState, but they must pass a "simple object" (NOT Array, String, Number, null, etc.) as the state object');
		}
		const newDepth = history.state[depthKey] + 1;		
		sessionStorage[depthKey] = newDepth;
		data[depthKey] = newDepth;
		_pushState(data, title, url);
	}
}

// Make sure this is actually a modal child before we do anything
if (isModalChild()) {
	/*
		We need per-window storage on both the history state entry and in sessionStorage.

		For same-domain iframes, these are shared between iframe and parent window (in some browsers, at least). We need a persistent, unique key to identify this window. We use window name for that key.
	*/
	window.name = window.name || 'openModalWindow'+Date.now();

	depthKey = window.name + 'historyDepth';

	if (!(depthKey in sessionStorage)) {
		/*
			The modal window has just been opened.
			We are in the "initial state".
			Push a new state, so that we can detect history.back().
			If we ever get back to the "initial state", we'll close this modal window.
		*/
		const s = {};
		s[depthKey] = 1;
		history.pushState(s, '', location.href);
		sessionStorage[depthKey] = 1;
	}
	else if(historyStateIsReadableAndHasKey(depthKey)) {
		// This page was reloaded from back/forward
		sessionStorage[depthKey] = history.state[depthKey];
	}
	else if (didNavigateForward()) {
		const newDepth = parseInt(sessionStorage[depthKey]) + 1;
		sessionStorage[depthKey] = newDepth;
		const s = history.state || {};
		s[depthKey] = newDepth;
		history.replaceState(s, '', location.href);
	}
	else {
		// User navigated back to initial state (and that navigation involved actual page navigation, not just states created with pushState)
		tellParentToCloseUs();
	}

	patchPushState();

	addEventListener('popstate', function() {
		if (!historyStateIsReadableAndHasKey(depthKey)) {
			tellParentToCloseUs();
			return
		}

		/*
			IE hack
			IE _sometimes_ lies to us about what state we're in, when we've gone back to the initial state.
			(Only seems to happen if we navigate to new page, then go back to first page, then go back to initial state).

			If we get a popstate event and history.state[depthKey] hasn't changed, assume we're in the initial state and IE is lying to us.

			ONLY do this for IE 11. Some browsers (Safari) fire popstate events at initial page load (when reloading from history), and in that case history.state[depthKey] WILL equal lastDepth.
		*/
		if (isIE() && history.state[depthKey] == sessionStorage[depthKey]) {
			tellParentToCloseUs();
			return
		}

		sessionStorage[depthKey] = history.state[depthKey];
	});

	prepareChildDocument();
}
