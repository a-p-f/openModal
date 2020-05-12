let depthKey;

function isModalChild() {
	// TODO - more robust check?
	return window.parent != window;
}
addEventListener('message', function(e) {
	if (e.source != window.parent) return
	if (e.data == 'MODAL_CLOSE_VALUE_RECEIVED') {
		// Go back to initial state before closing the modal window
		// In some browsers, this will trigger popstate in our window
		// (and our popstate listener will call exit())
		// In other browsers, this will cause a popstate event in the parent window
		history.go(-1 * parseInt(sessionStorage[depthKey]));
	}
});
window.closeModal = function(value) {
	if (!isModalChild()) {
		throw new Error('This is not a modal window');
	}
	// We need to unwind all history we created.
	// Store value for later access, go back in history.
	// The actual exiting will be done in either a popstate listener, or when the initial page reloads (if this unwinds any actual page navigations)

	try {
		window.parent._setOpenModalCloseValue(value);
	} catch(e) {
		// TODO - add test/ensure that this will reach the parent before popstate event (in browsers where the popstate event fires on the parent)
		// Maybe we should just until parent acknowledges message?
		window.parent.postMessage({
			setModalCloseValue: value,
		}, '*');
	}

	// history.go(-1*toUnwind);

	// In some browsers, this is redundant
	// We'll get a popstate event, and call exit() from there
	// In other browsers (Safari), the above "history unwind" causes a popstate event in the parent, NOT in this window
	// exit() is safe to call multiple times - it has a guard so that it only runs once
	// PROBELM: chrome fucks up if we remove iframe before letting the history.go(...) complete
	// exit();
}
function exit() {
	window.parent.postMessage({
		closeModal: true,
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

	/*
		This is what I want to do.
		The problem is, since the "initial state" was not created by this window, IE sometimes lies to us when we get back to the initial state and try to read history.state. Instead of returning null, it actually tells us we are in some in other state.
	*/
	// addEventListener('popstate', function() {
	// 	if (!historyStateIsReadableAndHasKey(depthKey)) {
	// 		// User navigated back to initial state (navigated only over state transitions created with pushState)
	// 		exit();
	// 	}
	// }

	addEventListener('popstate', function() {
		if (!historyStateIsReadableAndHasKey(depthKey)) {
			exit();
			return
		}

		/*
			IE hack
			IE _sometimes_ lies to us about what state we're in, when we've gone back to the initial state.

			If we get a popstate event and history.state[depthKey] hasn't changed, assume we're in the initial state and IE is lying to us.

			ONLY do this for IE 11. Some browsers (Safari) fire popstate events at initial page load (when reloading from history), and that's one case where history.state[depthKey] WILL equal lastDepth.
		*/
		if (navigator.userAgent.indexOf("Trident/7.0") > -1 && history.state[depthKey] == sessionStorage[depthKey]) {
			exit();
			return
		}
		sessionStorage[depthKey] = history.state[depthKey];
	});

	// console.debug('adding popstate listener');
	// addEventListener('popstate', function() {
	// 	console.debug('handling popstate');
	// 	if (!historyStateIsReadableAndHasKey(depthKey)) {
	// 		console.debug('exiting');
	// 		// User navigated back to initial state (navigated only over state transitions created with pushState)
	// 		exit();
	// 	}
	// 	console.debug(history.state);
	// 	setTimeout(function() {
	// 		console.debug(history.state);
	// 	}, 200);
	// });

	prepareChildDocument();
}
