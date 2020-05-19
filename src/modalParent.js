import * as iframe from './iframe.js';
import {lockScroll, releaseScroll} from './lockScroll.js';
import * as onclose_manager from './onclose.js';

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
	if ('closeModalChild' in e.data) {
		closeChild();
	}
});
// same origin children will call this directly, allowing them to pass any value, not just serializable ones
window._setOpenModalCloseValue = function(value) {
	onclose_manager.setValue(value);
	// Tell the child window to unwind its history
	iframe.iframe.contentWindow.postMessage('MODAL_CLOSE_VALUE_RECEIVED', '*');
}
function closeChild() {
	iframe.remove();
	onclose_manager.run();
}

addEventListener('popstate', function() {
	if (iframe.iframe) closeChild();
});

window.openModal = function(url, {
	background=null,
	onload=w=>{},
	onclose=value=>{},
}={}) {
	if (iframe.iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	// savedState = history.state;
	// history.replaceState(BEFORE_MODAL, '', location.href);
	// Create a new empty state
	// We can't attach anything useful to this state, because some browsers, under some conditions, won't let us read it. 
	// It's the same state in which the modal window loads, and it's as if the modal window assumes ownership of this state, so we can't always read it.
	// history.pushState({}, '', location.href);
	onclose_manager.setCallback(onclose);
	iframe.create(url, background, onload);
}
