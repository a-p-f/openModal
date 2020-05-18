import * as iframe from './iframe.js';
import {lockScroll, releaseScroll} from './lockScroll.js';
import * as onclose_manager from './onclose.js';

const BEFORE_MODAL = 'BEFORE_OPENMODAL';

let savedState = null;
let expectToBeInBeforeModalState = false;

// listen to messages from child
addEventListener('message', function(e) {
	const i = iframe.iframe;
	if (!i) return
	if (e.source != i.contentWindow) return

	if (e.data.modalChildTitled) {
		i.setAttribute('aria-label', e.data.modalChildTitled);
	}
	if ('setModalCloseValue' in e.data) {
		_setOpenModalCloseValue(e.data.setModalCloseValue);
	}
	if ('closeModal' in e.data) {
		// The child sends us this message when it gets back to its initial state
		// Go back one more to return to BEFORE_MODAL state
		// expectToBeInBeforeModalState = true;
		// In IE, we must destroy iframe before going back one more time
		// Otherwise, we won't get the popstate event
		iframe.remove();
		expectToBeInBeforeModalState = false;
		console.log('parent going back');
		history.back();
	}
});
// same origin children will call this directly, allowing them to pass any value, not just serializable ones
window._setOpenModalCloseValue = function(value) {
	onclose_manager.setValue(value);
	expectToBeInBeforeModalState = true;
	// Tell the child window to unwind its history
	// We will close it AFTER history unwinds
	iframe.iframe.contentWindow.postMessage('MODAL_CLOSE_VALUE_RECEIVED', '*');
}

/*
	In some browsers (safari), when the modal goes back to it's original history state, the popstate event will be fired in this window.
*/
addEventListener('popstate', function() {
	console.log('popstate in parent');
	if (!iframe.iframe) return
	/*
		Safari Hack!!!
		TODO - explain
		TODO - guard with check? postMessage to child, asking it to check state, verify that it's depth == 1, then go back?
		TODO - see if we still need this
	*/
	if (history.state == BEFORE_MODAL || expectToBeInBeforeModalState) {
		if (!iframe.iframe) {
			throw new Error('No modal window is currently open.');
		}
		releaseScroll();
		iframe.remove();
		history.replaceState(savedState, '', location.href);
		onclose_manager.run();
	}
	/*
		In some browsers (safari), when the user clicks "back" while the modal is open, this popstate event will be fired in this window, rather than in the child.
	*/
	/*
		We SHOULD be able to use the following check.
		For some reason, Safari doesn't let us read this state in certain conditions (when the user opens multiple nested modals, and then hits back multiple times). In that case, Safari just 
	*/
	// else if (history.state && history.state[MODAL_OPEN]) {
	else {
		expectToBeInBeforeModalState = true;
		history.back();
	}
});
// Clear the flag after any popstate event
addEventListener('popstate', function() {
	expectToBeInBeforeModalState = false;
})


window.openModal = function(url, {
	background=null,
	onload=w=>{},
	onclose=value=>{},
}={}) {
	if (iframe.iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	savedState = history.state;
	history.replaceState(BEFORE_MODAL, '', location.href);
	// Create a new empty state
	// We can't attach anything useful to this state, because some browsers, under some conditions, won't let us read it. 
	// It's the same state in which the modal window loads, and it's as if the modal window assumes ownership of this state, so we can't always read it.
	history.pushState({}, '', location.href);

	onclose_manager.setCallback(onclose);
	iframe.create(url, background, onload);
}
