let closeValue;
let depthKey;

function isModalChild() {
	return window.parent != window && window.parent._closeModalWithValue;
}
window.closeModal = function(value) {
	if (!isModalChild()) {
		throw new Error('This is not a modal window');
	}
	// We need to unwind all history we created.
	// Store value for later access, go back in history.
	// The actual exiting will be done in either a popstate listener, or when the initial page reloads (if this unwinds any actual page navigations)
	closeValue = value;
	const toUnwind = parseInt(sessionStorage[depthKey]);
	history.go(-1*toUnwind);
}
function exit() {
	try {
		// if same origin, call function on parent directly
		// this allows us to pass any value
		window.parent._closeModalWithValue(closeValue);
	} catch(e) {
		// parent is cross-origin
		// value must be serializable
		window.parent.postMessage({
			closeModalWithValue: closeValue,
		}, '*');
	}
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


// DEBUG
addEventListener('popstate', function(e) {
	console.log(`popstate in ${location.href}: ${history.state}`);
});


// Make sure this is actually a modal child before we do anything
if (isModalChild()) {
	console.debug('initializing modal child');
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
			Push a new state, so that we detect history.back().
			If we ever get back to the "initial state", we'll close this modal window.
		*/
		history.pushState({[depthKey]: 1}, '', location.href);
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
		exit();
	}

	patchPushState();

	console.debug('adding popstate listener');
	addEventListener('popstate', function() {
		console.debug('handling popstate');
		if (!historyStateIsReadableAndHasKey(depthKey)) {
			console.debug('exiting');
			// User navigated back to initial state (navigated only over state transitions created with pushState)
			exit();
		}
		console.debug(history.state);
	});

	prepareChildDocument();
}
